import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useAppTheme } from '../../theme/theme';
import { AppText } from '../ui/AppText';
export function OfflineBanner() {
  const { online, known } = useNetworkStatus();
  const { colors } = useAppTheme();
  if (!known || online) {
    return null;
  }
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.warningSurface }]}>
      <AppText variant="label" style={{ color: colors.warning }}>
        You're offline
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  banner: { padding: 8, alignItems: 'center' },
});
