import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useAppTheme } from '../../theme/theme';

export type TextVariant = 'display' | 'heading' | 'body' | 'label' | 'caption';
const type: Record<TextVariant, TextStyle> = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  heading: { fontSize: 21, lineHeight: 27, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 17 },
};
export function AppText({
  variant = 'body',
  muted,
  style,
  ...props
}: TextProps & { variant?: TextVariant; muted?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <Text
      allowFontScaling
      {...props}
      style={[
        type[variant],
        { color: muted ? colors.muted : colors.text },
        style,
      ]}
    />
  );
}
