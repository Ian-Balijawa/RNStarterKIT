For a reusable React Native CLI starter boilerplate, I’d build a small, polished component system and foundational app services—not just a collection of UI widgets.

The goal is to make future projects start with reliable patterns for navigation, forms, data fetching, offline behavior, permissions, loading/error states, and common mobile interactions.

I’d organize the work into UI components, app-level features, and infrastructure. Some pieces should be generic and reusable; others should be included as optional modules so they don’t burden every project.

## 1. Core reusable UI components

These are the components I’d make consistent across every screen.

| Component                                | What it should support                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `AppButton`                              | Primary, secondary, outline, ghost, danger, loading, disabled, icon-only  |
| `AppText`                                | Typography scale, variants, font scaling, consistent text styles          |
| `AppTextInput`                           | Labels, hints, errors, prefix/suffix icons, clear button, password toggle |
| `AppSearchBar`                           | Debounced search, clear action, loading indicator                         |
| `AppCheckbox` / `AppRadio` / `AppSwitch` | Consistent selection controls                                             |
| `AppSelect`                              | Searchable options, single/multiple selection, custom option rendering    |
| `AppDatePicker`                          | Date, time, date range, min/max dates                                     |
| `AppFormField`                           | Standardized label, control, helper text, validation message              |
| `AppCard`                                | Standard card surfaces and layouts                                        |
| `AppAvatar`                              | Image, initials fallback, status indicator                                |
| `AppBadge`                               | Status, count, category, priority                                         |
| `AppDivider`                             | Consistent separators                                                     |
| `AppIcon`                                | Central icon set, size and color conventions                              |
| `AppChip`                                | Filters, tags, selected values, removable tags                            |
| `AppProgress`                            | Linear, circular, determinate and indeterminate                           |
| `AppSkeleton`                            | Loading placeholders for text, cards, lists and images                    |
| `AppTooltip`                             | Brief contextual help                                                     |
| `AppEmptyState`                          | No data, no search results, no favorites, no history                      |
| `AppErrorState`                          | Error illustration/icon, message, retry action                            |
| `AppLoadingState`                        | Full-screen and inline loading patterns                                   |

React Native already provides primitives such as `View`, `Text`, `TextInput`, `Pressable`, `FlatList`, `Modal`, and `RefreshControl`; the value in your boilerplate is adding shared design, behavior, and accessibility conventions around them.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://reactnative.dev&sz=32)

React Native+1

## 2. Navigation and screen structure

Build a reusable navigation foundation:

- Root navigator — authentication flow versus authenticated app.
- Stack navigation — screens, detail pages, modal routes.
- Bottom tab navigator — icons, labels, active state, badge counts.
- Drawer navigation — optional side menu for admin or enterprise apps.
- Custom header — back button, title, subtitle, actions, transparent header.
- Screen wrapper — safe area, status bar, background, consistent padding.
- Keyboard-aware screen — handles keyboard overlap and focused inputs.
- App-level navigation service — typed navigation helpers where needed.
- Deep-link handler — route users into the right screen from links.
- Navigation guards — authentication and permission-based access.
- Android back behavior — predictable handling for screens, sheets, and dialogs.

React Native itself doesn’t include a navigation system, so this is a library-level decision you should settle early.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.expo.dev&sz=32)

Expo documentation

## 3. Overlays and mobile interactions

These are used repeatedly in modern mobile applications:

- Bottom sheet — snap points, expandable content, scrollable body, keyboard handling.
- Modal — centered, full-screen, confirmation, form modal.
- Confirmation dialog — destructive actions, logout, delete, submit.
- Action sheet — choose an action from a list.
- Toast / snackbar — success, warning, error, undo action.
- Popover — contextual menus and lightweight content.
- Dropdown menu — overflow actions, account menu.
- Image viewer — full-screen image zoom and swipe.
- Media picker wrapper — choose image, video, or document.
- Swipe actions — archive, delete, mark read.
- Pull-to-refresh wrapper — standardized refresh behavior.
- Floating action button — primary screen-level action.
- Haptic feedback helper — optional tactile feedback for meaningful actions.

Give overlays a common API so a screen can invoke a confirmation or toast without building the UI itself.

## 4. Data display and list components

Most business apps are full of lists, tables, and records. These deserve reusable patterns.

- `AppList` — standardized `FlatList` wrapper with separators, padding, empty/loading/error states.
- `AppSectionList` — grouped records such as activity by date.
- `AppListItem` — leading icon/avatar, title, subtitle, metadata, trailing action.
- `AppRecordCard` — compact business record summary.
- `AppDataTable` — horizontal scrolling, sorting, row actions; useful for admin-heavy apps.
- `AppFilterBar` — active filters, clear all, filter count.
- `AppSortMenu` — sort by field and direction.
- `AppPagination` — page controls if the backend uses page-based pagination.
- `AppInfiniteList` — cursor-based loading for feeds and large result sets.
- `AppRefreshableList` — pull-to-refresh with consistent loading behavior.
- `AppTimeline` — events, audit history, tracking updates.
- `AppAccordion` — collapsible sections and detail groups.
- `AppStatCard` — metric value, label, trend, optional icon.
- `AppChartContainer` — shared sizing, loading, error and empty states around charts.

