# Pesa Ledger API implementation contract

This document specifies the HTTP API needed to move the current expense tracker from local-only storage to an account-backed service. It is based on the app's `LedgerState`, forms, screens, swipe actions, notification inbox, and offline queue as they exist in this repository. **The API is not implemented or connected yet.** `createApiClient` is available, but `LedgerApp` still reads and writes MMKV; its “ready for sync” count is a local queue, not a successful server sync.

The contract below includes every operation the current user journeys need: sign-in, profile, accounts, categories and subcategories, transactions and transfers, recurring schedules, budgets, archives and restores, notifications, and offline migration/sync. A route listed here is part of the proposed v1 API even when the current UI does not yet call it.

## 1. Decisions to make before implementing

1. **Identity:** use phone one-time codes for the proposed account identity. The profile phone currently is just locally entered text and is **not proof of identity**. Add sign-in UI before sending private ledger data to a server. Device biometrics remain a local screen lock; a successful biometric prompt is not a server credential.
2. **Ownership:** every row belongs to the authenticated user. Derive `userId` from the access token; never accept it in a resource payload or trust an ID without an ownership check.
3. **Currency:** v1 stores integer Uganda shillings (`UGX`). `amount`, `openingBalance`, and `currentBalance` are JSON integers, not formatted strings or floating-point decimal amounts. A positive entry/limit is `1..Number.MAX_SAFE_INTEGER`; entered account balances may be zero, while a derived balance can be negative after spending. Transfers use one transaction with two account IDs.
4. **IDs:** accept client-generated opaque IDs on creates, because records can be created offline. Scope uniqueness to the user and resource type. The current `newId()` values are not UUIDs, so do not make UUID syntax a prerequisite for migration. Keep IDs stable across devices and retries.
5. **Dates:** timestamps are ISO 8601 UTC instants. Periods use the user's IANA time zone, supplied by the client for schedule creation and locally computed views. Weeks begin Monday, matching `periodStart()` in the app. `from` is inclusive and `to` is exclusive.
6. **Archives:** archive means hidden from active lists, not deleted. Archived transactions **still affect account balances, totals, and budget spend**, matching the present calculations. An archived schedule no longer produces future reminders. An archived budget no longer generates limit notices. Restore clears `archivedAt`.
7. **Synchronization:** an ordinary REST call and a queued sync mutation are two ways to execute the _same_ command. Never send both for one local action. The server must make retries idempotent and send a durable change cursor so another device can catch up.

## 2. Common wire rules

- Base path: `/v1`. All endpoints use JSON over HTTPS. Resource and sync routes require `Authorization: Bearer <accessToken>`; the four `/auth` routes use their phone challenge or refresh-token credentials instead.
- Mutating requests require `Idempotency-Key: <stable-client-command-id>`; reuse that key on retries. Updates, archives, restores, and deletes also require `If-Match: "<resource-version>"` (or the equivalent `baseVersion` inside a sync mutation). Creates with an existing ID and a different payload return a conflict.
- Resource responses are the resource object directly. Lists use `{ "items": [...], "nextCursor": null, "hasMore": false }`. `limit` defaults to 50 and is capped at 200. Cursors are opaque. Successful creates return `201` and a resource; updates/actions return `200` and a resource; deletes and logout return `204` with no body.
- Server-owned fields are `version` (integer, starting at 1), `createdAt`, and `updatedAt`. Responses represent an active `archivedAt` as `null`; the current TypeScript model maps this to an absent/undefined field. `version` increments on every mutation.
- Errors use `{ "error": { "code": "VERSION_CONFLICT", "message": "Record changed on another device", "fields": {}, "current": { ... } } }`. `fields` and `current` are optional. Use `400` for malformed JSON, `401` for an invalid/expired session, `403` for forbidden access, `404` for absent or other-user records, `409` for version/business conflicts, `410 CURSOR_EXPIRED` when a change cursor is too old (then bootstrap), `422` for validation errors, `429` for rate limits, and `503` for temporary unavailability. Do not acknowledge an offline mutation after a failed response.
- Validate cross-record references within the same user's ledger. Trim names/notes, reject duplicate category names within the same kind ignoring case, and reject duplicate subcategory names within a category ignoring case. Define maximum lengths, document them in the OpenAPI schema, and return field errors rather than silently truncating values.

