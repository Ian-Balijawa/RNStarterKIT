import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';
import { styles } from '../styles';

export function LedgerHeader({
  title,
  onAddTransaction,
}: {
  title: string;
  onAddTransaction: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.header}>
      <View>
        <AppText variant="caption" muted style={styles.eyebrow}>
          PESA LEDGER
        </AppText>
        <AppText variant="display" style={styles.pageTitle}>
          {title}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add transaction"
        onPress={onAddTransaction}
        style={({ pressed }) => [
          styles.headerAdd,
          { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 },
        ]}>
        <LedgerIcon name="plus" color={colors.primaryText} size={22} />
      </Pressable>
    </View>
  );
}
