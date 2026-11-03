import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';
import { Account, formatUGX } from '../model';
import { Dialog } from '../navigation';
import { Surface } from '../components/Surface';
import { SectionTitle } from '../components/SectionTitle';
import { styles } from '../styles';

type Props = {
  header: React.ReactNode;
  balances: { account: Account; balance: number }[];
  totalBalance: number;
  onOpenDialog: (dialog: Dialog) => void;
};

export function AccountsScreen({
  header,
  balances,
  totalBalance,
  onOpenDialog,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {header}
      <Surface style={styles.balanceSummary}>
        <AppText variant="caption" muted>
          TOTAL AVAILABLE
        </AppText>
        <AppText variant="display" adjustsFontSizeToFit numberOfLines={1}>
          {formatUGX(totalBalance)}
        </AppText>
        <AppText muted>
          Balances include recorded transactions and transfers.
        </AppText>
      </Surface>
      <SectionTitle
        title="Your accounts"
        action="Add account"
        onPress={() => onOpenDialog({ kind: 'account' })}
      />
      {balances.map(({ account, balance }) => (
        <Pressable
          key={account.id}
          accessibilityRole="button"
          onPress={() => onOpenDialog({ kind: 'account', item: account })}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Surface style={styles.accountCard}>
            <View
              style={[
                styles.accountIcon,
                { backgroundColor: colors.successSurface },
              ]}>
              <LedgerIcon name="wallet" color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label" style={styles.cardTitle}>
                {account.name}
              </AppText>
              <AppText muted variant="caption">
                {account.type.replace('_', ' ')}
              </AppText>
            </View>
            <AppText variant="label" numberOfLines={1} adjustsFontSizeToFit>
              {formatUGX(balance)}
            </AppText>
          </Surface>
        </Pressable>
      ))}
      <AppButton
        title="Transfer between accounts"
        variant="secondary"
        onPress={() =>
          onOpenDialog({ kind: 'transaction', initialKind: 'transfer' })
        }
      />
      <AppText muted variant="caption">
        Salary, business income, and borrowed funds can be recorded as income
        into any account.
      </AppText>
    </ScrollView>
  );
}
