import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme/theme';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AppIcon } from '../ui/AppIcon';
function StateLayout({
  icon,
  title,
  message,
  action,
}: {
  icon: 'empty' | 'error';
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.state}>
      <AppIcon name={icon} size={36} color={colors.muted} />
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      {message ? (
        <AppText muted style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}
export function AppEmptyState({
  title = 'Nothing here yet',
  message,
  actionLabel,
  onAction,
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <StateLayout
      icon="empty"
      title={title}
      message={message}
      action={
        actionLabel && onAction ? (
          <AppButton title={actionLabel} onPress={onAction} />
        ) : null
      }
    />
  );
}
export function AppErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <StateLayout
      icon="error"
      title={title}
      message={message}
      action={
        onRetry ? <AppButton title="Try again" onPress={onRetry} /> : null
      }
    />
  );
}
export function AppLoadingState({
  label = 'Loading',
  fullScreen = false,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.loading, fullScreen && styles.full]}>
      <ActivityIndicator color={colors.primary} />
      <AppText muted>{label}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  state: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  center: { textAlign: 'center' },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  full: { flex: 1 },
});
