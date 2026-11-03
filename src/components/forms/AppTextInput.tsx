import React, { useContext, useState } from 'react';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useAppTheme } from '../../theme/theme';
import { AppFormField } from './AppFormField';
import { AppIcon, IconName } from '../ui/AppIcon';
import { BottomSheetInputContext } from '../overlays/BottomSheetInputContext';

export function AppTextInput({
  label,
  hint,
  error,
  required,
  prefixIcon,
  clearable,
  secureTextEntry,
  value,
  onChangeText,
  style,
  ...props
}: TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  prefixIcon?: IconName;
  clearable?: boolean;
}) {
  const { colors, radius } = useAppTheme();
  const [reveal, setReveal] = useState(false);
  const insideSheet = useContext(BottomSheetInputContext);
  const Input = insideSheet ? BottomSheetTextInput : TextInput;
  return (
    <AppFormField label={label} hint={hint} error={error} required={required}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
          },
        ]}>
        {prefixIcon ? <AppIcon name={prefixIcon} color={colors.muted} /> : null}
        <Input
          {...props}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !reveal}
          placeholderTextColor={colors.muted}
          accessibilityLabel={props.accessibilityLabel || label}
          accessibilityState={{
            disabled: props.editable === false,
            ...(error ? { invalid: true } : {}),
          }}
          style={[styles.input, { color: colors.text }, style]}
        />
        {clearable && !!value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear text"
            hitSlop={8}
            onPress={() => onChangeText?.('')}>
            <AppIcon name="close" color={colors.muted} />
          </Pressable>
        ) : null}
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
            hitSlop={8}
            onPress={() => setReveal(current => !current)}>
            <AppIcon name={reveal ? 'eyeOff' : 'eye'} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </AppFormField>
  );
}
const styles = StyleSheet.create({
  box: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 16 },
});