### Resource shapes

These are full response shapes. Request shapes in the endpoint tables below exclude server-owned fields unless explicitly stated. `null` is used in responses for absent optional values.

| Type           | Response fields                                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Profile`      | `name: string`, `phone: string` (E.164), `version`, `createdAt`, `updatedAt`                                                                                                                                                                            |
| `Account`      | `id`, `name`, `type: bank\|mobile_money\|cash\|business\|loan\|other`, `openingBalance: integer`, `currentBalance: integer` (derived), `hasLinkedRecords: boolean` (derived), `archivedAt: timestamp\|null`, `version`, `createdAt`, `updatedAt`        |
| `Category`     | `id`, `name`, `kind: expense\|income`, `subcategories: string[]`, `version`, `createdAt`, `updatedAt`                                                                                                                                                   |
| `Transaction`  | `id`, `kind: expense\|income\|transfer`, `amount: positive integer`, `accountId`, `toAccountId: string\|null`, `categoryId: string\|null`, `subcategory: string\|null`, `note: string`, `occurredAt`, `archivedAt`, `version`, `createdAt`, `updatedAt` |
| `Schedule`     | Transaction fields except `occurredAt`, plus `nextAt`, `recurrence: daily\|weekly\|monthly\|quarterly\|yearly`, `timeZone: IANA string`, `archivedAt`, `version`, `createdAt`, `updatedAt`                                                              |
| `Budget`       | `id`, `name`, `categoryId`, `subcategory: string\|null`, `amount: positive integer`, `period: weekly\|monthly\|yearly`, `timeZone: IANA string`, `archivedAt`, `version`, `createdAt`, `updatedAt`                                                      |
| `Notification` | `id`, `title`, `body`, `createdAt`, `readAt: timestamp\|null`, `sourceId: string\|null`, `eventKey: string`                                                                                                                                             |

For an expense or income, `categoryId` is required, `toAccountId` is null, and the category kind must match the entry kind. For a transfer, `toAccountId` is required and differs from `accountId`; `categoryId` and `subcategory` are null. A selected subcategory must belong to the selected category. A budget must target an expense category; null `subcategory` means the entire category. The server stores `openingBalance` as the accounting base and computes `currentBalance = openingBalance + all linked transaction effects`, including archived transactions. The account edit form currently asks for a **current** balance: on update the server must recalculate `openingBalance` atomically so the requested current balance is preserved.

## 3. Endpoint inventory and exact contracts

In the tables, `Account`, `Transaction`, etc. mean the full response shapes above; `List<T>` is the common paginated envelope. Body fields shown without `?` are required. All resource IDs in paths are opaque strings. An empty body is written as “none.”

### Authentication (4 endpoints)

The proposed sign-in flow needs new client screens and secure token storage. Rate-limit requests by phone, device, and IP; expire one-time codes quickly; never return a code in a response.

| Method and path             | Request payload                                                           | Success response                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `POST /v1/auth/otp/request` | `{ "phone": "+256700000000" }`                                            | `202 { "challengeId": "ch_...", "expiresAt": "...", "resendAfterSeconds": 30 }`                                         |
| `POST /v1/auth/otp/verify`  | `{ "challengeId": "ch_...", "code": "123456", "deviceId": "device_..." }` | `200 { "accessToken": "...", "expiresInSeconds": 900, "refreshToken": "...", "userId": "user_...", "isNewUser": true }` |
| `POST /v1/auth/refresh`     | `{ "refreshToken": "...", "deviceId": "device_..." }`                     | `200 { "accessToken": "...", "expiresInSeconds": 900, "refreshToken": "..." }` (rotate refresh token)                   |
| `POST /v1/auth/logout`      | `{ "refreshToken": "...", "deviceId": "device_..." }`                     | `204`, revokes that device's refresh session                                                                            |

The client must keep refresh tokens in platform secure storage, never in the existing MMKV preferences store. `deviceId` is a stable installation identifier, not a substitute for authentication. An expired access token may be refreshed once, then the original request retried with the same idempotency key.

### Profile (2 endpoints)

| Method and path   | Request payload                                                                                            | Success response                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `GET /v1/profile` | none                                                                                                       | `200 { "profile": Profile or null }` |
| `PUT /v1/profile` | `{ "name": "Amina N.", "phone": "+256700000000" }`; `If-Match` required when replacing an existing profile | `200 { "profile": Profile }`         |

Name is nonblank; phone must be valid and normalized to E.164. Changing the profile phone does not change the verified sign-in phone; that would require a separate re-verification flow if added later.

### Accounts (7 endpoints)

| Method and path                  | Request payload                                                                                                   | Success response                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `GET /v1/accounts`               | Query: `includeArchived=false`, `cursor?`, `limit?`                                                               | `200 List<Account>`; active only by default                                                                              |
| `GET /v1/accounts/{id}`          | none                                                                                                              | `200 Account`                                                                                                            |
| `POST /v1/accounts`              | `{ "id": "cash-2", "name": "Cash", "type": "cash", "currentBalance": 50000 }`                                     | `201 Account`; initial `openingBalance` equals `currentBalance`                                                          |
| `PATCH /v1/accounts/{id}`        | Any nonempty subset of `{ "name": string, "type": Account.type, "currentBalance": integer }`; `If-Match` required | `200 Account` with recalculated `openingBalance` if balance changed                                                      |
| `POST /v1/accounts/{id}/archive` | none; `If-Match` required                                                                                         | `200 Account` with `archivedAt` set                                                                                      |
| `POST /v1/accounts/{id}/restore` | none; `If-Match` required                                                                                         | `200 Account` with `archivedAt: null`                                                                                    |
| `DELETE /v1/accounts/{id}`       | none; `If-Match` required                                                                                         | `204` only if no transaction or schedule references it; otherwise `409 ACCOUNT_HAS_DEPENDENCIES` with `canArchive: true` |

The Accounts screen swipes right to archive and left to delete. The current client converts a delete attempt on a linked account into an archive confirmation; the server must enforce that rule independently. Archived accounts remain valid references on historical transactions but cannot be chosen for new entries/transfers.

### Categories and subcategories (4 endpoints)

| Method and path                          | Request payload                                                                                                                       | Success response                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `GET /v1/categories`                     | Query: optional `kind` (`expense` or `income`), `cursor?`, `limit?`                                                                   | `200 List<Category>`                               |
| `GET /v1/categories/{id}`                | none                                                                                                                                  | `200 Category`                                     |
| `POST /v1/categories`                    | `{ "id": "education", "name": "Education", "kind": "expense", "subcategories": ["Tuition", "Books"] }` (`subcategories` may be empty) | `201 Category`                                     |
| `POST /v1/categories/{id}/subcategories` | `{ "name": "School fees" }`; `If-Match` required                                                                                      | `200 Category` containing the appended subcategory |

The client currently has no category rename, category delete, or subcategory rename/delete action, so those routes are not needed for v1. Inline “Add category” and “Add subcategory” inside the transaction form use the same endpoints. The default category IDs/names in `INITIAL_LEDGER` must be seeded once per user or imported from the device; never duplicate them on each login.

### Transactions, including transfers (6 endpoints)

| Method and path                      | Request payload                                                                                                                                                                                                                                                                                            | Success response                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET /v1/transactions`               | Query: `from?`, `to?`, `kind?`, `accountId?`, `categoryId?`, `includeArchived=false`, `cursor?`, `limit?`; sort newest `occurredAt` first                                                                                                                                                                  | `200 List<Transaction>`                                               |
| `GET /v1/transactions/{id}`          | none                                                                                                                                                                                                                                                                                                       | `200 Transaction` for detail sheet                                    |
| `POST /v1/transactions`              | Expense/income: `{ "id": "tx-1", "kind": "expense", "amount": 25000, "accountId": "cash", "categoryId": "food", "subcategory": "Groceries", "note": "Lunch", "occurredAt": "2026-11-04T10:00:00.000Z" }`; transfer: same common fields with `kind: "transfer"`, `toAccountId`, and no category/subcategory | `201 Transaction`; account balances and derived totals now include it |
| `POST /v1/transactions/{id}/archive` | none; `If-Match` required                                                                                                                                                                                                                                                                                  | `200 Transaction` with `archivedAt` set                               |
| `POST /v1/transactions/{id}/restore` | none; `If-Match` required                                                                                                                                                                                                                                                                                  | `200 Transaction` with `archivedAt: null`                             |
| `DELETE /v1/transactions/{id}`       | none; `If-Match` required                                                                                                                                                                                                                                                                                  | `204`; removes its accounting effect                                  |

