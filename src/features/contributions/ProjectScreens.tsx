import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '../../components/layout/AppScreen';
import { AppBottomSheet } from '../../components/overlays/AppBottomSheet';
import { SheetField } from '../../components/forms/SheetField';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppChip } from '../../components/ui/AppChip';
import { AppProgress } from '../../components/ui/AppProgress';
import { AppText } from '../../components/ui/AppText';
import { useAppTheme } from '../../theme/theme';
import {
  balanceForPledge,
  formatUGX,
  kampalaDate,
  newId,
  totalContributions,
} from './model';
import type { ContributionsData, Pledge, Project } from './model';
import type { PaymentPreview, PreviewInput } from './api';

type Props = {
  data: ContributionsData;
  onChange: (data: ContributionsData) => void | Promise<void>;
  onAddPledge: (memberId?: string, projectId?: string) => void;
  onAddContribution: (memberId?: string, projectId?: string) => void;
};

export function ProjectsScreen({
  data,
  onChange,
  onAddPledge,
  onAddContribution,
}: Props) {
  const { colors } = useAppTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState('');
  const project = data.projects.find(item => item.id === selected);
  const projectPledges = data.pledges.filter(
    item => item.projectId === project?.id,
  );
  const projectBalances = projectPledges.map(item =>
    balanceForPledge(item, data.contributions),
  );
  const projectDebt =
    project?.summary?.debt ??
    projectBalances.reduce((sum, item) => sum + item.debt, 0);
  const projectDueNow =
    project?.summary?.dueToday ??
    projectBalances.reduce((sum, item) => sum + item.dueNow, 0);
  const projectAdvance =
    project?.summary?.advance ??
    projectBalances.reduce((sum, item) => sum + item.advance, 0);
  const beginEdit = (item?: Project) => {
    setSelected(null);
    setEditing(item ?? null);
    setFormVisible(true);
  };
  return (
    <>
      <AppScreen
        scroll
        contentBottomPadding={110}
        eyebrow="BUILDING TOGETHER"
        title="Projects"
        subtitle="Follow every pledge and contribution."
        headerAction={
          <AppButton
            title="New project"
            icon="plus"
            onPress={() => beginEdit()}
          />
        }>
        {data.projects.length === 0 ? (
          <AppCard style={{ backgroundColor: colors.surface }}>
            <AppText variant="heading">Start a shared goal</AppText>
            <AppText muted>
              Create a project, connect churches and invite members to pledge.
            </AppText>
            <AppButton title="Create project" onPress={() => beginEdit()} />
          </AppCard>
        ) : (
          data.projects.map(item => {
            const raised =
              item.summary?.collected ??
              totalContributions(data.contributions, {
                projectId: item.id,
              });
            const count =
              item.summary?.memberCount ?? (item.memberIds ?? []).length;
            return (
              <AppCard
                key={item.id}
                style={{ backgroundColor: colors.surface }}>
                <View style={styles.row}>
                  <View style={styles.grow}>
                    <AppText variant="heading">{item.name}</AppText>
                    <AppText variant="caption" muted>
                      {count} {count === 1 ? 'member' : 'members'} ·{' '}
                      {item.churchIds.length}{' '}
                      {item.churchIds.length === 1 ? 'church' : 'churches'}
                    </AppText>
                  </View>
                  <AppText variant="caption" muted>
                    {item.targetAmount > 0
                      ? `${Math.min(
                          100,
                          Math.round((raised / item.targetAmount) * 100),
                        )}%`
                      : 'OPEN GOAL'}
                  </AppText>
                </View>
                <View>
                  <AppText variant="heading">{formatUGX(raised)}</AppText>
                  <AppText variant="caption" muted>
                    {item.targetAmount > 0
                      ? `of ${formatUGX(item.targetAmount)} goal`
                      : 'contributed so far'}
                  </AppText>
                </View>
                {item.targetAmount > 0 ? (
                  <AppProgress value={raised / item.targetAmount} />
                ) : null}
                <AppButton
                  title="View project"
                  variant="secondary"
                  onPress={() => setSelected(item.id)}
                />
              </AppCard>
            );
          })
        )}
      </AppScreen>
      <AppBottomSheet
        visible={!!project}
        onDismiss={() => {
          setSelected(null);
        }}
        title={project?.name}
        scrollable
        snapPoints={['75%', '95%']}>
        {project ? (
          <>
            <AppText muted>
              {project.description || 'A shared project for your community.'}
            </AppText>
            <View style={styles.stats}>
              <View style={styles.grow}>
                <AppText variant="caption" muted>
                  RAISED
                </AppText>
                <AppText variant="heading">
                  {formatUGX(
                    project.summary?.collected ??
                      totalContributions(data.contributions, {
                        projectId: project.id,
                      }),
                  )}
                </AppText>
              </View>
              <View style={styles.grow}>
                <AppText variant="caption" muted>
                  GOAL
                </AppText>
                <AppText variant="heading">
                  {project.targetAmount > 0
                    ? formatUGX(project.targetAmount)
                    : 'No goal'}
                </AppText>
              </View>
            </View>
            <View style={styles.stats}>
              <View style={styles.grow}>
                <AppText variant="caption" muted>
                  OVERDUE
                </AppText>
                <AppText variant="label">{formatUGX(projectDebt)}</AppText>
              </View>
              <View style={styles.grow}>
                <AppText variant="caption" muted>
                  DUE NOW
                </AppText>
                <AppText variant="label">{formatUGX(projectDueNow)}</AppText>
              </View>
              <View style={styles.grow}>
                <AppText variant="caption" muted>
                  IN ADVANCE
                </AppText>
                <AppText variant="label">{formatUGX(projectAdvance)}</AppText>
              </View>
            </View>
            <AppText variant="label">Churches</AppText>
            <AppText muted>
              {project.churchIds
                .map(id => data.churches.find(church => church.id === id)?.name)
                .filter(Boolean)
                .join(', ') || 'No churches connected yet'}
            </AppText>
            <AppText variant="label">Participants</AppText>
            <AppText muted>
              {(project.memberIds ?? [])
                .map(id => data.members.find(member => member.id === id)?.name)
                .filter(Boolean)
                .join(', ') || 'No participants yet.'}
            </AppText>
            <AppText variant="label">Member pledges</AppText>
            {data.pledges.filter(p => p.projectId === project.id).length ===
            0 ? (
              <AppText muted>
                No pledges yet. Members from any church can join.
              </AppText>
            ) : (
              data.pledges
                .filter(p => p.projectId === project.id)
                .map(pledge => {
                  const balance = balanceForPledge(pledge, data.contributions);
                  const covered = Math.floor(balance.advance / pledge.amount);
                  const interval =
                    pledge.frequency === 'daily'
                      ? 'day'
                      : pledge.frequency === 'weekly'
                      ? 'week'
                      : 'month';
                  return (
                    <View
                      key={pledge.id}
                      style={[
                        styles.pledgeRow,
                        { borderColor: colors.border },
                      ]}>
                      <View style={styles.grow}>
                        <AppText variant="label">
                          {data.members.find(
                            member => member.id === pledge.memberId,
                          )?.name || 'Member'}
                        </AppText>
                        <AppText variant="caption" muted>
                          {formatUGX(pledge.amount)} {pledge.frequency}
                        </AppText>
                      </View>
                      <View style={styles.grow}>
                        <AppText variant="label">
                          {formatUGX(balance.paid)}
                        </AppText>
                        <AppText variant="caption" muted>
                          {balance.debt > 0
                            ? `${formatUGX(balance.debt)} overdue`
                            : balance.dueNow > 0
                            ? `${formatUGX(balance.dueNow)} due now`
                            : balance.advance > 0
                            ? `${formatUGX(balance.advance)} ahead${
                                covered
                                  ? ` · ${covered} ${interval}${
                                      covered === 1 ? '' : 's'
                                    } covered`
                                  : ''
                              }`
                            : 'Up to date'}
                        </AppText>
                      </View>
                    </View>
                  );
                })
            )}
            <AppButton
              title="Add member pledge"
              onPress={() => {
                setSelected(null);
                onAddPledge(undefined, project.id);
              }}
            />
            <AppButton
              title="Record contribution"
              variant="secondary"
              onPress={() => {
                setSelected(null);
                onAddContribution(undefined, project.id);
              }}
            />
            <AppButton
              title={
                project.status === 'cancelled'
                  ? 'Unarchive project'
                  : 'Archive project'
              }
              variant="outline"
              loading={statusSaving}
              disabled={statusSaving}
              onPress={async () => {
                setStatusSaving(true);
                setStatusError('');
                try {
                  await onChange({
                    ...data,
                    projects: data.projects.map(item =>
                      item.id === project.id
                        ? {
                            ...item,
                            status:
                              item.status === 'cancelled'
                                ? 'active'
                                : 'cancelled',
                          }
                        : item,
                    ),
                  });
                } catch (failure) {
                  setStatusError(
                    failure instanceof Error
                      ? failure.message
                      : 'Could not update project status.',
                  );
                } finally {
                  setStatusSaving(false);
                }
              }}
            />
            {statusError ? (
              <AppText style={{ color: colors.danger }}>{statusError}</AppText>
            ) : null}
            <AppButton
              title="Edit project"
              variant="outline"
              onPress={() => beginEdit(project)}
            />
          </>
        ) : null}
      </AppBottomSheet>
      <ProjectForm
        visible={formVisible}
        project={editing}
        data={data}
        onDismiss={() => setFormVisible(false)}
        onSave={async item => {
          await onChange({
            ...data,
            projects: editing
              ? data.projects.map(p => (p.id === item.id ? item : p))
              : [...data.projects, item],
          });
          setFormVisible(false);
        }}
      />
    </>
  );
}

