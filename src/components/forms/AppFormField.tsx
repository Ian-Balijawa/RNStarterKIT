import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { useAppTheme } from '../../theme/theme';
export function AppFormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      {label ? (
        <AppText variant="label">
          {label}
          {required ? ' *' : ''}
        </AppText>
      ) : null}
      {children}
      {error ? (
        <AppText
          variant="caption"
          style={{ color: colors.danger }}
          accessibilityRole="alert">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" muted>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({ field: { gap: 6 } });
