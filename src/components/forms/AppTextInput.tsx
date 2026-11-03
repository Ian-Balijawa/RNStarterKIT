import React, { useContext, useState } from 'react';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useAppTheme } from '../../theme/theme';
import { AppFormField } from './AppFormField';
import { AppIcon, IconName } from '../ui/AppIcon';
import { BottomSheetInputContext } from '../overlays/BottomSheetInputContext';

const NUMERIC_KEYBOARDS = ['numeric', 'number-pad', 'decimal-pad'];

function sanitizeNumber(text: string, decimals: number) {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const [rawInt, ...fracParts] = cleaned.split('.');
  const intPart = rawInt.replace(/^0+(?=\d)/, '');
  if (decimals <= 0 || fracParts.length === 0) {
    return intPart;
  }
  return `${intPart}.${fracParts.join('').slice(0, decimals)}`;
}

function addCommas(raw: string) {
  const [intPart, frac] = raw.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac !== undefined ? `${grouped}.${frac}` : grouped;
}

export function AppTextInput({
  label,
  hint,
  error,
  required,
  prefixIcon,
  clearable,
  secureTextEntry,
  currency,
  thousandsSeparator,
  decimals,
  keyboardType,
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
  /** true shows "UGX". Pass a string such as "USD" for another currency. */
  currency?: boolean | string;
  /** Defaults to true when the keyboard is numeric or currency is set. */
  thousandsSeparator?: boolean;
  /** Max decimal places. Defaults to 0 for UGX and 2 for other currencies. */
  decimals?: number;
}) {
  const { colors, radius } = useAppTheme();
  const [reveal, setReveal] = useState(false);
  const insideSheet = useContext(BottomSheetInputContext);
  const Input = insideSheet ? BottomSheetTextInput : TextInput;

  const currencyCode =
    currency === true ? 'UGX' : typeof currency === 'string' ? currency : null;
  const isNumeric = !!keyboardType && NUMERIC_KEYBOARDS.includes(keyboardType);
  const useCommas = thousandsSeparator ?? (isNumeric || !!currencyCode);
  const formatNumber = useCommas || !!currencyCode;
  const maxDecimals =
    decimals ?? (!currencyCode || currencyCode === 'UGX' ? 0 : 2);

  const displayValue =
    formatNumber && value !== undefined
      ? addCommas(sanitizeNumber(value, maxDecimals))
      : value;

  const handleChange = (text: string) => {
    onChangeText?.(formatNumber ? sanitizeNumber(text, maxDecimals) : text);
  };

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
        {currencyCode ? (
          <Text style={[styles.currency, { color: colors.muted }]}>
            {currencyCode}
          </Text>
        ) : null}
        <Input
          {...props}
          keyboardType={keyboardType}
          value={displayValue}
          onChangeText={handleChange}
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
  currency: { fontSize: 14, fontWeight: '600' },
});
