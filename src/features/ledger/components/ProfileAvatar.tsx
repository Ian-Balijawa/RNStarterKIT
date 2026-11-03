import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';

export function ProfileAvatar({ name, size = 44 }: { name?: string; size?: number }) {
  const { colors } = useAppTheme();
  const initials = name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.successSurface,
          borderColor: colors.border,
        },
      ]}>
      {initials ? (
        <AppText
          variant="label"
          adjustsFontSizeToFit
          numberOfLines={1}
          style={{ color: colors.primary, fontSize: size * 0.34 }}>
          {initials}
        </AppText>
      ) : (
        <LedgerIcon name="profile" color={colors.primary} size={size * 0.48} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