function ProjectForm({
  visible,
  project,
  data,
  onDismiss,
  onSave,
}: {
  visible: boolean;
  project: Project | null;
  data: ContributionsData;
  onDismiss: () => void;
  onSave: (project: Project) => void | Promise<void>;
}) {
  const { colors } = useAppTheme();
  const [formId, setFormId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [ownerChurchId, setOwnerChurchId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (visible) {
      setFormId(project?.id ?? newId());
      setName(project?.name ?? '');
      setDescription(project?.description ?? '');
      setTarget(project?.targetAmount ? String(project.targetAmount) : '');
      setOwnerChurchId(project?.ownerChurchId ?? '');
      setStartDate(project?.startDate ?? kampalaDate());
      setEndDate(project?.endDate ?? '');
      setError('');
    }
  }, [visible, project]);
  const save = async () => {
    if (saving) return;
    const amount = target.trim() ? Number(target.replace(/,/g, '')) : 0;
    if (
      !name.trim() ||
      (target.trim() && !/^\d[\d,]*$/.test(target.trim())) ||
      !Number.isSafeInteger(amount) ||
      amount < 0 ||
      !ownerChurchId ||
      !validDate(startDate) ||
      (!!endDate && (!validDate(endDate) || endDate < startDate))
    ) {
      setError('Enter a name, owner and valid dates.');
      return;
    }
    const nextProject: Project = {
      ...project,
      id: formId,
      name: name.trim(),
      description: description.trim(),
      targetAmount: amount,
      churchIds: project?.churchIds ?? [ownerChurchId],
      memberIds: project?.memberIds ?? [],
      ownerChurchId,
      status: project?.status ?? 'active',
      startDate,
      endDate: endDate || undefined,
    };
    setSaving(true);
    try {
      await onSave(nextProject);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not save the project.',
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <AppBottomSheet
      visible={visible}
      onDismiss={onDismiss}
      title={project ? 'Edit project' : 'New project'}
      scrollable
      snapPoints={['85%', '95%']}
      footer={
        <AppButton
          title={project ? 'Save changes' : 'Create project'}
          onPress={save}
          loading={saving}
          disabled={saving}
        />
      }>
      <SheetField
        label="Project name"
        placeholder="e.g. Church building fund"
        value={name}
        onChangeText={setName}
      />
      <SheetField
        label="Description (optional)"
        placeholder="What are you working towards?"
        value={description}
        onChangeText={setDescription}
      />
      <SheetField
        label="Fundraising goal in UGX (optional)"
        placeholder="0"
        value={target}
        onChangeText={setTarget}
        keyboardType="number-pad"
      />
      <AppText variant="label">Owner church</AppText>
      <View style={styles.chips}>
        {data.churches.map(church => (
          <AppChip
            key={church.id}
            label={church.name}
            selected={ownerChurchId === church.id}
            onPress={() => {
              if (!project) setOwnerChurchId(church.id);
            }}
          />
        ))}
      </View>
      <SheetField
        label="Start date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={value => {
          if (!project) setStartDate(value);
        }}
        placeholder="YYYY-MM-DD"
      />
      <SheetField
        label="End date (optional)"
        value={endDate}
        onChangeText={setEndDate}
        placeholder="YYYY-MM-DD"
      />
      {project ? (
        <AppText variant="caption" muted>
          The owner church and start date cannot be changed after creation.
        </AppText>
      ) : null}
      {data.churches.length === 0 ? (
        <AppText muted>Register a church to connect it here.</AppText>
      ) : null}
      {error ? (
        <AppText style={{ color: colors.danger }}>{error}</AppText>
      ) : null}
    </AppBottomSheet>
  );
}

