# React Native starter

A React Native CLI starter built from the priorities in [`setup.md`](setup.md). `App.tsx` is a working gallery for the reusable foundation; replace its example screens when starting a product.

## Run

```sh
npm install
npm start
npm run android
# On macOS, after installing or changing native packages:
cd ios && pod install && cd ..
npm run ios
```

Quality checks:

```sh
npx tsc --noEmit
npm run lint
npm test -- --runInBand --watchman=false
```

## Reuse

Import UI, hooks, and services from `src/index.ts`. `AppThemeProvider` and `SafeAreaProvider` wrap the app in `App.tsx`; `AppToastProvider` enables `useAppToast`. `AppBottomSheetProvider` adds one sheet host for the whole app: call `useAppBottomSheet().showSheet({ title, children })` from any screen and `hideSheet()` to close it. Components use `Pressable`, `StyleSheet`, safe area insets, accessible labels, and theme tokens.

| Area              | Included                                                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme             | Light, dark, and system color modes; color, spacing, and radius tokens                                                                                               |
| UI                | Text, buttons, icons, cards, dividers, badges, chips, avatars, progress, skeletons, tooltips, floating action button                                                 |
| Forms             | Text and search inputs, checkbox, radio, switch, searchable select, native date/time and date range inputs, React Hook Form field, duplicate protected submit button |
| Feedback          | Empty, error, loading, offline banner, dialog, global toast, reusable bottom sheet, error boundary                                                                   |
| Screens and lists | Safe area screen, keyboard-aware scroll layout, list and list item                                                                                                   |
| Navigation        | Typed native stack, four native bottom tabs with labels and badges, auth/app route grouping, navigation ref                                                          |
| Maps              | Google Maps view, markers, route polyline, tap-to-select location, coordinate display                                                                                |
| Services          | Typed API client with errors and auth callback, MMKV preferences adapter, memory storage for tests, persisted state hook, network status hook                        |

Example API usage:

```ts
import { createApiClient } from './src';

const api = createApiClient({ baseUrl: 'https://api.example.com' });
const profile = await api.request<{ name: string }>('/profile');
```

Preferences use `src/services/storage/mmkv.ts`. Keep access tokens and secrets in Keychain or Android Keystore through a secure storage module rather than in MMKV preferences. MMKV is for small key-value data; add a database for large structured offline datasets.

## Native modules

This starter installs React Navigation native stack and native tabs, React Native Screens, Gesture Handler, Reanimated and Worklets, Gorhom Bottom Sheet, React Native Maps, MMKV with Nitro Modules, NetInfo, the community date/time picker, and React Native SVG. `App.tsx` already includes `GestureHandlerRootView` and `BottomSheetModalProvider`. Rebuild Android or run `pod install` and rebuild iOS after changing native packages.

## Google Maps setup

The Maps tab shows a setup state until you add platform keys. Google Maps requires separate Android and iOS SDK keys, with the corresponding Maps SDKs enabled in Google Cloud and billing set up. Restrict each key to this app's package name or bundle ID and signing certificate as appropriate.

1. **Android:** Set `GOOGLE_MAPS_ANDROID_API_KEY` in your local `~/.gradle/gradle.properties` or environment. `android/app/build.gradle` passes it to the manifest without committing the key.
2. **iOS:** Set the `GOOGLE_MAPS_IOS_API_KEY` build setting for Debug and Release in Xcode. `Info.plist` passes it to `AppDelegate.swift`. Run `cd ios && pod install` after installing dependencies.
3. Set `mapsReady` to `true` in `src/app/config/maps.ts`, then rebuild the app. The map wrapper always uses the Google provider on both platforms.

The `AppLocationPicker` selects coordinates when the user taps the map. It does not request device location permission; add that only when a future feature needs GPS. `AppMapRoute` accepts polyline coordinates for GIS overlays.

The broad catalogue in `setup.md` is staged. Sync queues, media/file pickers, push notifications, biometrics, charting, and other provider-specific features remain separate modules to add when a project needs them. The `RootNavigator`'s auth flag is currently a demo constant in `App.tsx`; connect it to a real session provider in an app.
