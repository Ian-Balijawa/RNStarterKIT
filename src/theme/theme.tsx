import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

const light = {
  primary: '#335CFF',
  primaryText: '#FFFFFF',
  background: '#F6F7FB',
  surface: '#FFFFFF',
  text: '#161B2D',
  muted: '#677086',
  border: '#DDE2EB',
  success: '#147D52',
  warning: '#A96700',
  danger: '#B42333',
  successSurface: '#E5F5EC',
  warningSurface: '#FFF3DD',
  dangerSurface: '#FDECEF',
  overlay: 'rgba(13, 20, 38, 0.50)',
};
const dark = {
  primary: '#8DA4FF',
  primaryText: '#11192D',
  background: '#111521',
  surface: '#1D2433',
  text: '#F7F8FA',
  muted: '#ADB7C9',
  border: '#394255',
  success: '#78DBAC',
  warning: '#FFD187',
  danger: '#FF9BA7',
  successSurface: '#173D31',
  warningSurface: '#473419',
  dangerSurface: '#44242B',
  overlay: 'rgba(0, 0, 0, 0.68)',
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
