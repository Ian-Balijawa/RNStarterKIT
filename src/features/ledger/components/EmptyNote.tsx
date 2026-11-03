import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { styles } from '../styles';

export function EmptyNote({ title, body }: { title: string; body: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.empty, { borderColor: colors.border }]}>
      <AppText variant="label">{title}</AppText>
      <AppText muted>{body}</AppText>
    </View>
  );
}
