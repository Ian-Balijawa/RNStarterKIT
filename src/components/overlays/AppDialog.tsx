import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme/theme';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
export function AppDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors, radius } = useAppTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityLabel="Dismiss dialog"
        />
        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
            },
          ]}
          accessibilityRole="alert"
          accessibilityViewIsModal>
          <AppText variant="heading">{title}</AppText>
          {message ? <AppText muted>{message}</AppText> : null}
          <View style={styles.actions}>
            <AppButton title={cancelLabel} variant="ghost" onPress={onCancel} />
            <AppButton
              title={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              loading={loading}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  panel: { width: '100%', maxWidth: 420, padding: 20, gap: 16, borderWidth: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
