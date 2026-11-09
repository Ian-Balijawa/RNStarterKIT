import React from 'react'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { StyleSheet, TextInputProps, View } from 'react-native'
import { useAppTheme } from '../../theme/theme'
import { AppText } from '../ui/AppText'

/** A themed, keyboard-aware input for form sheets. */
export function SheetField({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const { colors, radius } = useAppTheme()
  return (
    <View style={styles.group}>
      <AppText variant="label">{label}</AppText>
      <BottomSheetTextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderRadius: radius.md,
          },
          props.style,
        ]}
      />
    </View>
  )
}
const styles = StyleSheet.create({
  group: { gap: 8 },
  input: { minHeight: 48, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
})
