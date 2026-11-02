import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useAppTheme } from '../../theme/theme';
import { AppText } from '../ui/AppText';
import { AppIcon } from '../ui/AppIcon';

type ChoiceProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};
export function AppCheckbox({ label, value, onChange, disabled }: ChoiceProps) {
  const { colors, radius } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={styles.row}>
      <View
        style={[
          styles.box,
          {
            borderColor: value ? colors.primary : colors.border,
            backgroundColor: value ? colors.primary : colors.surface,
            borderRadius: radius.sm,
          },
        ]}>
        {value ? (
          <AppIcon name="check" size={16} color={colors.primaryText} />
        ) : null}
      </View>
      <AppText>{label}</AppText>
    </Pressable>
  );
}
export function AppRadio({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.row}>
      <View
        style={[
          styles.radio,
          { borderColor: selected ? colors.primary : colors.border },
        ]}>
        {selected ? (
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        ) : null}
      </View>
      <AppText>{label}</AppText>
    </Pressable>
  );
}
export function AppSwitch({ label, value, onChange, disabled }: ChoiceProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.switchRow}>
      <AppText>{label}</AppText>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  box: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