Avoid building a single “universal list” with dozens of props. A small set of focused components is easier to maintain.

## 5. Forms and input workflows

Forms are one of the highest-value areas to standardize, especially for business applications.

- Form provider / form screen wrapper
- Text, number, currency, email, phone and password fields
- Date, time and date-range inputs
- Searchable single-select and multiselect
- Checkbox group and radio group
- Switch / toggle field
- File upload and attachment picker
- Image capture and image picker
- Location picker
- Signature capture, if projects need it
- Repeating field groups
- Conditional fields
- Form-level validation summary
- Dirty-form detection and unsaved-changes prompt
- Submit button with loading and duplicate-submit protection
- Draft save and restore
- Multi-step form / wizard
- Review-before-submit screen

For each field, standardize `value`, `onChange`, `label`, `required`, `disabled`, `error`, and accessibility behavior. For complex forms, use a form library and schema validation rather than inventing your own validation engine.

## 6. Maps and location components

Since you specifically mentioned maps, I’d separate map UI from location and permission logic.

- `AppMapView` — common map configuration, theme, initial region.
- `AppMapMarker` — consistent pin and custom marker support.
- `AppCurrentLocationButton` — move map to the device’s location.
- `AppLocationPicker` — select a location by moving a pin or tapping the map.
- `AppAddressSearch` — place search/autocomplete, backed by a chosen provider.
- `AppCoordinateDisplay` — latitude/longitude formatting and copy.
- `AppMapCallout` — marker detail card.
- `AppRouteOverlay` — route line and route bounds.
- `AppMapBottomSheet` — map results or selected-place details.
- `useLocationPermission` — request/check permission and handle denial.
- `useCurrentLocation` — get coordinates, loading and failure state.
- `useLocationTracking` — optional foreground/background tracking module.

Make provider-specific features optional. Map tiles, geocoding, route calculation, and location tracking may have separate API keys, permissions, or costs.

## 7. Offline mode and local data

MMKV is useful for fast key-value persistence, but it is not by itself a complete offline-first architecture. MMKV supports synchronous key-value access and multiple storage instances; keep sensitive values and larger structured datasets in appropriate storage systems.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.npmjs.com&sz=32)

npm

Build these pieces around it:

- `storage` adapter — typed wrapper around MMKV.
- `secureStorage` adapter — tokens or secrets using platform-appropriate secure storage.
- `useNetworkStatus` — online/offline and connection changes.
- `OfflineBanner` — subtle “You’re offline” status.
- `SyncStatusBadge` — pending, syncing, synced, failed.
- `OfflineScreen` — optional full-screen offline state when the feature truly requires connectivity.
- `PendingChangesScreen` — queued writes and their status.
- `SyncQueue` — durable queue for mutations waiting to sync.
- `SyncManager` — retries, backoff, connectivity-aware processing.
- `ConflictResolver` — handle local and server versions of the same record.
- `CachePolicy` — define which server data is cached and for how long.
- `OfflineFirstRepository` — read local data, sync changes, refresh from server.
- `useAppState` — handle foreground/background transitions and refresh behavior.
- `usePersistedState` — small persistent UI preferences, such as filters or display mode.

Also decide how you will persist structured data. MMKV can store serialized values, but for larger relational datasets or complex queries, consider a local database such as SQLite. Don’t put every API response into one giant MMKV object.

## 8. Authentication, account and security components

- `AppAuthProvider` — authentication state and session lifecycle.
- `AppAuthGuard` — protect authenticated routes.
- `AppPermissionGuard` — permission/role-based screen access.
- `AppUserAvatar` — avatar with fallback.
- `AppAccountMenu` — profile, settings, logout.
- `AppSessionExpiredDialog` — handle expired sessions.
- `AppBiometricPrompt` — optional Face ID / fingerprint integration.
- `AppPinInput` — optional PIN or verification code entry.
- `AppOtpInput` — one-time code entry with paste support.
- `AppPasswordStrength` — optional password feedback.
- `AppLogoutFlow` — clear session-specific cache and persisted state safely.

Keep secrets out of ordinary app preferences. Persisted data should be classified by sensitivity and retention requirements.

## 9. Notifications and communication

- In-app notification center — read/unread, categories, pagination.
- Notification badge — unread count on tabs or icons.
- Push notification handler — permission, registration, token refresh.
- Notification deep-link resolver — open the relevant screen.
- `AppAnnouncementBanner` — app-wide notices.
- `AppContactSupport` — email, phone, WhatsApp or support link.
- `AppShareAction` — share text, links or records.
- `AppClipboard` — copy with feedback.
- `AppFileViewer` — preview supported documents.
- `AppDownloadManager` — download progress, completion and failure handling.

