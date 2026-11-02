import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useAppTheme } from '../../theme/theme';
export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';
export function AppBadge({
  label,
  tone = 'neutral',
}: {
  label: string | number;
  tone?: BadgeTone;
}) {
  const { colors, radius } = useAppTheme();
  const foreground =
    tone === 'success'
      ? colors.success
      : tone === 'warning'
      ? colors.warning
      : tone === 'danger'
      ? colors.danger
      : colors.text;
  const background =
    tone === 'success'
      ? colors.successSurface
      : tone === 'warning'
      ? colors.warningSurface
      : tone === 'danger'
      ? colors.dangerSurface
      : colors.background;
  return (
    <View
      style={[
        styles.badge,
        { borderRadius: radius.pill, backgroundColor: background },
      ]}>
      <AppText variant="caption" style={[styles.text, { color: foreground }]}>
        {label}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4 },
  text: { fontWeight: '700' },
});
