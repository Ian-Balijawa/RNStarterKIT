import React from 'react'
import { PressableProps, StyleSheet } from 'react-native'
import { Button } from '@xaui/native/button'
import { useAppTheme } from '../../theme/theme'
import { AppIcon, IconName } from './AppIcon'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'

/** App-level button contract, backed by XAUI's composed button. */
export function AppButton({
  title,
  variant = 'primary',
  icon,
  loading = false,
  disabled,
  style,
  ...props
}: Omit<PressableProps, 'children'> & {
  title?: string
  variant?: ButtonVariant
  icon?: IconName
  loading?: boolean
}) {
  const { colors, radius } = useAppTheme()
  const ink =
    variant === 'primary'
      ? colors.primaryText
      : variant === 'danger'
      ? colors.danger
      : variant === 'secondary'
      ? colors.text
      : colors.primary
  const fill =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
      ? colors.background
      : 'transparent'
  const border =
    variant === 'outline'
      ? colors.border
      : variant === 'danger'
      ? colors.danger
      : fill
  const appearance =
    variant === 'outline'
      ? 'tertiary'
      : variant === 'secondary'
      ? 'default'
      : variant
  return (
    <Button
      {...props}
      variant={appearance}
      isDisabled={disabled}
      isLoading={loading}
      accessibilityLabel={props.accessibilityLabel || title}
      style={state => [
        styles.button,
        { backgroundColor: fill, borderColor: border, borderRadius: radius.md },
        typeof style === 'function' ? style(state) : style,
      ]}>
      {icon && !loading ? <AppIcon name={icon} color={ink} /> : null}
      {title ? (
        <Button.Label
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={[styles.label, { color: ink }]}>
          {title}
        </Button.Label>
      ) : null}
    </Button>
  )
}
const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 8,
  },
  label: { flexShrink: 1, textAlign: 'center' },
})
