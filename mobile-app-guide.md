# Mobile App Guide for LLMs (React Native CLI)

You are building a React Native app created with the React Native CLI. It is a bare project with `android/` and `ios/` folders. It is not an Expo project.

Every app in this family must look, feel and behave the same way. Read this file fully before writing code. Follow it on every task. If a request conflicts with this file, say so and ask.

---

## 0. Ground rules

- Language: TypeScript, strict mode. No `any` unless commented.
- Style: Prettier with no semicolons, single quotes, trailing commas.
- Platform: React Native CLI, latest stable React Native, Hermes on. Check the New Architecture status of every native library before adding it.
- Never use Expo packages or Expo Router. Do not suggest `npx expo` commands.
- Navigation: React Navigation.
- Every screen, sheet and component must work in light mode, dark mode, portrait and wide layouts.
- Every list and form must handle loading, empty, error and offline states.
- Never hardcode colors, spacing, font sizes or radii. Use theme tokens.
- Never import XAUI components directly in screens. Import from `src/ui`. See section 3.
- Ship complete files for new features. Use small inline patches for targeted fixes.
- Every native library needs setup steps. List them after the code (section 21).
- Before using a library API, check its current docs. Versions change.

---

## 1. Stack

Core:

- React Native CLI, TypeScript, Hermes
- React Navigation (`@react-navigation/native`, `native-stack`, `bottom-tabs`)
- react-native-reanimated and react-native-gesture-handler
- react-native-safe-area-context and react-native-screens
- react-native-bootsplash for the splash screen

UI:

- XAUI (`@xaui/*`) as the base component library, wrapped by our own design system layer
- @gorhom/bottom-sheet for all sheets
- @shopify/flash-list for long lists
- An image library with caching (`@d11/react-native-fast-image` or the current maintained fork)
- react-native-haptic-feedback for haptics
- react-native-svg and one icon set (lucide-react-native or react-native-vector-icons). Pick one per app.

State and data:

- TanStack Query for server state
- Zustand for client state
- react-native-mmkv for fast local storage
- react-native-keychain for tokens and secrets
- `@op-engineering/op-sqlite` with Drizzle when records need local queries or large offline data
- react-hook-form and zod for forms
- @react-native-community/netinfo for connectivity
- react-native-config for environments

Device features:

- react-native-keychain for biometric gated unlock (section 12)
- react-native-biometrics when only a sensor check is needed
- @react-native-firebase/app and `messaging` for push (FCM on Android, APNs through FCM on iOS)
- A local notification display library (Notifee, if still maintained at the time of setup, otherwise native notification payloads from FCM)
- react-native-orientation-locker for rotation control
- react-native-video for video playback
- react-native-keyboard-controller for keyboard handling
- react-native-permissions for runtime permissions
- react-native-device-info for app and device info
- react-native-background-fetch for periodic sync (verify support per platform)

Quality:

- Sentry for crashes
- Jest and React Native Testing Library for tests
- ESLint and Prettier
- Fastlane and a CI service for builds
- An OTA update option only if the app needs it. CodePush ended with App Center, so pick a self-hosted tool and check its status first.

### About XAUI

XAUI is a Flutter inspired React Native library built on Reanimated with a Tailwind style color palette. Its API may change. Always read the current XAUI docs before using a component. If XAUI lacks a component, build it in `src/ui` with our tokens. Do not add a second UI library.

---

## 2. Folder structure

