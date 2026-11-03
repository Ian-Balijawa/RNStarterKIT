import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';

export function LedgerFloatingActions({
  children,
  visible = true,
}: {
  children: React.ReactNode;
  visible?: boolean;
}) {
  if (!visible) return null;
  return (
    <View pointerEvents="box-none" style={styles.stack}>
      {children}
    </View>
  );
}

export function LedgerFloatingAction({
  label,
  accessibilityLabel,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label?: string;
  accessibilityLabel: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  const ink = secondary ? colors.primary : colors.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        label ? styles.labeled : styles.circle,
        {
          backgroundColor: secondary ? colors.surface : colors.primary,
          borderColor: secondary ? colors.border : colors.primary,
          opacity: disabled ? 0.48 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}>
      <LedgerIcon name="plus" color={ink} size={label ? 20 : 28} />
      {label ? (
        <AppText variant="label" numberOfLines={1} style={{ color: ink }}>
          {label}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    alignItems: 'flex-end',
    gap: 10,
    zIndex: 3,
  },
  action: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 7,
  },
  circle: { width: 60, height: 60, borderRadius: 30 },
  labeled: { minHeight: 52, borderRadius: 26, paddingHorizontal: 18 },
});
