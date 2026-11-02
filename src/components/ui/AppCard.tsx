import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useAppTheme } from '../../theme/theme';
export function AppCard({ style, ...props }: ViewProps) {
  const { colors, radius } = useAppTheme();
  return (
    <View
      {...props}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
        style,
      ]}
    />
  );
}
const styles = StyleSheet.create({
  card: { padding: 16, borderWidth: 1, gap: 12 },
});
