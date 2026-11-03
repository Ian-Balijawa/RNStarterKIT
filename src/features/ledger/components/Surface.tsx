import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '../../../theme/theme';
import { styles } from '../styles';

export function Surface({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.surface,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}>
      {children}
    </View>
  );
}
