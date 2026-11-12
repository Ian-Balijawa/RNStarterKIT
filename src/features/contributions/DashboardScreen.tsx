import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, AppText, AppScreen } from '../../ui';
import { useAppTheme } from '../../theme/theme';
import { useAuth } from '../auth/AuthProvider';
import {
  AppErrorState,
  AppLoadingState,
} from '../../components/feedback/AppStates';
import {
  balanceForPledge,
  ContributionsData,
  formatUGX,
  totalContributions,
} from './model';

type Dashboard = {
  week: { collected: number };
  month: { collected: number };
  topDebtors: {
    id: string;
    name: string;
    debt: number;
    homeChurchId: string;
  }[];
  advanceMembers: {
    id: string;
    name: string;
    advance: number;
    homeChurchId: string;
  }[];
  behindTargetProjects: { id: string; collected: number }[];
  recentPayments: { id: string }[];
};

type Props = {
  data: ContributionsData;
  onContribution: () => void;
  onProjects: () => void;
};
export function DashboardScreen({ data, onContribution, onProjects }: Props) {
  const { colors } = useAppTheme();
  const { api } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await api.request<{ data: Dashboard }>('/dashboard');
      setDashboard(result.data);
    } catch (failure) {
      setDashboard(null);
      setError(
        failure instanceof Error
          ? failure.message
          : 'Unable to load the overview.',
      );
    }
  }, [api]);
  useEffect(() => {
    load();
  }, [load, data]);
  const total = totalContributions(data.contributions);
  const week = dashboard?.week.collected ?? 0;
  const month = dashboard?.month.collected ?? 0;
  const balances = data.pledges.map(pledge => ({
    pledge,
    balance: balanceForPledge(pledge, data.contributions),
  }));
  const debt = balances.reduce((sum, item) => sum + item.balance.debt, 0);
  const dueNow = balances.reduce((sum, item) => sum + item.balance.dueNow, 0);
  const debtors = (dashboard?.topDebtors ?? []).map(item => ({
    member: data.members.find(member => member.id === item.id) ?? item,
    debt: item.debt,
    churchId: item.homeChurchId,
  }));
  const ahead = (dashboard?.advanceMembers ?? []).map(item => ({
    member: data.members.find(member => member.id === item.id) ?? item,
    advance: item.advance,
    churchId: item.homeChurchId,
  }));
  const behind = (dashboard?.behindTargetProjects ?? [])
    .map(item => ({
      project: data.projects.find(project => project.id === item.id),
      raised: item.collected,
    }))
    .filter(
      (
        item,
      ): item is {
        project: ContributionsData['projects'][number];
        raised: number;
      } => !!item.project,
    );
  const recentIds = new Set(
    (dashboard?.recentPayments ?? []).map(item => item.id),
  );
  const recent = data.contributions
    .filter(item => recentIds.has(item.id))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  if (!dashboard)
    return error ? (
      <AppErrorState
        title="Could not load the overview"
        message={error}
        onRetry={load}
      />
    ) : (
      <AppLoadingState label="Loading overview..." fullScreen />
    );
  return (
    <AppScreen
      scroll
      title="Overview"
      eyebrow="CHURCH CONTRIBUTIONS"
      subtitle="Giving, together in one place."
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: colors.hero }]}>
        <View style={styles.heroTop}>
          <AppText style={styles.heroCaption}>TOTAL CONTRIBUTIONS</AppText>
          <AppText style={styles.heroIcon}>↗</AppText>
        </View>
        <AppText style={styles.heroAmount}>{formatUGX(total)}</AppText>
        <AppText style={styles.heroNote}>
          Every gift moves your community forward.
        </AppText>
        <View style={styles.heroDivider} />
        <View style={styles.heroBottom}>
          <View>
            <AppText style={styles.heroCaption}>THIS WEEK</AppText>
            <AppText style={styles.heroValue}>{formatUGX(week)}</AppText>
          </View>
          <View>
            <AppText style={styles.heroCaption}>THIS MONTH</AppText>
            <AppText style={styles.heroValue}>{formatUGX(month)}</AppText>
          </View>
        </View>
      </View>
      <View style={styles.stats}>
        <View
          style={[
            styles.stat,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <AppText variant="label">{formatUGX(debt)}</AppText>
          <AppText muted variant="caption">
            Overdue
          </AppText>
        </View>
        <View
          style={[
            styles.stat,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <AppText variant="label">{formatUGX(dueNow)}</AppText>
          <AppText muted variant="caption">
            Due this period
          </AppText>
        </View>
      </View>
      <View style={styles.stats}>
        <View
          style={[
            styles.stat,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <AppText variant="heading">{data.members.length}</AppText>
          <AppText muted variant="caption">
            Members
          </AppText>
        </View>
        <View
          style={[
            styles.stat,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <AppText variant="heading">{data.projects.length}</AppText>
          <AppText muted variant="caption">
            Projects
          </AppText>
        </View>
        <View
          style={[
            styles.stat,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <AppText variant="heading">{data.churches.length}</AppText>
          <AppText muted variant="caption">
            Churches
          </AppText>
        </View>
      </View>
      <View style={styles.actionRow}>
        <Button
          variant="primary"
          onPress={onContribution}
          style={styles.primaryAction}>
          <Button.Label>+ Record contribution</Button.Label>
        </Button>
        <Button
          variant="secondary"
          onPress={onProjects}
          style={styles.secondaryAction}>
          <Button.Label>View projects</Button.Label>
        </Button>
      </View>
      <View style={styles.sectionHeading}>
        <AppText variant="heading">Top debtors</AppText>
        <AppText variant="caption" muted>
          Past-due amounts across all pledges
        </AppText>
      </View>
      {debtors.length ? (
        <View
          style={[
            styles.list,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          {debtors.map((item, index) => (
            <View
              key={item.member.id}
              style={[
                styles.row,
                index > 0 && {
                  borderTopColor: colors.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
              ]}>
              <View style={styles.rowText}>
                <AppText variant="label">{item.member.name}</AppText>
                <AppText variant="caption" muted>
                  {data.churches.find(church => church.id === item.churchId)
                    ?.name || 'No home church'}
                </AppText>
              </View>
              <AppText variant="label" style={{ color: colors.danger }}>
                {formatUGX(item.debt)}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText muted variant="caption">
          No overdue balances.
        </AppText>
      )}
      <View style={styles.sectionHeading}>
        <AppText variant="heading">Members in advance</AppText>
        <AppText variant="caption" muted>
          Money covering future periods
        </AppText>
      </View>
      {ahead.length ? (
        <View
          style={[
            styles.list,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          {ahead.map((item, index) => (
            <View
              key={item.member.id}
              style={[
                styles.row,
                index > 0 && {
                  borderTopColor: colors.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
              ]}>
              <View style={styles.rowText}>
                <AppText variant="label">{item.member.name}</AppText>
                <AppText variant="caption" muted>
                  {data.churches.find(church => church.id === item.churchId)
                    ?.name || 'No home church'}
                </AppText>
              </View>
              <AppText variant="label" style={{ color: colors.success }}>
                {formatUGX(item.advance)}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText muted variant="caption">
          No future periods have been paid yet.
        </AppText>
      )}
      <View style={styles.sectionHeading}>
        <AppText variant="heading">Projects behind target</AppText>
        <AppText variant="caption" muted>
          Projects identified by the server
        </AppText>
      </View>
      {behind.length ? (
        <View
          style={[
            styles.list,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          {behind.map((item, index) => (
            <View
              key={item.project.id}
              style={[
                styles.row,
                index > 0 && {
                  borderTopColor: colors.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
              ]}>
              <View style={styles.rowText}>
                <AppText variant="label">{item.project.name}</AppText>
                <AppText variant="caption" muted>
                  Ends {item.project.endDate}
                </AppText>
              </View>
              <AppText variant="label">
                {formatUGX(item.raised)} /{' '}
                {formatUGX(item.project.targetAmount)}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText muted variant="caption">
          No dated projects are behind target.
        </AppText>
      )}
      <View style={styles.sectionHeading}>
        <View>
          <AppText variant="heading">Recent giving</AppText>
          <AppText variant="caption" muted>
            Latest contributions across projects
          </AppText>
        </View>
      </View>
      {recent.length === 0 ? (
        <View
          style={[
            styles.empty,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.successSurface },
            ]}>
            <AppText style={{ color: colors.primary, fontSize: 24 }}>♡</AppText>
          </View>
          <AppText variant="label">No contributions yet</AppText>
          <AppText muted variant="caption" style={styles.center}>
            Register a member and project, then record their first gift.
          </AppText>
        </View>
      ) : (
        <View
          style={[
            styles.list,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          {recent.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.row,
                index > 0 && {
                  borderTopColor: colors.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
              ]}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.successSurface },
                ]}>
                <AppText style={{ color: colors.primary, fontWeight: '700' }}>
                  {(data.members.find(m => m.id === item.memberId)?.name ?? '?')
                    .charAt(0)
                    .toUpperCase()}
                </AppText>
              </View>
              <View style={styles.rowText}>
                <AppText variant="label">
                  {data.members.find(m => m.id === item.memberId)?.name ??
                    'Member'}
                </AppText>
                <AppText variant="caption" muted>
                  {data.projects.find(p => p.id === item.projectId)?.name ??
                    'Across projects'}{' '}
                  · {item.paidAt.slice(0, 10)}
                </AppText>
              </View>
              <AppText variant="label">{formatUGX(item.amount)}</AppText>
            </View>
          ))}
        </View>
      )}
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 20,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { borderRadius: 24, padding: 24 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between' },
  heroCaption: {
    color: '#BBD7C9',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroIcon: { color: '#D3E9DB', fontSize: 22 },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    marginTop: 12,
  },
  heroNote: { color: '#C2DCD0', fontSize: 13, marginTop: 4 },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#7DA596',
    marginVertical: 20,
  },
  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroValue: { color: '#FFFFFF', fontWeight: '700', marginTop: 6 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryAction: { flex: 1 },
  secondaryAction: { flex: 1 },
  sectionHeading: { marginTop: 4 },
  empty: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  center: { textAlign: 'center' },
  list: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
});
