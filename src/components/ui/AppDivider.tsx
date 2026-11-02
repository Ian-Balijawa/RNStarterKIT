import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme/theme';
export function AppDivider() {
  const { colors } = useAppTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}
const styles = StyleSheet.create({ divider: { height: 1 } });