```
index.js                     Gesture handler import first, then AppRegistry
App.tsx                      Providers and root navigator
babel.config.js              Reanimated plugin must be last
android/  ios/               Native projects
src/
  navigation/
    RootNavigator.tsx        Auth stack or main app
    TabNavigator.tsx         Bottom tabs
    linking.ts               Deep link config
    navigationRef.ts         For routing from outside React (push, lock)
    types.ts                 Typed param lists
  screens/                   Thin screen files that compose features
  ui/                        Design system (wraps XAUI)
    tokens/                  colors, spacing, typography, radii, shadows
    theme/                   ThemeProvider, useTheme
    layout/                  Screen, CollapsibleHeader, FAB, EmptyState
    form/                    TextField, SelectField, Switch, DatePicker, Button
    sheet/                   AppSheet, SheetHost, FormSheet, DetailSheet
    list/                    SwipeableRow, RecordList
    feedback/                Toast, Skeleton, ConnectionBanner
  features/
    [feature]/
      api/                   Query keys, fetchers, mutations
      components/            Feature components, rows, sheets
      hooks/
      schema.ts              zod schemas
      types.ts
  core/
    auth/                    Session, token storage
    biometrics/              Lock store, LockOverlay
    notifications/           Registration, handlers, routing
    offline/                 Query client, persister, network, sync status
    settings/                Preferences store
    orientation/             useLayoutMode hook
    i18n/                    Strings
    logger/
  lib/                       Pure helpers
```

Rules:

- Screen files only compose. Logic lives in `src/features` and `src/core`.
- A feature never imports from another feature. Share through `src/core` or `src/ui`.

---

## 3. Design system

### Why a wrapper

Screens import from `src/ui`. That layer wraps XAUI. If XAUI changes or a component falls short, we fix one file and every app updates.

### Tokens

Define once in `src/ui/tokens`:

- Colors: semantic names, not raw values. `background`, `surface`, `surfaceRaised`, `text`, `textMuted`, `primary`, `onPrimary`, `border`, `danger`, `success`, `warning`.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40.
- Radii: 8, 12, 16, 24, full.
- Type scale: caption, body, bodyStrong, title, headline, display.
- Elevation levels 0 to 4 with shadow and Android elevation values.

### Theme

- Modes: `light`, `dark`, `system`. Default `system`.
- Accent color choice in settings (at least 4 presets).
- `useTheme()` returns `{ colors, spacing, radii, type, mode, isDark }`.
- Persist the choice in MMKV. Read it synchronously before first render to avoid a flash.
- Set the status bar and navigation bar style from the theme.
- Respect system font scaling. Cap at 1.4 to protect layouts.

### Unique but similar

All apps share structure, motion and components. Each app changes only:

- The accent palette
- The app icon and splash
- The display font (optional)
- The empty state illustrations

---

## 4. App shell and providers

`index.js`:

```js
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name } from './app.json';
import { registerBackgroundHandlers } from './src/core/notifications/background';

registerBackgroundHandlers(); // FCM background handler must be set before the app mounts
AppRegistry.registerComponent(name, () => App);
```

Provider order in `App.tsx`, outermost first:

1. `GestureHandlerRootView` (flex 1)
2. `SafeAreaProvider`
3. `KeyboardProvider` (react-native-keyboard-controller)
4. `ThemeProvider`
5. `PersistQueryClientProvider` (offline cache)
6. `BottomSheetModalProvider`
7. `ToastProvider`
8. `NavigationContainer` (with `ref`, theme and `linking`)
9. `RootNavigator` (auth gate decides auth stack or tabs)
10. `ConnectionBanner`
11. `LockOverlay` (always last so it sits on top of everything)

Keep the splash screen visible until fonts, theme, settings and auth state have loaded.

Android edge to edge: handle system bar insets with safe area context. Test on Android 15 and later.

---

## 5. Navigation (React Navigation)

- Root native stack: `Auth` stack and `Main` stack.
- `Main` holds a bottom tab navigator with 3 to 5 tabs. The last two tabs are `Profile` and `Settings` unless the app has a strong reason to change this.
- Each tab owns a native stack for drill down screens.
- Type every param list in `src/navigation/types.ts`. Use typed `useNavigation` helpers.
- Headers are off (`headerShown: false`). Our `Screen` draws the header (section 6).
- Tab icons filled when active, outlined when inactive. Haptic tick on press.
- Tab bar hides in full screen video and on deep detail screens that need space.
- Forms and small details never get their own route. They open in bottom sheets (section 8).
- Deep links: define `linking.ts` with prefixes and a path for every notification target and detail view.
- Export a `navigationRef` and a `navigateWhenReady(name, params)` helper. Push handling and the lock screen use it.
- Android back button: close the top sheet first, then pop the stack, then exit.
- Preserve tab state when switching tabs.
- On expanded layouts the tab bar can become a navigation rail through a custom `tabBar` component.

