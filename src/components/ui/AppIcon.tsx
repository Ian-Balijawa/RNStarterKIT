import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../theme/theme';

const glyphs = {
  check: '✓',
  close: '×',
  search: '⌕',
  chevron: '›',
  back: '‹',
  info: 'ⓘ',
  warning: '!',
  plus: '+',
  minus: '−',
  eye: '◉',
  eyeOff: '◎',
  calendar: '▦',
  clock: '◷',
  error: '!',
  empty: '◇',
} as const;
export type IconName = keyof typeof glyphs;
export function AppIcon({
  name,
  size = 20,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.icon,
        {
          fontSize: size,
          lineHeight: size + 4,
          color: color || colors.text,
        },
      ]}>
      {glyphs[name]}
    </Text>
  );
}
const styles = StyleSheet.create({ icon: { textAlign: 'center' } });
