import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
} from 'react-native';
import { useAppTheme } from '../../theme/theme';
import { AppText } from './AppText';
import { AppIcon, IconName } from './AppIcon';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export function AppButton({
  title,
  variant = 'primary',
  icon,
  loading = false,
  disabled,
  style,
  ...props
}: Omit<PressableProps, 'children'> & {
  title?: string;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
}) {
  const { colors, radius } = useAppTheme();
  const ink =
    variant === 'primary'
      ? colors.primaryText
      : variant === 'danger'
      ? colors.danger
      : variant === 'secondary'
      ? colors.text
      : colors.primary;
  const fill =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
      ? colors.background
      : 'transparent';
  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel || title}
      accessibilityState={{ disabled: !!disabled || loading, busy: loading }}
      style={state => [
        styles.button,
        {
          backgroundColor: fill,
          borderColor:
            variant === 'outline' || variant === 'danger'
              ? variant === 'danger'
                ? colors.danger
                : colors.border
              : fill,
          borderRadius: radius.md,
          opacity: disabled ? 0.45 : state.pressed ? 0.78 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}>
      {loading ? (
        <ActivityIndicator color={ink} />
      ) : (
        <View style={styles.content}>
          {icon ? <AppIcon name={icon} color={ink} /> : null}
          {title ? (
            <AppText variant="label" style={{ color: ink }}>
              {title}
            </AppText>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