---

## 6. Custom collapsible header (every screen)

Every screen uses `Screen`, which renders the `CollapsibleHeader`. Never use the default navigation header.

Behavior:

- Expanded state shows a large title, optional subtitle and optional actions row (search, filter).
- On scroll the large title shrinks and fades. A compact bar with a small title and a blurred or solid background stays pinned.
- Back button and trailing actions stay visible in both states.
- Works with `Animated.ScrollView`, `Animated.FlatList` and FlashList.
- Safe area aware. Handles notches and side insets in wide layouts.
- Snaps to expanded or collapsed when scroll ends mid transition.

Pattern:

```tsx
const scrollY = useSharedValue(0);
const onScroll = useAnimatedScrollHandler(e => {
  scrollY.value = e.contentOffset.y;
});

const titleStyle = useAnimatedStyle(() => ({
  opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
  transform: [
    {
      translateY: interpolate(
        scrollY.value,
        [0, 60],
        [0, -12],
        Extrapolation.CLAMP,
      ),
    },
    {
      scale: interpolate(
        scrollY.value,
        [-80, 0],
        [1.08, 1],
        Extrapolation.CLAMP,
      ),
    },
  ],
}));

const compactStyle = useAnimatedStyle(() => ({
  opacity: interpolate(scrollY.value, [40, 80], [0, 1], Extrapolation.CLAMP),
}));
```

API:

```tsx
<Screen
  title="Assets"
  subtitle="124 records"
  headerActions={[{ icon: 'search', onPress }]}
  fab={{ icon: 'plus', actions: [...] }}
  scroll="flatlist"
>
  {/* content */}
</Screen>
```

---

## 7. Floating action button (every screen)

Behavior, modeled on WhatsApp:

- One FAB per screen, bottom right, above the tab bar.
- Use `useBottomTabBarHeight()` from `@react-navigation/bottom-tabs` plus `insets.bottom` plus 16 for the offset. Outside tabs, use `insets.bottom` plus 16.
- In wide layouts, move it clear of the side safe area.
- Single action: tap runs it.
- Multiple actions: tap opens a speed dial with labeled mini buttons stacked upward, plus a dim backdrop. Tap the backdrop or main button to close.
- Extended form (icon and label) at the top of a list. It shrinks to icon only on scroll down and expands on scroll up.
- Hides on keyboard open.
- Uses elevation level 3 and a high `zIndex`. On Android also set `elevation`.
- Bottom sheets must render above the FAB. Gorhom modals mount through a portal above screen content, so keep the FAB inside the screen tree and never inside the modal provider.
- Haptic light impact on press.
- Accessible label required.

---

## 8. Bottom sheets

### Library setup

- Use `BottomSheetModal` from @gorhom/bottom-sheet. It needs Reanimated and Gesture Handler set up first.
- Wrap all sheets in our `AppSheet`. It sets:
  - Rounded top corners, handle, themed background, backdrop with press to close
  - `enablePanDownToClose`
  - `keyboardBehavior="interactive"`, `keyboardBlurBehavior="restore"`, `android_keyboardInputMode="adjustResize"`
  - Content based sizing for small content, snap points `['50%', '90%']` for forms
  - Max width 640 in wide layouts, centered, so sheets do not stretch across a tablet
- Open and close through a typed `SheetHost` store. No screen owns a raw ref.

```ts
sheet.open('asset-form', { assetId });
sheet.open('asset-details', { assetId });
sheet.close();
```

### Form sheets (create and edit)

