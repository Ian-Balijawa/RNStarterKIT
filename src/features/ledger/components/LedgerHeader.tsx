import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { ProfileAvatar } from './ProfileAvatar';
import { LedgerIcon } from '../LedgerIcon';
import { styles } from '../styles';

export function LedgerHeader({
  title,
  profileName,
  onPressProfile,
  onPressNotifications,
  unreadCount = 0,
}: {
  title: string;
  profileName?: string;
  onPressProfile?: () => void;
  onPressNotifications?: () => void;
  unreadCount?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.header}>
      <AppText
        variant="display"
        style={[styles.pageTitle, localStyles.title]}
        numberOfLines={1}>
        {title}
      </AppText>
      <View style={localStyles.actions}>
        {onPressNotifications ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open notifications${
              unreadCount ? `, ${unreadCount} unread` : ''
            }`}
            onPress={onPressNotifications}
            style={localStyles.bell}>
            <LedgerIcon name="bell" color={colors.primary} size={23} />
            {unreadCount ? (
              <View
                style={[localStyles.badge, { backgroundColor: colors.danger }]}
              />
            ) : null}
          </Pressable>
        ) : null}
        {onPressProfile ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={localStyles.avatarButton}
            onPress={onPressProfile}>
            <ProfileAvatar name={profileName} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  title: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatarButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
