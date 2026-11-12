import React, { useMemo, useState } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen } from '../../components/layout/AppScreen';
import { AppBottomSheet } from '../../components/overlays/AppBottomSheet';
import { SheetField } from '../../components/forms/SheetField';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppChip } from '../../components/ui/AppChip';
import { AppText } from '../../components/ui/AppText';
import { useAppTheme } from '../../theme/theme';
import { formatUGX, kampalaDate } from './model';
import type { Contribution, ContributionsData } from './model';

type RangeOption = 'weekly' | 'monthly' | 'custom';
type DateRange = { start: string; end: string };
type ReportItem = { payment: Contribution; amount: number };

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/** Use Kampala's calendar day, independent of the device's configured time zone. */
function currentRange(option: Exclude<RangeOption, 'custom'>): DateRange {
  const today = kampalaDate();
  const date = new Date(`${today}T00:00:00Z`);
  if (option === 'weekly') {
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const start = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 6);
    return { start, end: date.toISOString().slice(0, 10) };
  }
  return {
    start: `${today.slice(0, 7)}-01`,
    end: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
      .toISOString()
      .slice(0, 10),
  };
}

/** A project receives its allocated share of an unrestricted payment. */
function projectAmount(payment: Contribution, projectId: string): number {
  if (payment.projectId === projectId) return payment.amount;
  if (payment.allocations) {
    return payment.allocations.reduce(
      (sum, item) => sum + (item.projectId === projectId ? item.amount : 0),
      0,
    );
  }
  // Records saved before allocation details were introduced were pledge-scoped.
  return payment.projectId === projectId ? payment.amount : 0;
}

