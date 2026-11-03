import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useAppTheme } from '../../../theme/theme';
import { LedgerIcon } from '../LedgerIcon';
import {
  EntryKind,
  LedgerState,
  Period,
  Transaction,
  formatUGX,
  inPeriod,
} from '../model';
import { Dialog } from '../navigation';
import { dateLabel } from '../format';
import { ChoiceRow } from '../forms/ChoiceRow';
import { PeriodNavigator } from '../components/PeriodNavigator';
import { Surface } from '../components/Surface';
import { SectionTitle } from '../components/SectionTitle';
import { EmptyNote } from '../components/EmptyNote';
import { EntryRow } from '../components/EntryRow';
import { styles } from '../styles';

type Props = {
  header: React.ReactNode;
  ledger: LedgerState;
  recent: Transaction[];
  totals: { income: number; expense: number };
  period: Period;
  onPeriodChange: (period: Period) => void;
  anchorDate: Date;
  onAnchorDateChange: (date: Date) => void;
  activityKind: 'all' | EntryKind;
  onActivityKindChange: (kind: 'all' | EntryKind) => void;
  onOpenDialog: (dialog: Dialog) => void;
};

export function ActivityScreen({
  header,
  ledger,
  recent,
  totals,
  period,
  onPeriodChange,
  anchorDate,
  onAnchorDateChange,
  activityKind,
  onActivityKindChange,
  onOpenDialog,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <FlatList
      data={recent.filter(
        item =>
          (activityKind === 'all' || item.kind === activityKind) &&
          inPeriod(item.occurredAt, period, anchorDate),
      )}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          {header}
          <ChoiceRow
            label="Period"
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
          <ChoiceRow
            label="Type"
            options={[
              { label: 'All', value: 'all' },
              { label: 'Expenses', value: 'expense' },
              { label: 'Income', value: 'income' },
              { label: 'Transfers', value: 'transfer' },
            ]}
            value={activityKind}
            onChange={onActivityKindChange}
          />
          <View style={styles.activityTotals}>
            <Surface style={styles.metric}>
              <AppText variant="caption" muted>
                INCOME
              </AppText>
              <AppText
                variant="heading"
                style={{ color: colors.success }}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {formatUGX(totals.income)}
              </AppText>
            </Surface>
            <Surface style={styles.metric}>
              <AppText variant="caption" muted>
                SPENT
              </AppText>
              <AppText
                variant="heading"
                style={{ color: colors.danger }}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {formatUGX(totals.expense)}
              </AppText>
            </Surface>
          </View>
          <SectionTitle title="Scheduled" />
          {ledger.schedules.length ? (
            ledger.schedules
              .slice()
              .sort((a, b) => a.nextAt.localeCompare(b.nextAt))
              .map(item => {
                const category = ledger.categories.find(
                  value => value.id === item.categoryId,
                )?.name;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() =>
                      onOpenDialog({ kind: 'scheduleDetail', item })
                    }
                    style={({ pressed }) => [
                      styles.scheduleRow,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}>
                    <LedgerIcon name="clock" color={colors.primary} />
                    <View style={styles.flex}>
                      <AppText variant="label">
                        {item.note || category || 'Transfer'}
                      </AppText>
                      <AppText muted variant="caption">
                        {item.recurrence} · Next {dateLabel(item.nextAt)}
                      </AppText>
                    </View>
                    <AppText variant="label">{formatUGX(item.amount)}</AppText>
                  </Pressable>
                );
              })
          ) : (
            <EmptyNote
              title="No scheduled transactions"
              body="Choose Scheduled when adding a transaction to plan a recurring item."
            />
          )}
          <SectionTitle title="Transactions" />
        </>
      }
      renderItem={({ item }) => (
        <EntryRow
          item={item}
          ledger={ledger}
          onPress={() => onOpenDialog({ kind: 'transactionDetail', item })}
        />
      )}
      ListEmptyComponent={
        <EmptyNote
          title="Nothing in this view"
          body="Try another period or add a transaction."
        />
      }
    />
  );
}
