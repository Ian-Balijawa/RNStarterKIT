import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

const light = {
  primary: '#c6531f',
  primaryText: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F4F4F5',
  text: '#000000',
  muted: '#52525B',
  border: '#E4E4E7',
  success: '#147D52',
  warning: '#A96700',
  danger: '#B42333',
  successSurface: '#E5F5EC',
  warningSurface: '#FFF3DD',
  dangerSurface: '#FDECEF',
  overlay: 'rgba(0, 0, 0, 0.50)',
};

const dark = {
  primary: '#c6531f',
  primaryText: '#ffffff',
  background: '#000000',
  surface: '#0E0E10',
  text: '#FFFFFF',
  muted: '#9CA3AF',
  border: '#2a2a2c',
  success: '#78DBAC',
  warning: '#FFD187',
  danger: '#FF9BA7',
  successSurface: '#0B2A20',
  warningSurface: '#2E2210',
  dangerSurface: '#2E1519',
  overlay: 'rgba(0, 0, 0, 0.80)',
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
