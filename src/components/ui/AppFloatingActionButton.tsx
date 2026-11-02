import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import { AppIcon, IconName } from './AppIcon';
import { AppText } from './AppText';

export function AppFloatingActionButton({
  icon = 'plus',
  label,
  onPress,
  bottomOffset = 16,
  disabled = false,
}: {
  icon?: IconName;
  label?: string;
  onPress: () => void;
  bottomOffset?: number;
  disabled?: boolean;
}) {
  const { colors, radius } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[styles.position, { bottom: insets.bottom + bottomOffset }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label || 'New item'}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          {
            borderRadius: radius.pill,
            backgroundColor: colors.primary,
            opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          },
        ]}>
        <AppIcon name={icon} size={24} color={colors.primaryText} />
        {label ? (
          <AppText variant="label" style={{ color: colors.primaryText }}>
            {label}
          </AppText>
        ) : null}
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  position: { position: 'absolute', right: 16 },
  button: {
    minWidth: 56,
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
});
