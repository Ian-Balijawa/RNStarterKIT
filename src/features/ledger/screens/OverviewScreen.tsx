import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
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
}: Props) {
  const { colors } = useAppTheme();
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
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
          onPress={() => onOpenDialog({ kind: 'transaction' })}
          style={({ pressed }) => [
            styles.quickAction,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <LedgerIcon name="plus" color={colors.primary} />
          <AppText variant="label">Add transaction</AppText>
        </Pressable>
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
                    item.kind === 'expense' && item.categoryId === category.id,
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
                        width: `${Math.min(spent / totals.expense, 1) * 100}%`,
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
          body="Set a weekly or monthly limit for a category or subcategory."
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
              onPress={() => onOpenDialog({ kind: 'transactionDetail', item })}
            />
          ))}
        </Surface>
      ) : (
        <EmptyNote
          title="Your ledger starts here"
          body="Record income, an expense, or a transfer to begin."
        />
      )}
    </ScrollView>
  );
}
