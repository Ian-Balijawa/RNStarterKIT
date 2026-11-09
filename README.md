# Church Contributions

A local-first React Native CLI mobile app for church projects, members, recurring pledges and payments in whole Uganda shillings (UGX).

Register churches and members, assign a home church and additional links, create projects with an owner and participating churches, and record pledges from members of any church. Pledges can be paused, resumed, cancelled or changed from an effective date. Payments may target a project or be distributed across a member's projects, with an allocation preview. Payment history supports voids with a reason. Member details include balances and a period statement; the dashboard and reports show contribution and debt summaries.

Daily, weekly and monthly periods use the Kampala calendar. Earlier unpaid periods are overdue; the current period is due now. Payments cover the oldest eligible periods first, including the current period before future advance. The calculation rules, assumptions and local entity relationships are in [MOBILE_IMPLEMENTATION.md](MOBILE_IMPLEMENTATION.md).

This is a frontend-first, device-local implementation. It has no login, role enforcement, shared audit log, cloud backup or sync, and it does not process mobile-money payments. Local data can be lost if app data is removed. PDF/CSV export and unallocated-credit reassignment are not yet available. It should not be treated as a shared production financial system until the backend and access controls are implemented.

## Run

Install dependencies with `bun install`, install iOS pods with `cd ios && pod install`, then run `bun run start` and `bun run ios` or `bun run android` from the project root. This uses React Native CLI, not Expo. Native dependencies are already declared; rerun `pod install` after dependency changes on iOS.

## Check

```sh
npx tsc --noEmit
npm run lint
npm test -- --runInBand --watchman=false
```

The models, allocation logic, derived local balances, screens and MMKV persistence are in `src/features/contributions`. XAUI is configured at the application theme boundary and shared buttons wrap its Button component.
