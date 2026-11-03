import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { styles } from '../styles';

export function SectionTitle({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="heading" style={styles.sectionTitle}>
        {title}
      </AppText>
      {action && onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={styles.sectionAction}>
          <AppText variant="label" style={{ color: colors.primary }}>
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