The client has no transaction edit form. Expense, income, and transfer all use `POST /transactions`; there is no separate transfer endpoint. Archive only affects visibility. Delete changes balances, gross totals, period totals, category spend, and budgets; compute those from current server records rather than cached counters without invalidation.

The full transfer create body is `{ "id": "tx-transfer-1", "kind": "transfer", "amount": 50000, "accountId": "cash", "toAccountId": "bank", "note": "Deposit", "occurredAt": "2026-11-04T10:00:00.000Z" }`. An income body has the same fields as the expense example, with `kind: "income"` and an income-category `categoryId`.

### Recurring schedules (7 endpoints)

| Method and path                   | Request payload                                                                                                                                                                                                                                    | Success response                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `GET /v1/schedules`               | Query: `includeArchived=false`, `cursor?`, `limit?`; sort soonest `nextAt` first                                                                                                                                                                   | `200 List<Schedule>`                                       |
| `GET /v1/schedules/{id}`          | none                                                                                                                                                                                                                                               | `200 Schedule` for detail sheet                            |
| `POST /v1/schedules`              | `{ "id": "rent-reminder", "kind": "expense", "amount": 100000, "accountId": "cash", "categoryId": "housing", "subcategory": "Rent", "note": "Rent", "nextAt": "2027-01-01T09:00:00.000Z", "recurrence": "monthly", "timeZone": "Africa/Kampala" }` | `201 Schedule`                                             |
| `POST /v1/schedules/{id}/record`  | `{ "transactionId": "tx-from-rent-1", "occurredAt": "2027-01-01T09:05:00.000Z", "expectedNextAt": "2027-01-01T09:00:00.000Z" }`; `If-Match` required                                                                                               | `200 { "transaction": Transaction, "schedule": Schedule }` |
| `POST /v1/schedules/{id}/archive` | none; `If-Match` required                                                                                                                                                                                                                          | `200 Schedule` with `archivedAt` set                       |
| `POST /v1/schedules/{id}/restore` | none; `If-Match` required                                                                                                                                                                                                                          | `200 Schedule` with `archivedAt: null`                     |
| `DELETE /v1/schedules/{id}`       | none; `If-Match` required                                                                                                                                                                                                                          | `204`; future reminders canceled                           |