- Every add, register or edit flow opens in a form sheet. No separate screens.
- Use `BottomSheetScrollView` for the body.
- Use `BottomSheetTextInput` inside sheets. Our `TextField` switches automatically through an `inSheet` context.
- The submit button is sticky and floating at the bottom:
  - Render it in `footerComponent` using `BottomSheetFooter`.
  - Add bottom safe area padding.
  - Add a top hairline or shadow when content scrolls under it.
  - Pad the scroll content bottom by the footer height so the last field is never hidden.
  - Show a loading state. Disable while submitting or invalid.
- Close with a discard guard: if the form is dirty, ask before closing.
- On success: close, toast, and rely on optimistic updates (section 17).

### Detail sheets (view an item)

- Small details open in a detail sheet. Large or media heavy details may use a screen.
- Layout: title, status chip, key value rows, then an action bar (Edit, Archive, Delete, Share).
- Edit swaps the sheet content to the form sheet without closing the backdrop.
- Support stacked sheets with a max depth of 2.

### Rules

- Sheets never sit under the FAB. They take precedence over everything except the LockOverlay and system alerts.
- The Android back button dismisses the top sheet.
- Respect safe areas and the home indicator.
- Sheets must be usable in wide layouts with the keyboard open.

---

## 9. Custom forms and fields

Build all fields in `src/ui/form`. Never use raw `TextInput` or `Pressable` in features.

Components:

- `TextField` (label, helper, error, left and right icons, clear button, secure toggle)
- `TextAreaField` (auto grow)
- `NumberField` and `CurrencyField`
- `PhoneField` (country code)
- `SelectField` (opens a searchable select sheet, supports single and multi)
- `DateField` and `TimeField` (native pickers through `@react-native-community/datetimepicker`)
- `SwitchField`, `CheckboxField`, `RadioGroupField`, `ChipGroupField`
- `ImageField` and `FileField` (camera, gallery, files, with preview and remove)
- `LocationField` (map picker when needed)
- `Button` (variants: primary, secondary, ghost, danger. Sizes: sm, md, lg. States: loading, disabled)
- `IconButton`

Rules:

- Every field is controlled through `react-hook-form` `Controller` wrappers named `FormTextField`, `FormSelectField`, and so on.
- Validation lives in zod schemas in the feature folder. One schema per form.
- Show errors after blur or submit, not on first keystroke.
- Minimum touch target 44 by 44.
- Return key moves to the next field. The last field submits.
- Show conditional fields with a layout animation.
- Set `textContentType` and `autoComplete` for login and profile fields.

---

## 10. Keyboard handling

- Use `react-native-keyboard-controller`.
- In `AndroidManifest.xml` keep `android:windowSoftInputMode="adjustResize"` on `MainActivity`.
- Screens with forms use `KeyboardAwareScrollView` with `bottomOffset`.
- Sticky bars outside sheets use `KeyboardStickyView`.
- Inside sheets use Gorhom keyboard props from section 8.
- The focused field must always be visible with 16 spacing above the keyboard.
- Tapping outside dismisses the keyboard. Scroll views use `keyboardShouldPersistTaps="handled"` and `keyboardDismissMode="interactive"`.
- Test on a small Android device and an iPhone SE class screen.

---

## 11. Lists and swipe actions

Use FlashList with `SwipeableRow` for record rows. Build `SwipeableRow` on `ReanimatedSwipeable` from react-native-gesture-handler.

Gesture rules:

- Swipe left to delete. Reveal a red delete action on the right edge.
- Swipe right to archive. Reveal a neutral archive action on the left edge.
- Full swipe past a threshold commits the action with a haptic.
- Delete always offers Undo in a toast for 5 seconds. Skip the confirm dialog when undo exists.
- Archive also offers Undo.
- Only one row stays open at a time.
- Tap on a row opens the detail sheet. Long press enters multi select with bulk archive and delete.

Mapping:

- `renderRightActions` is revealed when the user swipes left. Put Delete there.
- `renderLeftActions` is revealed when the user swipes right. Put Archive there.

Every list also has:

