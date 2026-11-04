import React from 'react';
import { Animated, Pressable, RefreshControl, View } from 'react-native';
import { AppScreen, useAppRefresh } from '../../../components/layout/AppScreen';
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
import { SwipeActionRow } from '../components/SwipeActionRow';
import { useRecordActions } from '../components/RecordActions';
import { LedgerCompactHeader } from '../components/LedgerCompactHeader';
import {
  LedgerFloatingAction,
  LedgerFloatingActions,
} from '../components/LedgerFloatingActions';
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
  showFloatingActions?: boolean;
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
  showFloatingActions = true,
}: Props) {
  const { colors } = useAppTheme();
  const actions = useRecordActions();
  const refresh = useAppRefresh();
  const activeSchedules = ledger.schedules.filter(item => !item.archivedAt);
  return (
    <View style={styles.flex}>
      <AppScreen
        padded={false}
        safeTop={false}
        collapseThreshold={160}
        collapsedHeader={
          <LedgerCompactHeader
            title="Activity"
            summary={`${formatUGX(totals.income)} income`}
            detail={`${formatUGX(totals.expense)} spent · ${period}`}
          />
        }
        renderScrollable={onScroll => (
          <Animated.FlatList
            style={styles.flex}
            contentInsetAdjustmentBehavior="never"
            refreshControl={
              refresh ? (
                <RefreshControl
                  refreshing={refresh.refreshing}
                  onRefresh={refresh.onRefresh}
                  tintColor={colors.primary}
                />
              ) : undefined
            }
            onScroll={onScroll}
            scrollEventThrottle={16}
            data={recent.filter(
              item =>
                (activityKind === 'all' || item.kind === activityKind) &&
                inPeriod(item.occurredAt, period, anchorDate),
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={[
              styles.scrollContent,
              styles.activityList,
              styles.scrollContentWithFab,
            ]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.activityHeader}>
                {header}

                <View style={styles.activityFilters}>
                  <ChoiceRow
                    label="Period"
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
                </View>

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

                <View style={styles.activitySection}>
                  <SectionTitle title="Scheduled" />
                  {activeSchedules.length ? (
                    <View style={styles.scheduleList}>
                      {activeSchedules
                        .slice()
                        .sort((a, b) => a.nextAt.localeCompare(b.nextAt))
                        .map(item => {
                          const category = ledger.categories.find(
                            value => value.id === item.categoryId,
                          )?.name;
                          const label = item.note || category || 'Transfer';
                          return (
                            <SwipeActionRow
                              key={item.id}
                              label={label}
                              onArchive={
                                actions
                                  ? () => actions.archiveSchedule(item)
                                  : undefined
                              }
                              onDelete={
                                actions
                                  ? () => actions.deleteSchedule(item)
                                  : undefined
                              }>
                              {swiping => (
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel={`${label}, scheduled ${
                                    item.kind
                                  }, ${formatUGX(item.amount)}`}
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
                                          if (
                                            event.nativeEvent.actionName ===
                                            'archive'
                                          )
                                            actions.archiveSchedule(item);
                                          if (
                                            event.nativeEvent.actionName ===
                                            'delete'
                                          )
                                            actions.deleteSchedule(item);
                                        }
                                      : undefined
                                  }
                                  onPress={() =>
                                    onOpenDialog({
                                      kind: 'scheduleDetail',
                                      item,
                                    })
                                  }
                                  style={({ pressed }) => [
                                    styles.scheduleRow,
                                    swiping && styles.squareCorners,
                                    {
                                      backgroundColor: colors.surface,
                                      borderColor: colors.border,
                                      opacity: pressed ? 0.7 : 1,
                                    },
                                  ]}>
                                  <LedgerIcon
                                    name="clock"
                                    color={colors.primary}
                                  />
                                  <View style={styles.flex}>
                                    <AppText variant="label">{label}</AppText>
                                    <AppText muted variant="caption">
                                      {item.recurrence} · Next{' '}
                                      {dateLabel(item.nextAt)}
                                    </AppText>
                                  </View>
                                  <AppText variant="label">
                                    {formatUGX(item.amount)}
                                  </AppText>
                                </Pressable>
                              )}
                            </SwipeActionRow>
                          );
                        })}
                    </View>
                  ) : (
                    <EmptyNote
                      title="No scheduled transactions"
                      body="Choose Scheduled when adding a transaction to plan a recurring item."
                    />
                  )}
                </View>

                <SectionTitle title="Transactions" />
              </View>
            }
            renderItem={({ item }) => (
              <EntryRow
                item={item}
                ledger={ledger}
                onPress={() =>
                  onOpenDialog({ kind: 'transactionDetail', item })
                }
              />
            )}
            ListEmptyComponent={
              <EmptyNote
                title="Nothing in this view"
                body="Try another period or add a transaction."
              />
            }
          />
        )}
      />
      <LedgerFloatingActions visible={showFloatingActions}>
        <LedgerFloatingAction
          accessibilityLabel="Add transaction"
          onPress={() => onOpenDialog({ kind: 'transaction' })}
        />
      </LedgerFloatingActions>
    </View>
  );
}