`/record` is one database transaction: create a new ordinary transaction using the schedule's financial fields, advance `nextAt` to the first future recurrence, and emit the “Scheduled entry recorded” notice. The `transactionId`/idempotency key and `expectedNextAt` prevent double recording. Return `409 SCHEDULE_OCCURRENCE_CHANGED` with the current schedule when another device already advanced it. Reject archived schedules. Recurrence is calculated in the schedule's IANA time zone at the same local wall time. Preserve the current month-end clamp rule; for a nonexistent daylight-saving local time, shift forward to the next valid time, and for an ambiguous repeated time choose the earlier offset. The client schedules/cancels local Notifee reminders from the returned active schedules. OS permission prompts and notification settings remain device APIs, not HTTP endpoints.

### Budgets (7 endpoints)

| Method and path                 | Request payload                                                                                                                                                                   | Success response                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `GET /v1/budgets`               | Query: `includeArchived=false`, `cursor?`, `limit?`                                                                                                                               | `200 List<Budget>`                   |
| `GET /v1/budgets/{id}`          | none                                                                                                                                                                              | `200 Budget`                         |
| `POST /v1/budgets`              | `{ "id": "food-budget", "name": "Food", "categoryId": "food", "subcategory": null, "amount": 200000, "period": "monthly", "timeZone": "Africa/Kampala" }`                         | `201 Budget`                         |
| `PATCH /v1/budgets/{id}`        | Any nonempty subset of `name`, `categoryId`, `subcategory` (string or null), `amount`, `period` (`weekly`, `monthly`, or `yearly`), `timeZone` (IANA string); `If-Match` required | `200 Budget`                         |
| `POST /v1/budgets/{id}/archive` | none; `If-Match` required                                                                                                                                                         | `200 Budget` with `archivedAt` set   |
| `POST /v1/budgets/{id}/restore` | none; `If-Match` required                                                                                                                                                         | `200 Budget` with `archivedAt: null` |
| `DELETE /v1/budgets/{id}`       | none; `If-Match` required                                                                                                                                                         | `204`                                |

