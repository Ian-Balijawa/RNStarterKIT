import React from 'react';
import { Pressable } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { styles } from './styles';

export function ErrorText({ message }: { message: string }) {
  const { colors } = useAppTheme();
  return message ? (
    <AppText variant="label" style={{ color: colors.danger }}>
      {message}
    </AppText>
  ) : null;
}

export function LinkButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.link}>
      <AppText
        variant="label"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ color: colors.primary }}>
        {title}
      </AppText>
    </Pressable>
  );
}