- Pull to refresh
- Search and filters in the collapsible header
- Skeleton loading rows
- Empty state with an illustration and a call to action
- Error state with retry
- Pagination or infinite scroll with a footer loader
- Stable `keyExtractor`, memoized rows, `getItemType` when rows differ
- A sync badge on rows that have not reached the server yet

---

## 12. Biometric lock screen

Libraries: `react-native-keychain` for the unlock secret, MMKV for the lock settings. Never store the lock secret in MMKV.

Approach:

- When the user turns the lock on, generate a random key and store it in Keychain with biometric access control and device passcode fallback.
- To unlock, read that key. A successful read means the user authenticated.
- This gives the system prompt, passcode fallback and hardware backed protection with no JS side bypass.

```ts
import * as Keychain from 'react-native-keychain';

const service = 'app.lock';

export const enableLock = (key: string) =>
  Keychain.setGenericPassword('lock', key, {
    service,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
    accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  });

export const unlock = async () => {
  const result = await Keychain.getGenericPassword({
    service,
    authenticationPrompt: { title: 'Unlock' },
  });
  return !!result;
};
```

Check the installed version of react-native-keychain for the exact option names.

Behavior:

- `LockOverlay` renders above the whole app, not as a screen. This prevents content flashes.
- Lock on cold start when enabled.
- Lock again when the app returns from background after the grace period (user setting: immediately, 30 seconds, 1 minute, 5 minutes).
- Listen to `AppState`. On `inactive` or `background`, show a privacy cover so the app switcher shows no data.
- Prompt automatically on show. Provide a button to retry.
- Handle: no hardware, nothing enrolled, too many attempts (lockout), user cancel, system cancel.
- After 5 failed attempts offer Log out as the escape route.
- Block taps and accessibility focus on content behind the overlay.
- Biometric lock does not replace token security. Tokens stay in Keychain.
- Turning the lock on in settings requires one successful authentication first.
- Pending notification routes wait until the app is unlocked.

Native setup:

- Android: `USE_BIOMETRIC` permission in `AndroidManifest.xml`.
- iOS: `NSFaceIDUsageDescription` in `Info.plist`.

Optional extras:

- Block screenshots and screen recording on sensitive screens (`FLAG_SECURE` on Android through a small native module or a maintained library, and a cover view on iOS).
- Require re-authentication before sensitive actions (delete account, export data).

---

## 13. Settings and profile

### Settings screen

Grouped sections with a consistent row component (icon, title, subtitle, control).

Appearance:

- Theme (light, dark, system)
- Accent color
- Text size
- Language
- Haptics on or off

Security:

- Biometric lock on or off
- Lock grace period
- Hide content in app switcher
- Change password
- Active sessions and log out of all devices

Notifications:

- Master switch (with link to system settings if denied)
- Per category toggles
- Quiet hours
- Sound and vibration

Data and storage:

- Sync status and Sync now
- Sync over Wi-Fi only
- Clear cache
- Download quality for media
- Export my data

Playback (if the app has video):

- Autoplay
- Default orientation behavior
- Picture in picture

About:

- App version and build (react-native-device-info)
- Terms and privacy
- Licenses
- Contact support and send logs
- Rate the app

Danger zone:

- Log out
- Delete account (with re-authentication)

### Profile screen

- Avatar (change from camera or gallery), name, email, phone, role
- Edit profile in a form sheet
- Linked accounts or organization info
- Quick stats when relevant
- Log out button

All preference changes apply instantly and persist. Preferences live in one Zustand store with MMKV persistence and a version for migrations.

---

## 14. Rotation and wide layouts

Rotation is on by default. Videos and tablets need it.

Native setup:

- Android: `MainActivity` has no fixed `screenOrientation`. Keep `orientation|screenSize|smallestScreenSize|screenLayout` in `configChanges`.
- iOS: `Info.plist` lists all orientations for iPhone and iPad in `UISupportedInterfaceOrientations`.

Code rules:

