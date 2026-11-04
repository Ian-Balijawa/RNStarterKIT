import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppBottomSheet } from '../../../components/overlays/AppBottomSheet';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import {
  LedgerNotice,
  deviceNotificationsEnabled,
  enableDeviceNotifications,
  openDeviceNotificationSettings,
} from '../notifications';
import { dateLabel } from '../format';

export function NotificationSheet({
  visible,
  notices,
  onClose,
  onRead,
  onReadAll,
  onEnabled,
}: {
  visible: boolean;
  notices: LedgerNotice[];
  onClose: () => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onEnabled: () => void;
}) {
  const { colors } = useAppTheme();
  const [deviceEnabled, setDeviceEnabled] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  useEffect(() => {
    if (visible) deviceNotificationsEnabled().then(setDeviceEnabled);
  }, [visible]);
  return (
    <AppBottomSheet
      visible={visible}
      onDismiss={onClose}
      title="Notifications"
      scrollable
      snapPoints={['60%', '90%']}>
      {!deviceEnabled ? (
        <View
          style={[
            styles.permission,
            { backgroundColor: colors.successSurface },
          ]}>
          <AppText variant="label">Get reminders on your device</AppText>
          <AppText variant="caption" muted>
            {permissionRequested
              ? 'Device alerts are off. Enable them in notification settings.'
              : 'Scheduled entries can alert you when the app is closed.'}
          </AppText>
          <AppButton
            title={
              permissionRequested
                ? 'Open notification settings'
                : 'Enable device alerts'
            }
            variant="secondary"
            onPress={async () => {
              if (permissionRequested) {
                openDeviceNotificationSettings().catch(() => {});
                return;
              }
              const enabled = await enableDeviceNotifications();
              setDeviceEnabled(enabled);
              setPermissionRequested(!enabled);
              if (enabled) onEnabled();
            }}
          />
        </View>
      ) : null}
      {notices.some(item => !item.readAt) ? (
        <Pressable
          accessibilityRole="button"
          onPress={onReadAll}
          style={styles.markAll}>
          <AppText variant="label" style={{ color: colors.primary }}>
            Mark all as read
          </AppText>
        </Pressable>
      ) : null}
      {notices.length ? (
        notices.map(item => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.body}`}
            onPress={() => onRead(item.id)}
            style={[
              styles.notice,
              {
                borderColor: colors.border,
                backgroundColor: item.readAt
                  ? colors.surface
                  : colors.successSurface,
              },
            ]}>
            <View style={styles.noticeTop}>
              <AppText variant="label" style={styles.noticeTitle}>
                {item.title}
              </AppText>
              {!item.readAt ? (
                <View
                  accessibilityLabel="Unread"
                  style={[styles.dot, { backgroundColor: colors.primary }]}
                />
              ) : null}
            </View>
            <AppText variant="caption" muted>
              {item.body}
            </AppText>
            <AppText variant="caption" muted>
              {dateLabel(item.createdAt)}
            </AppText>
          </Pressable>
        ))
      ) : (
        <AppText muted>
          New ledger activity and reminders will appear here.
        </AppText>
      )}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  permission: { borderRadius: 16, padding: 16, gap: 10 },
  markAll: { minHeight: 44, alignSelf: 'flex-end', justifyContent: 'center' },
  notice: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 5 },
  noticeTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeTitle: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
