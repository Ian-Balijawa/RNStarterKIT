import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { AppScreen } from '../../../components/layout/AppScreen';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';
import { LedgerState, Period, Transaction, formatUGX } from '../model';
import { Tab, Dialog } from '../navigation';
import { ChoiceRow } from '../forms/ChoiceRow';
import { PeriodNavigator } from '../components/PeriodNavigator';
import { Surface } from '../components/Surface';
import { SectionTitle } from '../components/SectionTitle';
import { EmptyNote } from '../components/EmptyNote';
import { BudgetCard } from '../components/BudgetCard';
import { EntryRow } from '../components/EntryRow';
import {
  LedgerFloatingAction,
  LedgerFloatingActions,
} from '../components/LedgerFloatingActions';
import { styles } from '../styles';

type Props = {
  header: React.ReactNode;
  ledger: LedgerState;
  totalBalance: number;
  totals: { income: number; expense: number };
  recent: Transaction[];
  periodTransactions: Transaction[];
  period: Period;
  onPeriodChange: (period: Period) => void;
  anchorDate: Date;
  onAnchorDateChange: (date: Date) => void;
  onSelectTab: (tab: Tab) => void;
  onOpenDialog: (dialog: Dialog) => void;
  showFloatingActions?: boolean;
};

export function OverviewScreen({
  header,
  ledger,
  totalBalance,
  totals,
  recent,
  periodTransactions,
  period,
  onPeriodChange,
  anchorDate,
  onAnchorDateChange,
  onSelectTab,
  onOpenDialog,
  showFloatingActions = true,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.flex}>
      <AppScreen
        scroll
        padded={false}
        safeTop={false}
        contentContainerStyle={[
          styles.scrollContent,
          compactStyles.scrollContent,
        ]}
        collapseThreshold={150}
        collapsedHeader={
          <View style={compactStyles.summary}>
            <View style={compactStyles.balance}>
              <AppText variant="caption" muted>
                TOTAL BALANCE
              </AppText>
              <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit>
                {formatUGX(totalBalance)}
              </AppText>
            </View>
            <View style={compactStyles.periodTotals}>
              <AppText variant="caption" style={{ color: colors.success }}>
                Income +{formatUGX(totals.income)}
              </AppText>
              <AppText variant="caption" style={{ color: colors.danger }}>
                Spent −{formatUGX(totals.expense)}
              </AppText>
            </View>
          </View>
        }>
        {header}
        <View style={[styles.hero, { backgroundColor: colors.hero }]}>
          <AppText style={styles.heroKicker}>TOTAL ACROSS ACCOUNTS</AppText>
          <AppText
            style={styles.heroAmount}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {formatUGX(totalBalance)}
          </AppText>
          <View style={styles.heroDivider} />
          <View style={styles.heroBottom}>
            <View>
              <AppText style={styles.heroSmallLabel}>Income</AppText>
              <AppText style={styles.heroSmallAmount}>
                +{formatUGX(totals.income)}
              </AppText>
            </View>
            <View>
              <AppText style={styles.heroSmallLabel}>Expenses</AppText>
              <AppText style={styles.heroSmallAmount}>
                −{formatUGX(totals.expense)}
              </AppText>
            </View>
          </View>
        </View>
        <ChoiceRow
          label="Your view"
          options={[
            { label: 'Day', value: 'daily' },
            { label: 'Week', value: 'weekly' },
            { label: 'Month', value: 'monthly' },
            { label: 'Year', value: 'yearly' },
          ]}
          value={period}
          onChange={onPeriodChange}
        />
        <PeriodNavigator
          period={period}
          date={anchorDate}
          onChange={onAnchorDateChange}
        />
        <View style={styles.quickActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              onOpenDialog({ kind: 'transaction', initialKind: 'transfer' })
            }
            style={({ pressed }) => [
              styles.quickAction,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <LedgerIcon name="transfer" color={colors.primary} />
            <AppText variant="label">Transfer funds</AppText>
          </Pressable>
        </View>
        <SectionTitle
          title="Where money went"
          action="All activity"
          onPress={() => onSelectTab('activity')}
        />
        {totals.expense === 0 ? (
          <EmptyNote
            title="No spending in this period"
            body="Add an expense to see where your money goes."
          />
        ) : (
          <Surface>
            {ledger.categories
              .filter(category => category.kind === 'expense')
              .map(category => {
                const spent = periodTransactions
                  .filter(
                    item =>
                      item.kind === 'expense' &&
                      item.categoryId === category.id,
                  )
                  .reduce((sum, item) => sum + item.amount, 0);
                return { category, spent };
              })
              .filter(item => item.spent > 0)
              .sort((a, b) => b.spent - a.spent)
              .slice(0, 5)
              .map(({ category, spent }) => (
                <View key={category.id} style={styles.spendRow}>
                  <View style={styles.spendTop}>
                    <AppText variant="label">{category.name}</AppText>
                    <AppText variant="label">{formatUGX(spent)}</AppText>
                  </View>
                  <View
                    style={[styles.track, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.trackFill,
                        {
                          width: `${
                            Math.min(spent / totals.expense, 1) * 100
                          }%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
          </Surface>
        )}
        <SectionTitle
          title="Budgets"
          action="Manage"
          onPress={() => onSelectTab('budgets')}
        />
        {ledger.budgets.length ? (
          ledger.budgets
            .slice(0, 2)
            .map(item => (
              <BudgetCard
                key={item.id}
                budget={item}
                ledger={ledger}
                onPress={() => onOpenDialog({ kind: 'budget', item })}
              />
            ))
        ) : (
          <EmptyNote
            title="Plan your spending"
            body="Set a weekly, monthly, or yearly limit for a category or subcategory."
          />
        )}
        <SectionTitle
          title="Recent activity"
          action="See all"
          onPress={() => onSelectTab('activity')}
        />
        {recent.length ? (
          <Surface style={styles.listSurface}>
            {recent.slice(0, 4).map(item => (
              <EntryRow
                key={item.id}
                item={item}
                ledger={ledger}
                onPress={() =>
                  onOpenDialog({ kind: 'transactionDetail', item })
                }
              />
            ))}
          </Surface>
        ) : (
          <EmptyNote
            title="Your ledger starts here"
            body="Record income, an expense, or a transfer to begin."
          />
        )}
      </AppScreen>
      <LedgerFloatingActions visible={showFloatingActions}>
        <LedgerFloatingAction
          accessibilityLabel="Add transaction"
          onPress={() => onOpenDialog({ kind: 'transaction' })}
        />
      </LedgerFloatingActions>
    </View>
  );
}

const compactStyles = StyleSheet.create({
  summary: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  balance: { flex: 1, minWidth: 0, gap: 2 },
  periodTotals: { alignItems: 'flex-end', gap: 2 },
  scrollContent: { paddingBottom: 84 },
});