The UI defaults an empty budget name to its subcategory or category name; the server may apply the same rule. `spent` is derived from matching expense transactions in the selected Monday-based week, calendar month, or calendar year **in the budget's `timeZone`**; a budget does not change account balances. A limit notice is generated when a new expense moves spend from below the limit to at or above it, at most once per budget and period instance. An archived budget may still be read/restored but should not produce new notices. The current local `Budget` type and `budgetSpent()` use the device time zone; add `timeZone` to the client model and update that calculation before connecting to this API.

### Notification inbox (3 endpoints)

| Method and path                     | Request payload                                                                            | Success response                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `GET /v1/notifications`             | Query: `unreadOnly=false`, `cursor?`, `limit?`; newest first                               | `200 { "items": Notification[], "nextCursor": string or null, "hasMore": boolean, "unreadCount": integer }` |
| `PATCH /v1/notifications/{id}/read` | `{ "readAt": "2026-11-04T10:05:00.000Z" }`                                                 | `200 Notification`; repeat is idempotent and retains the first read time                                    |
| `POST /v1/notifications/read-all`   | `{ "readAt": "2026-11-04T10:05:00.000Z", "throughCreatedAt": "2026-11-04T10:04:59.000Z" }` | `200 { "updatedCount": 3, "unreadCount": 0, "readAt": "..." }`                                              |

`throughCreatedAt` is the newest notice visible when the user tapped “Mark all as read”; later notices must stay unread, including when this command syncs after an offline period. The backend creates notices for recorded transactions/transfers, saved schedules, recorded schedules, due schedule occurrences, and budget limit crossings. Give each event a stable `eventKey` for deduplication and preserve `sourceId` so the client can navigate or reconcile locally generated notices. The current app retains the most recent 200 notices; v1 may use the same retention policy, but the unread count must describe the retained inbox consistently. The app may continue to display local Notifee alerts; a backend push service/device-token endpoint is **not required** until remote push delivery is deliberately added.

### Offline bootstrap, changes, writes, and local-data migration (4 endpoints)