## 10. Device capability wrappers

Keep device APIs behind reusable hooks and services rather than calling them directly throughout screens.

- Camera and image picker
- File/document picker
- File download and upload
- Permission request/check helpers
- Geolocation
- Contacts access, if required
- Biometric authentication
- Clipboard
- Share sheet
- Haptics
- App version/build information
- Device information, where genuinely needed
- App state and foreground/background events
- Keyboard visibility
- Network connectivity
- Link opening and deep linking

React Native’s core APIs cover some common platform features, but navigation, maps, camera and many device capabilities rely on community libraries or native modules.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://reactnative.dev&sz=32)

React Native+2

## 11. App-wide experience components

These are easy to overlook but make a starter feel production-ready.

- Global loading overlay
- Global error boundary
- Global toast host
- Global modal host
- Global bottom-sheet host
- App update prompt
- Maintenance mode screen
- Force-update screen
- No-internet state
- Session-expired state
- Permission-denied state
- Onboarding / walkthrough
- Feature flag wrapper
- Theme provider — light, dark and system theme.
- Localization provider — translations, locale, date and number formatting.
- Accessibility settings — text scaling and reduced-motion behavior.
- App configuration provider — environment-specific app settings.

## 12. Design system foundations

Before building lots of components, define the tokens that drive them:

- Color palette: primary, secondary, background, surface, border, text, success, warning, error.
- Typography: display, heading, body, caption, label.
- Spacing scale.
- Border radius scale.
- Elevation/shadow scale.
- Icon sizes.
- Button heights.
- Input heights.
- Screen gutters.
- Breakpoints or responsive layout rules for tablets.
- Light/dark theme mappings.

Then components should consume tokens instead of hardcoding colors and spacing in each file.

## 13. Suggested boilerplate folder structure

One possible organization:

```
src/
├── app/
│   ├── navigation/
│   ├── providers/
│   ├── config/
│   └── bootstrap/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── feedback/
│   ├── lists/
│   ├── overlays/
│   └── maps/
├── features/
│   ├── auth/
│   ├── notifications/
│   └── settings/
├── hooks/
│   ├── useAppState.ts
│   ├── useNetworkStatus.ts
│   └── usePermissions.ts
├── services/
│   ├── api/
│   ├── storage/
│   ├── location/
│   ├── notifications/
│   └── sync/
├── state/
├── theme/
├── types/
├── utils/
└── testing/
```

Keep feature-specific UI inside its feature. Put only genuinely reusable pieces in `components/`.

## 14. What I would implement first

I’d avoid trying to finish every component before starting a real project. Build the reusable foundation in layers.

Phase 1

Essential foundation

- Theme tokens and `AppText`
- `AppButton`, `AppTextInput`, `AppCard`, `AppIcon`
- Screen wrapper and safe-area handling
- Navigation setup and typed routes
- API client, error handling and loading states
- MMKV storage adapter
- Form fields and validation\

  Phase 2

  Common app features

- Bottom sheet, modal, dialog and toast
- Search, filter, list and empty states
- Authentication and session handling
- Network status and offline banner
- Image/file picker and upload handling
- Permission helpers\

  Phase 3

  Advanced modules

- Offline mutation queue and sync manager
- Maps and location picker
- Push notifications and deep-link routing
- File viewer/download manager
- Biometric authentication
- Analytics, crash reporting and feature flags
- E2E testing and release automation

## 15. Starter dependencies worth evaluating

These are ecosystem choices—not React Native core features. Verify compatibility with your chosen React Native version and New Architecture before locking them into the template.

| Need                    | Common option                                                |
| ----------------------- | ------------------------------------------------------------ |
| Navigation              | React Navigation                                             |
| Bottom sheets           | `@gorhom/bottom-sheet`                                       |
| Gestures                | `react-native-gesture-handler`                               |
| Animations              | `react-native-reanimated`                                    |
| Local key-value storage | `react-native-mmkv`                                          |
| Server-state caching    | TanStack Query                                               |
| Forms                   | React Hook Form                                              |
| Validation              | Zod                                                          |
| Network state           | NetInfo                                                      |
| Maps                    | `react-native-maps`                                          |
| Lists                   | `FlatList` initially; evaluate FlashList for demanding lists |
| Icons                   | A centralized icon library                                   |
| Testing                 | Jest, React Native Testing Library, and an E2E tool          |

My recommendation: treat the boilerplate as a small internal mobile platform. Build the theme, form system, navigation, API handling, storage, feedback UI, and list patterns first. Make maps, offline synchronization, notifications, biometric login, and file workflows modular so each future project can include only what it needs.

For React Native CLI, also keep a dependency compatibility checklist and a clean native setup guide. Native modules can require Android/iOS configuration, and MMKV’s version and architecture requirements should be verified against your app’s RN version.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.npmjs.com&sz=32)

npm+1