- `useLayoutMode()` returns `compact`, `medium` or `expanded` based on window width, plus `isLandscape`.
- Never use `Dimensions.get` at module scope. Use `useWindowDimensions`.
- Layout rules:
  - compact: single column, bottom tabs
  - medium (phone rotated, small tablet): two column forms, side safe areas respected, FAB moved inward
  - expanded (tablet): optional list and detail split view, sheets capped at 640 wide
- Use `useSafeAreaInsets` for left and right insets too. Notches move when the phone rotates.
- Grids use column count from layout mode.
- Sheets cap their height at 90 percent so the handle stays reachable.
- Video:
  - Use `react-native-video`.
  - Fullscreen calls `lockToLandscape()` from react-native-orientation-locker and `unlockAllOrientations()` on exit.
  - Hide tab bar, header and FAB in fullscreen. Hide the status bar.
  - Keep the screen awake while playing.
  - Pause on background unless picture in picture is on.
  - Show buffering, error and retry states.
- Test every screen in portrait and rotated before calling it done.

---

## 15. Push notifications

Libraries: `@react-native-firebase/messaging` for delivery, with a local display layer for foreground banners and channels. Backend sends through FCM.

Setup:

- Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS).
- iOS: enable Push Notifications and Background Modes (remote notifications) in Xcode. Upload the APNs key to Firebase.
- Android 13 and later: request `POST_NOTIFICATIONS` at runtime.
- Create Android channels (`default`, `alerts`, `messages`) with proper importance.
- Ask for permission at a meaningful moment, not on first launch. Show a pre-permission sheet that explains the value.
- Register the FCM token after login. Send it to the backend with device id and platform. Remove it on logout. Listen to `onTokenRefresh`.

Payload contract:

```json
{
  "notification": {
    "title": "Payment pending",
    "body": "Invoice 1042 needs your decision"
  },
  "data": {
    "notificationId": "n_123",
    "type": "approval_request",
    "entityType": "invoice",
    "entityId": "1042",
    "actions": "approve,reject,snooze"
  }
}
```

FCM data values are strings. Parse lists and objects.

Routing:

- Foreground: `onMessage` shows an in-app banner. Tapping it behaves like a system tap.
- Background tap: `onNotificationOpenedApp`.
- Killed state tap: `getInitialNotification`.
- All three call `handleNotificationPress(data)`, which saves the item to the local inbox and calls `navigateWhenReady('NotificationDetail', { id })`.
- Wait for navigation to be ready and the lock to be open before navigating.
- Route once. Clear the initial notification after use.

Handler view (`NotificationDetail`):

- Show the full message and a summary of the related entity.
- Buttons: Handle (opens the related record in its sheet or screen), Snooze, Dismiss, Mark as read.
- The user can leave without acting. The item stays in the inbox as unhandled.
- Unknown types show a safe fallback view.

Inbox:

- Stored locally for offline reading
- Unread badge on the header icon or tab
- Swipe to dismiss and archive like other lists
- Filters: all, unhandled, handled
- Keep the app icon badge in sync with the unread count

Background handler:

- `setBackgroundMessageHandler` is registered in `index.js` (section 4). Keep it light. Write to the local inbox and nothing more.
- Never put secrets in a payload.

---

## 16. Offline first and sync

The app must work with no network and with a dead server. The user must never lose data.

### Principles

- The local cache is the source for the UI. The server is the source of truth for sync.
- Reads: show cached data immediately, refresh in the background.
- Writes: apply locally first, queue for the server, retry until it succeeds.
- Network state is not server state. Track both. A phone can have Wi-Fi and a down API. Ping a `/health` endpoint with a short timeout to confirm reachability.

### Setup (default tier)

- TanStack Query with `networkMode: 'offlineFirst'`, a long `gcTime` (24 hours or more) and sensible `staleTime`.
- Bridge NetInfo into `onlineManager`.
- Persist the query cache and paused mutations with `PersistQueryClientProvider` and an MMKV backed persister.
- Register `setMutationDefaults` for every mutation key, so queued mutations can run after an app restart.
- After hydration call `queryClient.resumePausedMutations()`.
- Retry with exponential backoff and jitter. Stop retrying on 4xx other than 408 and 429.