export type ContributionFlow = {
  kind: 'pledge' | 'contribution';
  memberId?: string;
  projectId?: string;
} | null;
function localDate() {
  return kampalaDate();
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function ContributionSheets({
  data,
  onChange,
  flow,
  onDismiss,
  previewPayment,
}: {
  data: ContributionsData;
  previewPayment?: (input: PreviewInput) => Promise<PaymentPreview>;
  onChange: (data: ContributionsData) => void | Promise<void>;
  flow: ContributionFlow;
  onDismiss: () => void;
}) {
  const { colors } = useAppTheme();
  const [memberId, setMemberId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [method, setMethod] = useState<'cash' | 'mobile money' | 'bank'>(
    'cash',
  );
  const [note, setNote] = useState('');
  const [endDate, setEndDate] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Pledge['frequency']>('monthly');
  const [date, setDate] = useState(localDate());
  const [error, setError] = useState('');
  useEffect(() => {
    if (flow) {
      setMemberId(flow.memberId ?? '');
      setProjectId(flow.projectId ?? '');
      setPaymentId(newId());
      setMethod('cash');
      setNote('');
      setEndDate('');
      setAmount('');
      setFrequency('monthly');
      setDate(localDate());
      setError('');
    }
  }, [flow]);
  const value = Number(amount.replace(/,/g, ''));
  const [preview, setPreview] = useState<PaymentPreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setPreview(null);
    setPreviewError('');
    if (
      !previewPayment ||
      flow?.kind !== 'contribution' ||
      !paymentId ||
      !memberId ||
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      !validDate(date) ||
      date > localDate()
    ) {
      setPreviewLoading(false);
      return;
    }
    let active = true;
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      previewPayment({
        id: paymentId,
        memberId,
        amount: value,
        date,
        projectId: projectId || null,
      })
        .then(result => {
          if (active) setPreview(result);
        })
        .catch(failure => {
          if (active)
            setPreviewError(
              failure instanceof Error
                ? failure.message
                : 'Could not load allocation preview.',
            );
        })
        .finally(() => {
          if (active) setPreviewLoading(false);
        });
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [previewPayment, flow?.kind, paymentId, memberId, value, date, projectId]);
  const save = async () => {
    if (saving) return;
    if (
      !/^\d[\d,]*$/.test(amount.trim()) ||
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      !validDate(date)
    ) {
      setError('Enter a positive whole amount and a valid date (YYYY-MM-DD).');
      return;
    }
    if (flow?.kind === 'contribution' && date > localDate()) {
      setError('The date received cannot be in the future.');
      return;
    }
    if (flow?.kind === 'pledge') {
      if (!memberId || !projectId) {
        setError('Choose a member and project.');
        return;
      }
      const chosenProject = data.projects.find(
        project => project.id === projectId,
      );
      if (
        chosenProject?.status === 'completed' ||
        chosenProject?.status === 'cancelled'
      ) {
        setError('This project is closed to new pledges.');
        return;
      }
      if (endDate && (!validDate(endDate) || endDate < date)) {
        setError('Enter an end date on or after the start date.');
        return;
      }
      if (
        data.pledges.some(
          p =>
            p.memberId === memberId &&
            p.projectId === projectId &&
            (!p.endDate || p.endDate >= date) &&
            (!endDate || p.startDate <= endDate),
        )
      ) {
        setError(
          'This member already has a pledge for this project during these dates.',
        );
        return;
      }
      const next = {
        ...data,
        pledges: [
          ...data.pledges,
          {
            id: paymentId,
            memberId,
            projectId,
            amount: value,
            frequency,
            startDate: date,
            endDate: endDate || undefined,
            status: 'active' as const,
          },
        ],
      };
      setSaving(true);
      try {
        await onChange(next);
        onDismiss();
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'Could not save the pledge.',
        );
      } finally {
        setSaving(false);
      }
    } else {
      if (!memberId) {
        setError('Choose a member.');
        return;
      }
      setSaving(true);
      try {
        await onChange({
          ...data,
          contributions: [
            ...data.contributions,
            {
              id: paymentId,
              memberId,
              projectId: projectId || undefined,
              amount: value,
              paidAt: date,
              method,
              note: note.trim(),
            },
          ],
        });
        onDismiss();
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'Could not save the contribution.',
        );
      } finally {
        setSaving(false);
      }
    }
  };
  return (
    <AppBottomSheet
      visible={!!flow}
      onDismiss={onDismiss}
      title={flow?.kind === 'pledge' ? 'Add a pledge' : 'Record contribution'}
      scrollable
      snapPoints={['85%', '95%']}
      footer={
        <AppButton
          title={flow?.kind === 'pledge' ? 'Save pledge' : 'Save contribution'}
          onPress={save}
          loading={saving}
          disabled={saving}
        />
      }>
      {flow?.kind === 'pledge' ? (
        <>
          <AppText variant="label">Member</AppText>
          <View style={styles.chips}>
            {data.members.map(member => (
              <AppChip
                key={member.id}
                label={member.name}
                selected={memberId === member.id}
                onPress={() => setMemberId(member.id)}
              />
            ))}
          </View>
          {data.members.length === 0 ? (
            <AppText muted>Register a member first.</AppText>
          ) : null}
          <AppText variant="label">Project</AppText>
          <View style={styles.chips}>
            {data.projects.map(project => (
              <AppChip
                key={project.id}
                label={project.name}
                selected={projectId === project.id}
                onPress={() => setProjectId(project.id)}
              />
            ))}
          </View>
          {data.projects.length === 0 ? (
            <AppText muted>Create a project first.</AppText>
          ) : null}
          <SheetField
            label="Amount per interval (UGX)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="e.g. 1000"
          />
          <AppText variant="label">Frequency</AppText>
          <View style={styles.chips}>
            {(['daily', 'weekly', 'monthly'] as const).map(option => (
              <AppChip
                key={option}
                label={option[0].toUpperCase() + option.slice(1)}
                selected={frequency === option}
                onPress={() => setFrequency(option)}
              />
            ))}
          </View>
          <SheetField
            label="Start date (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
          <SheetField
            label="End date (optional)"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
          />
          <AppText variant="caption" muted>
            Weekly periods start on Monday and monthly periods follow the
            calendar. The current period is due now; earlier unpaid periods are
            overdue.
          </AppText>
        </>
      ) : (
        <>
          <AppText variant="label">Member</AppText>
          <View style={styles.chips}>
            {data.members.map(member => (
              <AppChip
                key={member.id}
                label={member.name}
                selected={memberId === member.id}
                onPress={() => setMemberId(member.id)}
              />
            ))}
          </View>
          {!data.members.length ? (
            <AppText muted>Register a member first.</AppText>
          ) : null}
          <AppText variant="label">Project (optional)</AppText>
          <View style={styles.chips}>
            <AppChip
              label="All projects"
              selected={!projectId}
              onPress={() => setProjectId('')}
            />
            {data.projects.map(project => (
              <AppChip
                key={project.id}
                label={project.name}
                selected={projectId === project.id}
                onPress={() => setProjectId(project.id)}
              />
            ))}
          </View>
          <SheetField
            label="Amount received (UGX)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="e.g. 15000"
          />
          <SheetField
            label="Date received (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
          <AppText variant="label">Payment method</AppText>
          <View style={styles.chips}>
            {(['cash', 'mobile money', 'bank'] as const).map(option => (
              <AppChip
                key={option}
                label={option}
                selected={method === option}
                onPress={() => setMethod(option)}
              />
            ))}
          </View>
          <SheetField
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Add a note"
          />
          {previewLoading ? (
            <AppText muted variant="caption">
              Loading allocation preview…
            </AppText>
          ) : null}
          {previewError ? (
            <AppText style={{ color: colors.danger }}>
              Preview unavailable: {previewError}
            </AppText>
          ) : null}
          {preview ? (
            <>
              <AppText variant="label">Allocation preview</AppText>
              {preview.allocations.slice(0, 20).map((row, index) => (
                <AppText
                  key={`${row.pledgeId}-${row.periodStart}-${index}`}
                  variant="caption">
                  {data.projects.find(
                    p =>
                      p.id ===
                      data.pledges.find(pledge => pledge.id === row.pledgeId)
                        ?.projectId,
                  )?.name ?? 'Project'}{' '}
                  · {row.periodStart} · {formatUGX(row.amount)}
                </AppText>
              ))}
              {preview.allocations.length > 20 ? (
                <AppText variant="caption" muted>
                  And {preview.allocations.length - 20} more allocated periods.
                </AppText>
              ) : null}
              {preview.unallocatedCredit ? (
                <AppText variant="caption">
                  Unallocated credit: {formatUGX(preview.unallocatedCredit)}
                </AppText>
              ) : null}
            </>
          ) : null}
        </>
      )}
      {error ? (
        <AppText style={{ color: colors.danger }}>{error}</AppText>
      ) : null}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
  stats: { flexDirection: 'row', gap: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pledgeRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