export function ReportsScreen({
  data,
  onBack,
}: {
  data: ContributionsData;
  onBack: () => void;
}) {
  const { colors, radius } = useAppTheme();
  const [option, setOption] = useState<RangeOption>('monthly');
  const [customRange, setCustomRange] = useState<DateRange>(() =>
    currentRange('monthly'),
  );
  const [rangeOpen, setRangeOpen] = useState(false);
  const [start, setStart] = useState(customRange.start);
  const [end, setEnd] = useState(customRange.end);
  const [error, setError] = useState('');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const range = option === 'custom' ? customRange : currentRange(option);
  const items = useMemo(
    () =>
      data.contributions
        .reduce<ReportItem[]>((result, payment) => {
          const paidAt = payment.paidAt.slice(0, 10);
          if (payment.voidedAt || paidAt < range.start || paidAt > range.end)
            return result;
          if (memberId && payment.memberId !== memberId) return result;
          if (
            churchId &&
            data.members.find(member => member.id === payment.memberId)
              ?.churchId !== churchId
          )
            return result;
          const amount = projectId
            ? projectAmount(payment, projectId)
            : payment.amount;
          if (amount > 0) result.push({ payment, amount });
          return result;
        }, [])
        .sort(
          (a, b) =>
            b.payment.paidAt.localeCompare(a.payment.paidAt) ||
            b.payment.id.localeCompare(a.payment.id),
        ),
    [
      data.contributions,
      data.members,
      range.start,
      range.end,
      memberId,
      churchId,
      projectId,
    ],
  );
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const closeRange = () => {
    setRangeOpen(false);
    setError('');
  };
  const openRange = () => {
    setStart(customRange.start);
    setEnd(customRange.end);
    setError('');
    setRangeOpen(true);
  };
  const saveRange = () => {
    if (!validDate(start) || !validDate(end)) {
      setError('Enter both dates in YYYY-MM-DD format.');
      return;
    }
    if (start > end) {
      setError('The start date must be on or before the end date.');
      return;
    }
    setCustomRange({ start, end });
    setOption('custom');
    closeRange();
  };
  const header = (expandedHeader: React.ReactNode) => (
    <View style={styles.header}>
      {expandedHeader}
      <View style={styles.group}>
        <AppText variant="label">Period</AppText>
        <View style={styles.chips}>
          <AppChip
            label="This week"
            selected={option === 'weekly'}
            onPress={() => setOption('weekly')}
          />
          <AppChip
            label="This month"
            selected={option === 'monthly'}
            onPress={() => setOption('monthly')}
          />
          <AppChip
            label="Custom dates"
            selected={option === 'custom'}
            onPress={openRange}
          />
        </View>
        <AppText variant="caption" muted>
          {range.start} to {range.end} · Kampala time
        </AppText>
      </View>
      {data.churches.length ? (
        <Filter
          label="Current home church"
          options={data.churches}
          selected={churchId}
          onSelect={setChurchId}
        />
      ) : null}
      {data.members.length ? (
        <Filter
          label="Member"
          options={data.members}
          selected={memberId}
          onSelect={setMemberId}
        />
      ) : null}
      {data.projects.length ? (
        <Filter
          label="Project"
          options={data.projects}
          selected={projectId}
          onSelect={setProjectId}
        />
      ) : null}
      <AppCard style={{ backgroundColor: colors.surface }}>
        <AppText variant="caption" muted>
          TOTAL COLLECTED
        </AppText>
        <AppText variant="heading">{formatUGX(total)}</AppText>
        <AppText variant="caption" muted>
          {items.length} {items.length === 1 ? 'payment' : 'payments'} · Voided
          payments excluded
        </AppText>
        {projectId ? (
          <AppText variant="caption" muted>
            Shows payments assigned or allocated to this project.
          </AppText>
        ) : null}
      </AppCard>
      <View style={styles.listHeading}>
        <AppText variant="heading">Payments</AppText>
        <AppText variant="caption" muted>
          Export is not available yet
        </AppText>
      </View>
    </View>
  );
  return (
    <>
      <AppScreen
        title="Reports"
        eyebrow="GIVING INSIGHTS"
        subtitle="Explore contributions by date, church, member and project."
        headerLeading={
          <AppButton
            title="Back"
            icon="back"
            variant="ghost"
            onPress={onBack}
          />
        }
        renderScrollable={(onScroll, expandedHeader, minimumContentHeight) => (
          <Animated.FlatList
            data={items}
            keyExtractor={item => item.payment.id}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.listContent,
              { minHeight: minimumContentHeight },
            ]}
            ListHeaderComponent={header(expandedHeader)}
            ItemSeparatorComponent={Separator}
            ListEmptyComponent={
              <AppCard style={{ backgroundColor: colors.surface }}>
                <AppText variant="label">No payments in this period</AppText>
                <AppText variant="caption" muted>
                  Try another date range or change your filters.
                </AppText>
              </AppCard>
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.payment,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                  },
                ]}>
                <View style={styles.paymentInfo}>
                  <AppText variant="label">
                    {data.members.find(
                      member => member.id === item.payment.memberId,
                    )?.name ?? 'Member'}
                  </AppText>
                  <AppText variant="caption" muted>
                    {item.payment.paidAt.slice(0, 10)} ·{' '}
                    {data.churches.find(
                      church =>
                        church.id ===
                        data.members.find(
                          member => member.id === item.payment.memberId,
                        )?.churchId,
                    )?.name ?? 'No current home church'}
                  </AppText>
                </View>
                <AppText variant="label">{formatUGX(item.amount)}</AppText>
              </View>
            )}
          />
        )}
      />
      <AppBottomSheet
        visible={rangeOpen}
        onDismiss={closeRange}
        title="Custom date range"
        scrollable
        snapPoints={['60%', '90%']}
        footer={<AppButton title="Apply dates" onPress={saveRange} />}>
        <SheetField
          label="From (YYYY-MM-DD)"
          value={start}
          onChangeText={setStart}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
        />
        <SheetField
          label="To (YYYY-MM-DD)"
          value={end}
          onChangeText={setEnd}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
        />
        <AppText variant="caption" muted>
          Both dates are included in the report.
        </AppText>
        {error ? (
          <AppText variant="caption" style={{ color: colors.danger }}>
            {error}
          </AppText>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

function Filter({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { id: string; name: string }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  return (
    <View style={styles.group}>
      <AppText variant="label">{label}</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        <AppChip
          label="All"
          selected={!selected}
          onPress={() => onSelect(null)}
        />
        {options.map(item => (
          <AppChip
            key={item.id}
            label={item.name}
            selected={selected === item.id}
            onPress={() => onSelect(item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
function Separator() {
  return <View style={styles.separator} />;
}
const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  header: { gap: 12, marginBottom: 16 },
  eyebrow: { letterSpacing: 1.2, fontWeight: '700' },
  group: { gap: 8, marginTop: 4 },
  chips: { flexDirection: 'row', gap: 8 },
  listHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  separator: { height: 10 },
  payment: {
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentInfo: { flex: 1, gap: 4 },
});