```ts
onlineManager.setEventListener(setOnline =>
  NetInfo.addEventListener(s =>
    setOnline(!!s.isConnected && s.isInternetReachable !== false),
  ),
);

queryClient.setMutationDefaults(['assets', 'create'], {
  mutationFn: createAsset,
  retry: 5,
});
```

### Upgrade tier

When records are large, relational or need local search, use op-sqlite with Drizzle:

- Tables mirror server entities plus `syncStatus` (`synced`, `pending`, `failed`), `updatedAt`, `deletedAt`, `version`.
- An `outbox` table holds operations in order.
- A sync worker drains the outbox when online and on app foreground.
- Pull changes with a `since` cursor.

### Sync rules

- Client generated UUIDs for new records. Send them as idempotency keys so retries never duplicate.
- Soft delete (`deletedAt`) so deletes and archives sync like any update.
- Conflicts: compare `version` or `updatedAt`. Default is last write wins. For sensitive records, return 409 and show a conflict sheet.
- Order matters. Replay operations for the same record in sequence.
- File uploads (photos, documents) go through a separate persistent upload queue with resume support.
- Sync triggers: app foreground, network regained, manual Sync now, every 15 minutes in foreground.
- Background sync through react-native-background-fetch where the platform allows. Treat it as a bonus, never as the only trigger.
- Auth expiry while offline: keep the queue, refresh the token, then continue.

### UX for offline

- `ConnectionBanner` slides in under the header: Offline, Syncing 3 changes, Sync failed. Retry.
- Rows with pending changes show a small clock icon. Failed rows show a warning and a retry action.
- Settings shows last sync time and the pending count.
- Never block the user with a spinner for something that can happen locally.
- Features that truly need the server (payments, live data) show a clear message and disable the action.

---

## 17. Optimistic updates

Apply to create, edit, archive, delete, reorder and toggle actions.

Pattern with TanStack Query:

```ts
useMutation({
  mutationKey: ['assets', 'archive'],
  mutationFn: archiveAsset,
  onMutate: async id => {
    await queryClient.cancelQueries({ queryKey: assetKeys.list });
    const previous = queryClient.getQueryData(assetKeys.list);
    queryClient.setQueryData(assetKeys.list, old => markArchived(old, id));
    return { previous };
  },
  onError: (_err, _id, ctx) => {
    queryClient.setQueryData(assetKeys.list, ctx?.previous);
    toast.error('Could not archive. Restored.');
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: assetKeys.list }),
});
```

Rules:

- Cancel in flight queries before writing the cache.
- Create with a temporary client id. Replace with the server record on success.
- Roll back on permanent failure and tell the user. Keep the item and mark it failed on network failure.
- Update every cache entry that shows the record (list, detail, counts).
- Invalidate on settle, but skip invalidation while offline.
- The UI updates in under 100 ms. Animate list changes with layout animations.

---

## 18. Additional features every app should include

Auth and session:

- Login, register, forgot password, email or phone verification
- Token refresh with a single in flight refresh request
- Tokens in Keychain. Clear all local data on logout, including the queue (warn if unsynced changes exist)
- Session expiry flow that returns to login without losing queued changes

Feedback and polish:

- Toasts with Undo support
- Skeleton loaders, never blank screens
- Empty states and error states with retry
- Haptics on key actions (respecting the settings toggle)
- Smooth shared motion: sheet open, FAB, row removal, tab switch
- Pull to refresh everywhere data loads
- Global error boundary with a friendly screen and a Send report button

Search and discovery:

- Search in the header with recent searches
- Filters and sort in a sheet
- Offline search over cached data

Media:

- Image caching and placeholders
- Camera and gallery picking with compression before upload
- Video playback per section 14

Permissions:

