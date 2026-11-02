import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme/theme';
export function AppSkeleton({
  width = '100%',
  height = 16,
  radius = 8,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityLabel="Loading content"
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.border,
        },
      ]}
    />
  );
}
const styles = StyleSheet.create({ skeleton: { opacity: 0.65 } });