| Method and path           | Request payload                                                                                                                                                       | Success response                                                                                                                                                                                                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /v1/sync/bootstrap`  | none                                                                                                                                                                  | `200 { ledger: { accounts: Account[], categories: Category[], transactions: Transaction[], schedules: Schedule[], budgets: Budget[] }, profile: Profile or null, notifications: Notification[], unreadCount: integer, cursor: string, serverTime: ISO timestamp }`; include active **and archived** records |
| `GET /v1/sync/changes`    | Query: `cursor` (required), `limit?`                                                                                                                                  | `200 { changes: Change[], nextCursor: string, hasMore: boolean }`; a `Change` has `cursor`, `collection` (one of the five ledger arrays, `profile`, or `notifications`), `recordId`, `action` (`upsert` or `delete`), and `value` (resource object or null)                                                 |
| `POST /v1/sync/mutations` | `{ "deviceId": "device_...", "mutations": Mutation[] }`; max 100, sent in dependency order                                                                            | `200 { "results": MutationResult[], "cursor": string }`; one result per input ID, in input order                                                                                                                                                                                                            |
| `POST /v1/sync/import`    | `{ deviceId: string, timeZone: IANA string, source: "mmkv-v1", ledger: LedgerState, profile: { name: string, phone: string } or null, notifications: LocalNotice[] }` | `200 { "imported": { "accounts": 3, "categories": 11, "transactions": 0, "schedules": 0, "budgets": 0, "notifications": 0 }, "cursor": string }` when the server ledger is empty; replay of the same idempotency key returns the same result                                                                |

`/sync/import` is a one-time, atomic migration of an existing device ledger after sign-in. `LocalNotice` is `{ id, title, body, createdAt, readAt?, sourceId? }`; the server derives a unique `eventKey` such as `import:{deviceId}:{id}`. Existing local account/category/transaction/schedule/budget objects may lack server `version`/timestamps, and legacy schedules/budgets lack `timeZone`; the server assigns metadata and uses the importing device's IANA `timeZone` for those records. Reject import into a nonempty remote ledger with `409 IMPORT_CONFLICT`; the client must then pull and resolve/merge local records before uploading them as normal mutations. Never replace remote data wholesale. Import the local profile/inbox too, but do not treat its phone number as verified authentication data. After first sign-in, import **before** a first bootstrap if local data exists. Once import succeeds, clear the local pending changes that were included in its snapshot; do not resend them through `/sync/mutations`. If there is no existing local data, seed `INITIAL_LEDGER` defaults once on the server during the first bootstrap.

Every `Mutation` has a stable `id` and one of the following exact shapes. `baseVersion: null` means create. A record `upsert` is a complete canonical resource value (minus server metadata and derived fields), except that account creates supply `openingBalance` and account balance edits use `account_update`. A record `delete` has no `value`.

| `action`                | Other required fields                                                                                                                                        | Server operation                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `upsert`                | `collection` (one of five ledger arrays), `recordId`, `baseVersion` (integer or null), `value` (resource input object)                                       | Create/replace a record with normal resource validation. `archivedAt` set/cleared performs archive/restore side effects. |
| `delete`                | Same `collection`, `recordId`, `baseVersion` (integer), `value: null`                                                                                        | Same rules as that resource's `DELETE`.                                                                                  |
| `account_update`        | `collection: "accounts"`, `recordId`, `baseVersion` (integer), `value: { name?: string, type?: Account.type, currentBalance?: integer }`                     | Same atomic calculation as `PATCH /accounts/{id}`.                                                                       |
| `record_schedule`       | `collection: "schedules"`, `recordId`, `baseVersion` (integer), `value: { transactionId: string, occurredAt: ISO timestamp, expectedNextAt: ISO timestamp }` | Same atomic operation as `POST /schedules/{id}/record`.                                                                  |
| `profile_put`           | `collection: "profile"`, `recordId: "self"`, `baseVersion` (integer or null), `value: { name: string, phone: string }`                                       | Same as `PUT /profile`.                                                                                                  |
| `notification_read`     | `collection: "notifications"`, `recordId` (notification ID), `value: { readAt: ISO timestamp }`                                                              | Same as `PATCH /notifications/{id}/read`; no version needed because reading is idempotent.                               |
| `notification_read_all` | `collection: "notifications"`, `recordId: "all"`, `value: { readAt: ISO timestamp, throughCreatedAt: ISO timestamp }`                                        | Same as `POST /notifications/read-all`.                                                                                  |

An `upsert` of a category carries the entire `subcategories` array, including an offline-added subcategory. An account `upsert` may create or archive/restore an account, but changing the amount the user typed as “current balance” requires `account_update` so simultaneous transaction changes cannot silently alter that intent. A batch example:

```json
{
  "deviceId": "device_a",
  "mutations": [
    {
      "id": "m_category_1",
      "collection": "categories",
      "recordId": "education",
      "action": "upsert",
      "baseVersion": null,
      "value": {
        "id": "education",
        "name": "Education",
        "kind": "expense",
        "subcategories": []
      }
    },
    {
      "id": "m_transaction_1",
      "collection": "transactions",
      "recordId": "tx_123",
      "action": "upsert",
      "baseVersion": null,
      "value": {
        "id": "tx_123",
        "kind": "expense",
        "amount": 25000,
        "accountId": "cash",
        "categoryId": "education",
        "subcategory": null,
        "note": "Books",
        "occurredAt": "2026-11-04T10:00:00.000Z"
      }
    }
  ]
}
```

`MutationResult` is `{ "id": string, "status": "applied"|"duplicate"|"conflict"|"rejected", "record": object|null, "error": { "code": string, "message": string, "current"?: object }|null }`. For `record_schedule`, `record` is `{ transaction: Transaction, schedule: Schedule }`; for `notification_read_all`, it is the read-all response object. `duplicate` means the server already committed that mutation ID. Only `applied`/`duplicate` can be acknowledged and removed from the local queue. The server must validate each upsert with the same rules as the corresponding resource endpoint; never accept an arbitrary row replacement that bypasses account, category, or amount checks. Process the batch in input order and emit ordered change events. If a mutation fails, a later mutation that depends on it is rejected with a dependency error, not partially applied against missing data.

The current queue only models `upsert`/`delete` for the five ledger arrays. Extend it before connecting the API to carry `baseVersion` and the additional actions above. When coalescing offline edits, keep the original server `baseVersion`; a create followed by a delete before either reached the server should remove both queued mutations. Do not approximate `record_schedule` with separate transaction and schedule upserts. If the server rejects a mutation with a conflict, keep the local edit pending and show a resolvable state; never silently overwrite the other device's version. Applying pulled changes must preserve still-pending local edits until they are resolved.

## 4. Map current app actions to the API

| Client flow                                                                                         | API operation(s)                                                                                           |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| First sign-in with existing local ledger                                                            | OTP request/verify → `/sync/import` once → `/sync/bootstrap`                                               |
| App launch on an existing account; pull to refresh                                                  | `/auth/refresh` if needed → `/sync/changes?cursor=...` until `hasMore=false`; bootstrap if no valid cursor |
| Create/edit profile                                                                                 | `GET /profile`, `PUT /profile` or queued profile mutation                                                  |
| Create/edit/archive/restore/delete account                                                          | Account create/update/archive/restore/delete routes or equivalent queued mutations                         |
| Add category or subcategory in Categories or a form                                                 | Category create or subcategory append route; queue a category upsert offline                               |
| Record expense, income, or transfer                                                                 | `POST /transactions` or queued transaction create                                                          |
| Open transaction detail; swipe archive/delete; restore in Profile                                   | Transaction detail/archive/delete/restore routes or queued mutations                                       |
| Save scheduled entry; open detail; record now; archive/delete/restore                               | Schedule create/detail/record/archive/delete/restore routes or queued commands                             |
| Create/edit budget; swipe archive/delete; restore                                                   | Budget create/update/archive/delete/restore routes or queued mutations                                     |
| Open inbox, badge count, mark one/all read                                                          | Notification list/read/read-all routes or queued read commands                                             |
| Overview balances, income/expense totals, category breakdown; budget progress; Profile gross totals | Compute from the synchronized local ledger exactly as today; **no separate summary endpoint is required**  |
| Biometric unlock, theme, notification permission/settings, local reminder display                   | Device/local APIs; **no backend route is required**                                                        |

## 5. Server behavior and acceptance checks

1. Use tables for users, device sessions, accounts, categories/subcategories, transactions, schedules, budgets, notifications, idempotency keys, and an ordered per-user change log. Store resource versions and timestamps. Protect all queries and foreign keys with user ownership. Keep a unique index on `(user_id, collection, client_id)` and on `(user_id, mutation_id)`.
2. Create/update/delete account and transaction data inside database transactions so derived balances cannot observe a half-written transfer. `record_schedule` must create the transaction and advance the schedule atomically. Generate notices in the same transaction or through an outbox that guarantees eventual once-only delivery.
3. Compute active list filtering and restore semantics exactly as specified. Deleting a linked account is rejected; deleting a transaction reverses its financial effect; archiving a transaction does not. Scheduled entries do not affect balances until recorded. Archive/delete of a schedule cancels future due processing; restore reschedules it.
4. Run a due-schedule worker using stable occurrence keys such as `schedule:{id}:{nextAt}`. It should create one inbox notice per due occurrence, even with retries or multiple workers. Do not repeatedly notify every time the mobile app opens. Budget-crossing notices need similarly stable `budget:{id}:{periodStart}` keys.
5. Test validation, ownership isolation, idempotent retries, account deletion rules, transfer arithmetic, archive/restore, conflict responses, cursor pagination, offline mutation ordering, duplicate `record_schedule`, month-end recurrence, and a first-time MMKV import. Publish an OpenAPI document whose routes and examples match this file.
6. Connect the mobile app in stages: add authentication and secure token storage; import/bootstrap the local ledger; send queued mutations; pull changes on launch, foreground, and refresh; persist the new cursor; acknowledge only successful mutation IDs; then move profile and inbox off their separate MMKV-only keys. Keep local-first rendering and local reminder scheduling so the app remains usable offline.
