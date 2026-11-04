import React from 'react';
import { Pressable, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';
import { Account, formatUGX } from '../model';
import { Dialog } from '../navigation';
import { Surface } from '../components/Surface';
import { SectionTitle } from '../components/SectionTitle';
import { LedgerCompactHeader } from '../components/LedgerCompactHeader';
import {
  LedgerFloatingAction,
  LedgerFloatingActions,
} from '../components/LedgerFloatingActions';
import { styles } from '../styles';
import { SwipeActionRow } from '../components/SwipeActionRow';
import { useRecordActions } from '../components/RecordActions';

type Props = {
  header: React.ReactNode;
  balances: { account: Account; balance: number }[];
  totalBalance: number;
  onOpenDialog: (dialog: Dialog) => void;
  showFloatingActions?: boolean;
};

export function AccountsScreen({
  header,
  balances,
  totalBalance,
  onOpenDialog,
  showFloatingActions = true,
}: Props) {
  const { colors } = useAppTheme();
  const actions = useRecordActions();
  return (
    <View style={styles.flex}>
      <AppScreen
        scroll
        padded={false}
        safeTop={false}
        contentContainerStyle={[
          styles.scrollContent,
          styles.scrollContentWithFab,
        ]}
        collapseThreshold={140}
        collapsedHeader={
          <LedgerCompactHeader
            title="Accounts"
            summary={formatUGX(totalBalance)}
            detail={`${balances.length} ${
              balances.length === 1 ? 'account' : 'accounts'
            }`}
          />
        }>
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
        <SectionTitle title="Your accounts" />
        {balances.map(({ account, balance }) => (
          <SwipeActionRow
            key={account.id}
            label={account.name}
            onArchive={
              actions ? () => actions.archiveAccount(account) : undefined
            }
            onDelete={
              actions ? () => actions.deleteAccount(account) : undefined
            }>
            {swiping => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${account.name}, ${formatUGX(balance)}`}
                accessibilityActions={
                  actions
                    ? [
                        { name: 'archive', label: 'Archive' },
                        { name: 'delete', label: 'Delete' },
                      ]
                    : undefined
                }
                onAccessibilityAction={
                  actions
                    ? event => {
                        if (event.nativeEvent.actionName === 'archive')
                          actions.archiveAccount(account);
                        if (event.nativeEvent.actionName === 'delete')
                          actions.deleteAccount(account);
                      }
                    : undefined
                }
                onPress={() => onOpenDialog({ kind: 'account', item: account })}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                <Surface
                  style={[styles.accountCard, swiping && styles.squareCorners]}>
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
                  <AppText
                    variant="label"
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {formatUGX(balance)}
                  </AppText>
                </Surface>
              </Pressable>
            )}
          </SwipeActionRow>
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
      </AppScreen>
      <LedgerFloatingActions visible={showFloatingActions}>
        <LedgerFloatingAction
          accessibilityLabel="Add account"
          onPress={() => onOpenDialog({ kind: 'account' })}
        />
      </LedgerFloatingActions>
    </View>
  );
}
