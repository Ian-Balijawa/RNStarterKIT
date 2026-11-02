import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing as space, useAppTheme } from '../../theme/theme';
export function AppScreen({
  children,
  scroll = false,
  keyboardAware = false,
  padded = true,
  safeTop = true,
  contentBottomPadding,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  keyboardAware?: boolean;
  padded?: boolean;
  safeTop?: boolean;
  contentBottomPadding?: number;
}) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useAppTheme();
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        padded && styles.padded,
        {
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + (contentBottomPadding ?? spacing.xl),
          gap: spacing.lg,
        },
      ]}>
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.fill,
        padded && styles.padded,
        {
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom,
        },
      ]}>
      {children}
    </View>
  );
  return (
    <KeyboardAvoidingView
      behavior={
        keyboardAware
          ? Platform.OS === 'ios'
            ? 'padding'
            : 'height'
          : undefined
      }
      style={[
        styles.fill,
        { backgroundColor: colors.background },
        safeTop ? { paddingTop: insets.top } : undefined,
      ]}>
      {content}
    </KeyboardAvoidingView>
  );
}
export function AppScrollView({
  contentContainerStyle,
  ...props
}: ScrollViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      {...props}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        { paddingBottom: insets.bottom + 24 },
        contentContainerStyle,
      ]}
    />
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  padded: { paddingHorizontal: space.lg },
});
