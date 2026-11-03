import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { styles } from '../styles';

export function LedgerHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <AppText variant="display" style={styles.pageTitle}>
        {title}
      </AppText>
    </View>
  );
}
