import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useAppTheme } from '../../theme/theme';
export function AppAvatar({
  name,
  uri,
  size = 44,
  online,
}: {
  name: string;
  uri?: string;
  size?: number;
  online?: boolean;
}) {
  const { colors } = useAppTheme();
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
  return (
    <View
      accessibilityLabel={`${name}${
        online === undefined ? '' : online ? ', online' : ', offline'
      }`}
      style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.background,
          },
        ]}>
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: size, height: size }}
            accessibilityLabel={name}
          />
        ) : (
          <AppText variant="label">{initials || '?'}</AppText>
        )}
      </View>
      {online !== undefined ? (
        <View
          style={[
            styles.status,
            {
              borderColor: colors.surface,
              backgroundColor: online ? colors.success : colors.muted,
            },
          ]}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  status: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
