import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme/theme';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';
export function AppTooltip({
  message,
  label = 'More information',
}: {
  message: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const { colors, radius } = useAppTheme();
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(current => !current)}
        hitSlop={8}>
        <AppIcon name="info" color={colors.muted} />
      </Pressable>
      {open ? (
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.sm,
            },
          ]}>
          <AppText variant="caption">{message}</AppText>
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { alignSelf: 'flex-start', gap: 6 },
  bubble: { maxWidth: 240, borderWidth: 1, padding: 8 },
});
