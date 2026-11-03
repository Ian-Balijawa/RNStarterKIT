import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { ProfileAvatar } from './ProfileAvatar';
import { styles } from '../styles';

export function LedgerHeader({ title, profileName, onPressProfile }: {
  title: string;
  profileName?: string;
  onPressProfile?: () => void;
}) {
  return (
    <View style={styles.header}>
      <AppText variant="display" style={styles.pageTitle}>
        {title}
      </AppText>
      {onPressProfile ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          hitSlop={8}
          onPress={onPressProfile}>
          <ProfileAvatar name={profileName} />
        </Pressable>
      ) : null}
    </View>
  );
}
