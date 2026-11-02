import React, { memo, useCallback } from 'react';
import {
  FlatList,
  FlatListProps,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useAppTheme } from '../../theme/theme';
import { AppText } from '../ui/AppText';
import { AppIcon, IconName } from '../ui/AppIcon';
import { AppAvatar } from '../ui/AppAvatar';
import { AppDivider } from '../ui/AppDivider';
import {
  AppEmptyState,
  AppErrorState,
  AppLoadingState,
} from '../feedback/AppStates';

export function AppListItem({
  title,
  subtitle,
  icon,
  avatar,
  metadata,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  avatar?: string;
  metadata?: string;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={styles.item}>
      {avatar ? (
        <AppAvatar name={title} uri={avatar} />
      ) : icon ? (
        <AppIcon name={icon} color={colors.primary} />
      ) : null}
      <View style={styles.itemText}>
        <AppText variant="label">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" muted>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {metadata ? (
        <AppText variant="caption" muted>
          {metadata}
        </AppText>
      ) : null}
      {onPress ? <AppIcon name="chevron" color={colors.muted} /> : null}
    </Pressable>
  );
}
const Separator = memo(() => <AppDivider />);
export function AppList<T>({
  loading,
  error,
  onRetry,
  refreshing,
  onRefresh,
  ...props
}: FlatListProps<T> & {
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { colors } = useAppTheme();
  const empty = useCallback(
    () =>
      error ? (
        <AppErrorState message={error} onRetry={onRetry} />
      ) : (
        <AppEmptyState />
      ),
    [error, onRetry],
  );
  if (loading && !props.data?.length) {
    return <AppLoadingState fullScreen />;
  }
  return (
    <FlatList
      {...props}
      ItemSeparatorComponent={props.ItemSeparatorComponent || Separator}
      ListEmptyComponent={props.ListEmptyComponent || empty}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      contentContainerStyle={[styles.listContent, props.contentContainerStyle]}
    />
  );
}
const styles = StyleSheet.create({
  listContent: { paddingBottom: 24 },
  item: {
    minHeight: 64,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemText: { flex: 1, gap: 2 },
});
