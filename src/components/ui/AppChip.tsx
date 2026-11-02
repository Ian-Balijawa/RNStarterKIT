import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';
import { useAppTheme } from '../../theme/theme';
export function AppChip({
  label,
  selected,
  onPress,
  onRemove,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}) {
  const { colors, radius } = useAppTheme();
  return (
    <View
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : colors.surface,
        },
      ]}>
      <Pressable
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={styles.label}>
        <AppText
          variant="label"
          style={{ color: selected ? colors.primaryText : colors.text }}>
          {label}
        </AppText>
      </Pressable>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityLabel={`Remove ${label}`}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.remove}>
          <AppIcon
            name="close"
            size={18}
            color={selected ? colors.primaryText : colors.muted}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  label: { paddingHorizontal: 12, paddingVertical: 8 },
  remove: { paddingRight: 10 },
});