- A single `usePermission` hook on top of react-native-permissions for camera, photos, location, notifications and biometrics
- Pre-permission explainer sheet and a path to system settings when denied

Platform and release:

- Deep links and universal links (Android App Links and iOS Associated Domains)
- Force update and soft update prompts (min version from the backend)
- Environments (dev, staging, production) through react-native-config, Android product flavors and iOS schemes, with separate bundle ids
- Release signing, ProGuard or R8 rules, and Fastlane lanes for both stores
- App icon, adaptive icon, splash screen and store metadata checklist

Accessibility:

- Labels, roles and hints on every touchable
- Support screen readers, large text and reduced motion
- Contrast ratio 4.5 or higher in both themes
- Touch targets 44 by 44 or larger

Localization:

- All user text goes through `t('key')`. Start with English, structure for more languages.
- Dates, numbers and currency use `Intl` with the device locale (make sure Hermes Intl support is enabled for the target).
- Support RTL when the app targets Arabic or Hebrew markets.

Security:

- No secrets in the JS bundle
- HTTPS only, consider certificate pinning for finance and government apps
- Redact PII in logs
- Optional jailbreak and root detection for high risk apps
- Screen capture protection on sensitive screens

Observability:

- Sentry for errors with release and user context (no PII), plus source map upload in CI
- A small `logger` that can export recent logs from Settings
- Basic analytics events for key flows (privacy friendly, opt out in Settings)

Performance:

- FlashList for lists over 30 items
- `React.memo` on rows, stable callbacks, no inline object props in lists
- Reanimated worklets for gesture and scroll animations. No animation on the JS thread.
- Remove console logs in production builds
- Lazy load heavy screens and sheets
- Profile release builds, not debug builds

---

## 19. Testing

- Unit test: schemas, mappers, sync logic, optimistic update helpers.
- Component test: fields, sheets, swipe rows, lock overlay states. Mock native modules in `jest.setup.js`.
- Offline test: create, edit and delete with the network off, then restore and confirm sync with no duplicates.
- Manual device matrix: small Android, large Android, iPhone with notch, tablet, portrait and rotated, light and dark.
- Detox or Maestro for the main flows: login, unlock, add record, swipe delete with undo, notification tap routing.

---

## 20. Definition of done for any screen or feature

- Uses `Screen` with the collapsible header
- Has a FAB when the screen has a primary action
- Adds and edits happen in form sheets with a sticky submit button
- Details open in detail sheets
- List rows swipe left to delete and right to archive, with undo
- Works in light, dark, portrait and rotated
- Keyboard never covers a field
- Loading, empty, error and offline states exist
- Writes are optimistic and queue when offline
- All strings are translatable and all touchables have accessibility labels
- Uses tokens and `src/ui` components only
- Android and iOS both build after a clean install
- Lint, typecheck and tests pass

---

## 21. Instructions for the LLM

Do:

- Plan briefly, then write complete, runnable files.
- List new dependencies with the exact `npm` or `yarn` command.
- After every native library, add a Native setup block with:
  - `cd ios && pod install`
  - Edits to `AndroidManifest.xml`, `build.gradle`, `Info.plist`, `AppDelegate` or `MainApplication`
  - Babel or Metro config changes
  - The need to rebuild the app (`npx react-native run-android` or `run-ios`)
- Keep the Reanimated babel plugin last in `babel.config.js`. Its name depends on the Reanimated version, so check the docs.
- Reuse existing components in `src/ui` before creating new ones.
- Call out any decision that changes this guide.

Do not:

- Use Expo packages, Expo Router or Expo CLI commands.
- Use default navigation headers, `Alert` for forms, or full screen routes for simple forms.
- Use `TextInput`, `Modal` or `Pressable` directly in features.
- Hardcode colors, sizes or strings.
- Put business logic in screen files.
- Block the UI on a network call that can be queued.
- Add a library that duplicates something in the stack above without asking.

When unsure about an XAUI component or API, say so, check the docs, and fall back to a wrapper in `src/ui`.
