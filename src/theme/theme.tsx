import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { XAUIProvider } from '@xaui/native/theme';
import { preferences } from '../services/storage/mmkv';

/**
 * Theme: Indigo Dusk
 * Indigo primary, coral accent, cool tinted neutrals.
 * Same exports as before, so existing screens keep working.
 * New tokens are marked "new".
 */

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 24, pill: 999 };

// new
export const typography = {
  caption: { fontSize: 12, lineHeight: 16 },
  body: { fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  headline: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' },
} as const;

type Mode = 'light' | 'dark' | 'system';

const light = {
  // surfaces
  background: '#F7F6FB',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',

  // text
  text: '#1B1B2F',
  muted: '#6B6B85',

  // brand
  primary: '#4F46E5',
  primaryText: '#FFFFFF',
  primarySurface: '#EEEDFD', // new: tinted background for selected rows and chips
  accent: '#F0604D', // new: highlights, badges, FAB secondary actions
  accentText: '#FFFFFF', // new

  // lines
  border: '#E4E3F0',

  // status
  danger: '#D13B4B',
  success: '#1F8A5B',
  warning: '#B7791F',
  dangerSurface: '#FDECEE',
  successSurface: '#E6F5EE',
  warningSurface: '#FCF3DF',

  // banners and overlays
  hero: '#2E2A87',
  heroText: '#FFFFFF', // new
  overlay: 'rgba(12,10,40,0.45)',

  // new: loading and navigation
  skeleton: '#E9E8F4',
  tabBar: '#FFFFFF',
  tabInactive: '#8E8EA8',
};

const dark: typeof light = {
  background: '#0E0E1A',
  surface: '#17172A',
  surfaceRaised: '#222240',

  text: '#EEEEFA',
  muted: '#A2A2C0',

  primary: '#9A94FF',
  primaryText: '#14123A',
  primarySurface: '#25235A',
  accent: '#FF8F80',
  accentText: '#3A100A',

  border: '#2F2F52',

  danger: '#FF8A96',
  success: '#6FD6A6',
  warning: '#F0C874',
  dangerSurface: '#40202A',
  successSurface: '#16382B',
  warningSurface: '#40351E',

  hero: '#2B2780',
  heroText: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.7)',

  skeleton: '#26264A',
  tabBar: '#13132A',
  tabInactive: '#7A7A9E',
};

// new: shadow styles by level (0 to 4). Dark mode uses stronger shadows and relies on surfaceRaised for depth.
type ElevationLevel = 0 | 1 | 2 | 3 | 4;
const makeElevation = (isDark: boolean) => (level: ElevationLevel) => ({
  shadowColor: isDark ? '#000000' : '#1B1B2F',
  shadowOpacity: level === 0 ? 0 : (isDark ? 0.35 : 0.06) + level * 0.02,
  shadowRadius: level * 3 + 2,
  shadowOffset: { width: 0, height: level * 2 },
  elevation: level * 2,
});

const ThemeContext = createContext({
  mode: 'system' as Mode,
  setMode: (_mode: Mode) => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>(
    () => preferences.get<Mode>('theme-mode') ?? 'system',
  );
  const value = useMemo(
    () => ({
      mode,
      setMode: (next: Mode) => {
        preferences.set('theme-mode', next);
        setModeState(next);
      },
    }),
    [mode],
  );
  return (
    <ThemeContext.Provider value={value}>
      <XAUIProvider colorMode={mode}>{children}</XAUIProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function useAppTheme() {
  const { mode } = useThemeMode();
  const system = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');

  // memoized so consumers do not re-render from a new object on every call
  return useMemo(
    () => ({
      colors: isDark ? dark : light,
      spacing,
      radius,
      typography, // new
      elevation: makeElevation(isDark), // new
      dark: isDark,
      isDark, // new alias
      mode,
    }),
    [isDark, mode],
  );
}
