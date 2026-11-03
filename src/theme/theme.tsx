import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

const light = {
  primary: '#16583E',
  primaryText: '#FFFFFF',
  hero: '#16583E',
  background: '#FFFFFF',
  surface: '#F4F6F4',
  text: '#0A0F0C',
  muted: '#5A645E',
  border: '#E0E5E1',
  success: '#126B49',
  warning: '#9B5B13',
  danger: '#B43243',
  successSurface: '#E5F4EA',
  warningSurface: '#FFF2DA',
  dangerSurface: '#FCEBEF',
  overlay: 'rgba(0, 0, 0, 0.50)',
};

const dark = {
  primary: '#78D9A7',
  primaryText: '#000000',
  hero: '#0F3626',
  background: '#000000',
  surface: '#0D0F0E',
  text: '#F5F7F5',
  muted: '#A1ABA5',
  border: '#232826',
  success: '#85DFAD',
  warning: '#FFD187',
  danger: '#FF9BA7',
  successSurface: '#0F2419',
  warningSurface: '#2A1E0D',
  dangerSurface: '#2C1318',
  overlay: 'rgba(0, 0, 0, 0.85)',
};

export type AppTheme = {
  colors: typeof light;
  spacing: typeof spacing;
  radius: typeof radius;
  dark: boolean;
};
type ThemeMode = 'system' | 'light' | 'dark';
const ThemeContext = createContext<{
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
} | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  const value = useMemo(
    () => ({
      theme: { colors: isDark ? dark : light, spacing, radius, dark: isDark },
      mode,
      setMode,
    }),
    [isDark, mode],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('Wrap your app in AppThemeProvider');
  }
  return context.theme;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('Wrap your app in AppThemeProvider');
  }
  return { mode: context.mode, setMode: context.setMode };
}
