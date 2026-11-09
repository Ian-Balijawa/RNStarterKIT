import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { AppScreen } from '../../components/layout/AppScreen'
import { AppBottomSheet } from '../../components/overlays/AppBottomSheet'
import { SheetField } from '../../components/forms/SheetField'
import { AppButton } from '../../components/ui/AppButton'
import { AppCard } from '../../components/ui/AppCard'
import { AppChip } from '../../components/ui/AppChip'
import { AppProgress } from '../../components/ui/AppProgress'
import { AppText } from '../../components/ui/AppText'
import { useAppTheme } from '../../theme/theme'
import {
  allocationPledges,
  balanceForPledge,
  formatUGX,
  kampalaDate,
  newId,
  totalContributions,
} from './model'
import type { ContributionsData, Pledge, Project } from './model'
import { rebuildAllocations } from './allocation'

type Props = {
  data: ContributionsData
  onChange: (data: ContributionsData) => void
  onAddPledge: (memberId?: string, projectId?: string) => void
  onAddContribution: (memberId?: string, projectId?: string) => void
}

export function ProjectsScreen({
  data,
  onChange,
  onAddPledge,
  onAddContribution,
}: Props) {
  const { colors } = useAppTheme()
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<Project | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [managingMembers, setManagingMembers] = useState(false)
  const [managingPledgeId, setManagingPledgeId] = useState<string | null>(null)
  const project = data.projects.find(item => item.id === selected)
  const projectPledges = data.pledges.filter(
    item => item.projectId === project?.id,
  )
  const projectBalances = projectPledges.map(item =>
    balanceForPledge(item, data.contributions),
  )
  const projectDebt = projectBalances.reduce((sum, item) => sum + item.debt, 0)
  const projectDueNow = projectBalances.reduce(
    (sum, item) => sum + item.dueNow,
    0,
  )
  const projectAdvance = projectBalances.reduce(
    (sum, item) => sum + item.advance,
    0,
  )
  const beginEdit = (item?: Project) => {
    setSelected(null)
    setEditing(item ?? null)
    setFormVisible(true)
  }
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
            const raised = totalContributions(data.contributions, {
              projectId: item.id,
            })
            const count = (item.memberIds ?? []).length
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
            )
          })
        )}
      </AppScreen>
      <AppBottomSheet
        visible={!!project}
        onDismiss={() => {
          setSelected(null)
          setManagingMembers(false)
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
            <View style={styles.row}>
              <AppText variant="label" style={styles.grow}>
                Participants
              </AppText>
              <AppButton
                title={managingMembers ? 'Done' : 'Manage members'}
                variant="ghost"
                onPress={() => setManagingMembers(!managingMembers)}
              />
            </View>
            {managingMembers ? (
              <>
                <AppText variant="caption" muted>
                  Select members from any church to attach or detach. Their
                  pledges and payments are retained when detached.
                </AppText>
                <View style={styles.chips}>
                  {data.members.map(member => (
                    <AppChip
                      key={member.id}
                      label={member.name}
                      selected={(project.memberIds ?? []).includes(member.id)}
                      onPress={() => {
                        const ids = project.memberIds ?? []
                        const memberIds = ids.includes(member.id)
                          ? ids.filter(id => id !== member.id)
                          : [...ids, member.id]
                        onChange({
                          ...data,
                          projects: data.projects.map(item =>
                            item.id === project.id
                              ? { ...item, memberIds }
                              : item,
                          ),
                        })
                      }}
                    />
                  ))}
                </View>
                {!data.members.length ? (
                  <AppText muted>Register members first.</AppText>
                ) : null}
              </>
            ) : (
              <AppText muted>
                {(project.memberIds ?? [])
                  .map(
                    id => data.members.find(member => member.id === id)?.name,
                  )
                  .filter(Boolean)
                  .join(', ') || 'No participants attached yet.'}
              </AppText>
            )}
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
                  const balance = balanceForPledge(pledge, data.contributions)
                  const covered = Math.floor(balance.advance / pledge.amount)
                  const interval =
                    pledge.frequency === 'daily'
                      ? 'day'
                      : pledge.frequency === 'weekly'
                      ? 'week'
                      : 'month'
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
                      <AppButton
                        title="Manage"
                        variant="ghost"
                        onPress={() => {
                          setSelected(null)
                          setManagingPledgeId(pledge.id)
                        }}
                      />
                    </View>
                  )
                })
            )}
            <AppButton
              title="Add member pledge"
              onPress={() => {
                setSelected(null)
                onAddPledge(undefined, project.id)
              }}
            />
            <AppButton
              title="Record contribution"
              variant="secondary"
              onPress={() => {
                setSelected(null)
                onAddContribution(undefined, project.id)
              }}
            />
            <AppButton
              title="Edit project & churches"
              variant="outline"
              onPress={() => beginEdit(project)}
            />
          </>
        ) : null}
      </AppBottomSheet>
      <PledgeManagementSheet
        pledge={data.pledges.find(item => item.id === managingPledgeId) ?? null}
        data={data}
        onDismiss={() => setManagingPledgeId(null)}
        onChange={onChange}
      />
      <ProjectForm
        visible={formVisible}
        project={editing}
        data={data}
        onDismiss={() => setFormVisible(false)}
        onSave={item => {
          onChange({
            ...data,
            projects: editing
              ? data.projects.map(p => (p.id === item.id ? item : p))
              : [...data.projects, item],
          })
          setFormVisible(false)
        }}
      />
    </>
  )
}

type PledgeAction = 'pause' | 'resume' | 'cancel' | 'change'

function previousDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10)
}

function PledgeManagementSheet({
  pledge,
  data,
  onDismiss,
  onChange,
}: {
  pledge: Pledge | null
  data: ContributionsData
  onDismiss: () => void
  onChange: (data: ContributionsData) => void
}) {
  const { colors } = useAppTheme()
  const [action, setAction] = useState<PledgeAction>('pause')
  const [date, setDate] = useState(kampalaDate())
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const pauses = pledge?.pauses ?? []
  const openPause = pauses.find(item => !item.endDate)
  const project = data.projects.find(item => item.id === pledge?.projectId)
  const closed =
    pledge?.status === 'cancelled' ||
    pledge?.status === 'completed' ||
    project?.status === 'cancelled' ||
    project?.status === 'completed'
  useEffect(() => {
    if (pledge) {
      setAction(pledge.pauses?.some(item => !item.endDate) ? 'resume' : 'pause')
      setDate(kampalaDate())
      setAmount(String(pledge.amount))
      setError('')
    }
  }, [pledge])
  const save = () => {
    if (!pledge) return
    if (closed) {
      setError('This pledge or project is closed.')
      return
    }
    if (!validDate(date) || date < pledge.startDate || date > kampalaDate()) {
      setError('Enter a date from the pledge start through today.')
      return
    }
    if (pledge.endDate && date > pledge.endDate) {
      setError('The date must not be after the pledge end.')
      return
    }
    if (
      (action === 'pause' && openPause) ||
      (action === 'resume' && !openPause)
    ) {
      setError('The pledge is already in that state.')
      return
    }
    if (action === 'resume' && openPause && date <= openPause.startDate) {
      setError('Resume after the pause start date.')
      return
    }
    if (
      action === 'pause' &&
      pauses.some(item => !item.endDate || item.endDate >= date)
    ) {
      setError('The pause must start after all earlier pauses.')
      return
    }
    if (action === 'change' && openPause) {
      setError('Resume the pledge before changing its amount.')
      return
    }
    if (
      action === 'change' &&
      (date <= pledge.startDate ||
        pauses.some(item => !item.endDate || item.endDate >= date))
    ) {
      setError(
        'The change must follow the pledge start and all previous pauses.',
      )
      return
    }
    const amountValue = Number(amount.replace(/,/g, ''))
    if (
      action === 'change' &&
      (!/^\d[\d,]*$/.test(amount.trim()) ||
        !Number.isSafeInteger(amountValue) ||
        amountValue <= 0)
    ) {
      setError('Enter a positive whole amount.')
      return
    }
    if (action === 'cancel' && pauses.some(item => item.startDate > date)) {
      setError('The end date cannot precede a recorded pause.')
      return
    }
    let replacement: Pledge[]
    if (action === 'pause')
      replacement = [
        {
          ...pledge,
          pauses: [...pauses, { startDate: date }],
          status: 'paused',
        },
      ]
    else if (action === 'resume')
      replacement = [
        {
          ...pledge,
          pauses: pauses.map(item =>
            item === openPause
              ? { ...item, endDate: previousDate(date) }
              : item,
          ),
          status: 'active',
        },
      ]
    else if (action === 'cancel')
      replacement = [
        {
          ...pledge,
          endDate: date,
          pauses: pauses.map(item =>
            !item.endDate ? { ...item, endDate: date } : item,
          ),
          status: 'cancelled',
        },
      ]
    else {
      const priorEnd = pledge.endDate
      const overlaps = data.pledges.some(
        item =>
          item.id !== pledge.id &&
          item.memberId === pledge.memberId &&
          item.projectId === pledge.projectId &&
          (!item.endDate || item.endDate >= date) &&
          (!priorEnd || item.startDate <= priorEnd),
      )
      if (overlaps) {
        setError(
          'The new version would overlap another pledge for this project.',
        )
        return
      }
      replacement = [
        { ...pledge, endDate: previousDate(date), status: 'completed' },
        {
          ...pledge,
          id: newId(),
          amount: amountValue,
          startDate: date,
          endDate: priorEnd,
          pauses: [],
          status: 'active',
          calculatedBalance: undefined,
          effectiveEndDate: undefined,
        },
      ]
    }
    const next = {
      ...data,
      pledges: [
        ...data.pledges.filter(item => item.id !== pledge.id),
        ...replacement,
      ],
    }
    try {
      rebuildAllocations({
        memberId: pledge.memberId,
        pledges: allocationPledges(next, pledge.memberId).map(item => ({
          ...item,
          endDate: item.effectiveEndDate,
        })),
        payments: data.contributions.map(item => ({
          ...item,
          voided: !!item.voidedAt,
        })),
        asOf: kampalaDate(),
      })
    } catch {
      setError(
        'This change cannot be applied because the allocation exceeds supported limits.',
      )
      return
    }
    onChange(next)
    onDismiss()
  }
  return (
    <AppBottomSheet
      visible={!!pledge}
      onDismiss={onDismiss}
      title="Manage pledge"
      scrollable
      snapPoints={['75%', '95%']}
      footer={<AppButton title="Save pledge change" onPress={save} />}>
      {pledge ? (
        <>
          <AppText variant="label">
            {data.members.find(item => item.id === pledge.memberId)?.name ??
              'Member'}{' '}
            · {formatUGX(pledge.amount)} {pledge.frequency}
          </AppText>
          <AppText muted variant="caption">
            Status: {pledge.status ?? 'active'}. Previous periods retain their
            original amount.
          </AppText>
          <AppText variant="label">Action</AppText>
          <View style={styles.chips}>
            {(openPause
              ? (['resume', 'cancel'] as const)
              : (['pause', 'change', 'cancel'] as const)
            ).map(item => (
              <AppChip
                key={item}
                label={
                  item === 'change'
                    ? 'Change amount'
                    : item === 'cancel'
                    ? 'Cancel pledge'
                    : item === 'pause'
                    ? 'Pause'
                    : 'Resume'
                }
                selected={action === item}
                onPress={() => {
                  setAction(item)
                  setError('')
                }}
              />
            ))}
          </View>
          <SheetField
            label={
              action === 'cancel'
                ? 'Last date (YYYY-MM-DD)'
                : 'Effective date (YYYY-MM-DD)'
            }
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
          {action === 'change' ? (
            <SheetField
              label="New amount per period (UGX)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholder="e.g. 1000"
            />
          ) : null}
          {action === 'pause' ? (
            <AppText muted variant="caption">
              Any calendar period touched by a pause has no demand. Resume from
              the next desired active date.
            </AppText>
          ) : null}
          {action === 'change' ? (
            <AppText muted variant="caption">
              A new pledge version begins on this date. A period already started
              keeps its previous amount.
            </AppText>
          ) : null}
          {closed ? (
            <AppText muted>
              This pledge is closed and cannot be changed.
            </AppText>
          ) : null}
          {error ? (
            <AppText style={{ color: colors.danger }}>{error}</AppText>
          ) : null}
        </>
      ) : null}
    </AppBottomSheet>
  )
}

function ProjectForm({
  visible,
  project,
  data,
  onDismiss,
  onSave,
}: {
  visible: boolean
  project: Project | null
  data: ContributionsData
  onDismiss: () => void
  onSave: (project: Project) => void
}) {
  const { colors } = useAppTheme()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState('')
  const [churchIds, setChurchIds] = useState<string[]>([])
  const [ownerChurchId, setOwnerChurchId] = useState('')
  const [status, setStatus] = useState<NonNullable<Project['status']>>('active')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (visible) {
      setName(project?.name ?? '')
      setDescription(project?.description ?? '')
      setTarget(project?.targetAmount ? String(project.targetAmount) : '')
      setChurchIds(project?.churchIds ?? [])
      setOwnerChurchId(project?.ownerChurchId ?? '')
      setStatus(project?.status ?? 'active')
      setStartDate(project?.startDate ?? kampalaDate())
      setEndDate(project?.endDate ?? '')
      setError('')
    }
  }, [visible, project])
  const save = () => {
    const amount = target.trim() ? Number(target.replace(/,/g, '')) : 0
    if (
      !name.trim() ||
      (target.trim() && !/^\d[\d,]*$/.test(target.trim())) ||
      !Number.isSafeInteger(amount) ||
      amount < 0 ||
      !ownerChurchId ||
      !validDate(startDate) ||
      (!!endDate && (!validDate(endDate) || endDate < startDate)) ||
      ((status === 'completed' || status === 'cancelled') && !endDate)
    ) {
      setError(
        'Enter a name, owner and valid dates. Completed or cancelled projects need an end date.',
      )
      return
    }
    const nextProject: Project = {
      id: project?.id ?? newId(),
      name: name.trim(),
      description: description.trim(),
      targetAmount: amount,
      churchIds,
      memberIds: project?.memberIds ?? [],
      ownerChurchId,
      status,
      startDate,
      endDate: endDate || undefined,
    }
    const nextData = {
      ...data,
      projects: project
        ? data.projects.map(item =>
            item.id === project.id ? nextProject : item,
          )
        : [...data.projects, nextProject],
    }
    try {
      for (const memberId of new Set(
        data.pledges
          .filter(item => item.projectId === nextProject.id)
          .map(item => item.memberId),
      )) {
        rebuildAllocations({
          memberId,
          pledges: allocationPledges(nextData, memberId).map(item => ({
            ...item,
            endDate: item.effectiveEndDate,
          })),
          payments: data.contributions.map(item => ({
            ...item,
            voided: !!item.voidedAt,
          })),
          asOf: kampalaDate(),
        })
      }
    } catch {
      setError(
        'This project change exceeds the supported number of scheduled periods.',
      )
      return
    }
    onSave(nextProject)
  }
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
            onPress={() => setOwnerChurchId(church.id)}
          />
        ))}
      </View>
      <SheetField
        label="Start date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
        placeholder="YYYY-MM-DD"
      />
      <SheetField
        label="End date (optional)"
        value={endDate}
        onChangeText={setEndDate}
        placeholder="YYYY-MM-DD"
      />
      <AppText variant="label">Status</AppText>
      <View style={styles.chips}>
        {(['draft', 'active', 'completed', 'cancelled'] as const).map(
          option => (
            <AppChip
              key={option}
              label={option}
              selected={status === option}
              onPress={() => setStatus(option)}
            />
          ),
        )}
      </View>
      <AppText variant="label">Connect churches (optional)</AppText>
      <AppText variant="caption" muted>
        Members from any church can still contribute.
      </AppText>
      <View style={styles.chips}>
        {data.churches.map(church => (
          <AppChip
            key={church.id}
            label={church.name}
            selected={churchIds.includes(church.id)}
            onPress={() =>
              setChurchIds(ids =>
                ids.includes(church.id)
                  ? ids.filter(id => id !== church.id)
                  : [...ids, church.id],
              )
            }
          />
        ))}
      </View>
      {data.churches.length === 0 ? (
        <AppText muted>Register a church to connect it here.</AppText>
      ) : null}
      {error ? (
        <AppText style={{ color: colors.danger }}>{error}</AppText>
      ) : null}
    </AppBottomSheet>
  )
}

export type ContributionFlow = {
  kind: 'pledge' | 'contribution'
  memberId?: string
  projectId?: string
} | null
function localDate() {
  return kampalaDate()
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function ContributionSheets({
  data,
  onChange,
  flow,
  onDismiss,
}: {
  data: ContributionsData
  onChange: (data: ContributionsData) => void
  flow: ContributionFlow
  onDismiss: () => void
}) {
  const { colors } = useAppTheme()
  const [memberId, setMemberId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [method, setMethod] = useState<
    'cash' | 'mobile money' | 'bank' | 'other'
  >('cash')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [endDate, setEndDate] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Pledge['frequency']>('monthly')
  const [date, setDate] = useState(localDate())
  const [error, setError] = useState('')
  useEffect(() => {
    if (flow) {
      setMemberId(flow.memberId ?? '')
      setProjectId(flow.projectId ?? '')
      setPaymentId(newId())
      setMethod('cash')
      setReference('')
      setNote('')
      setEndDate('')
      setAmount('')
      setFrequency('monthly')
      setDate(localDate())
      setError('')
    }
  }, [flow])
  const value = Number(amount.replace(/,/g, ''))
  const preview = (() => {
    if (
      flow?.kind !== 'contribution' ||
      !memberId ||
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      !validDate(date) ||
      date > localDate()
    )
      return null
    try {
      const result = rebuildAllocations({
        memberId,
        pledges: allocationPledges(data, memberId).map(p => ({
          ...p,
          endDate: p.effectiveEndDate,
        })),
        payments: [
          ...data.contributions.map(item => ({
            ...item,
            voided: !!item.voidedAt,
          })),
          {
            id: paymentId,
            memberId,
            projectId: projectId || undefined,
            amount: value,
            paidAt: date,
          },
        ],
        asOf: localDate(),
      })
      return {
        rows: result.allocations.filter(row => row.paymentId === paymentId),
        unallocated:
          result.unallocated.find(item => item.paymentId === paymentId)
            ?.amount ?? 0,
        error: '',
      }
    } catch {
      return {
        rows: [],
        unallocated: 0,
        error:
          'This payment exceeds the supported number of scheduled periods.',
      }
    }
  })()
  const save = () => {
    if (
      !/^\d[\d,]*$/.test(amount.trim()) ||
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      !validDate(date)
    ) {
      setError('Enter a positive whole amount and a valid date (YYYY-MM-DD).')
      return
    }
    if (flow?.kind === 'contribution' && date > localDate()) {
      setError('The date received cannot be in the future.')
      return
    }
    if (flow?.kind === 'pledge') {
      if (!memberId || !projectId) {
        setError('Choose a member and project.')
        return
      }
      const chosenProject = data.projects.find(
        project => project.id === projectId,
      )
      if (
        chosenProject?.status === 'completed' ||
        chosenProject?.status === 'cancelled'
      ) {
        setError('This project is closed to new pledges.')
        return
      }
      if (endDate && (!validDate(endDate) || endDate < date)) {
        setError('Enter an end date on or after the start date.')
        return
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
        )
        return
      }
      const next = {
        ...data,
        projects: data.projects.map(item =>
          item.id === projectId
            ? {
                ...item,
                memberIds: Array.from(
                  new Set([...(item.memberIds ?? []), memberId]),
                ),
              }
            : item,
        ),
        pledges: [
          ...data.pledges,
          {
            id: newId(),
            memberId,
            projectId,
            amount: value,
            frequency,
            startDate: date,
            endDate: endDate || undefined,
            status: 'active' as const,
          },
        ],
      }
      try {
        rebuildAllocations({
          memberId,
          pledges: allocationPledges(next, memberId).map(item => ({
            ...item,
            endDate: item.effectiveEndDate,
          })),
          payments: data.contributions.map(item => ({
            ...item,
            voided: !!item.voidedAt,
          })),
          asOf: localDate(),
        })
      } catch {
        setError(
          'This pledge exceeds the supported number of scheduled periods.',
        )
        return
      }
      onChange(next)
    } else {
      if (!memberId) {
        setError('Choose a member.')
        return
      }
      if (preview?.error) {
        setError(preview.error)
        return
      }
      const member = data.members.find(item => item.id === memberId)
      onChange({
        ...data,
        contributions: [
          ...data.contributions,
          {
            id: paymentId,
            memberId,
            projectId: projectId || undefined,
            churchId: member?.churchId,
            amount: value,
            paidAt: date,
            method,
            reference: reference.trim(),
            note: note.trim(),
          },
        ],
      })
    }
    onDismiss()
  }
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
            {(['cash', 'mobile money', 'bank', 'other'] as const).map(
              option => (
                <AppChip
                  key={option}
                  label={option}
                  selected={method === option}
                  onPress={() => setMethod(option)}
                />
              ),
            )}
          </View>
          <SheetField
            label="Reference (optional)"
            value={reference}
            onChangeText={setReference}
            placeholder="Receipt or transaction reference"
          />
          <SheetField
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Add a note"
          />
          {preview ? (
            <>
              <AppText variant="label">Allocation preview</AppText>
              {preview.error ? (
                <AppText style={{ color: colors.danger }}>
                  {preview.error}
                </AppText>
              ) : (
                <>
                  {preview.rows.slice(0, 20).map((row, index) => (
                    <AppText
                      key={`${row.pledgeId}-${row.periodStart}-${index}`}
                      variant="caption">
                      {data.projects.find(
                        p =>
                          p.id ===
                          data.pledges.find(
                            pledge => pledge.id === row.pledgeId,
                          )?.projectId,
                      )?.name ?? 'Project'}{' '}
                      · {row.periodStart} · {formatUGX(row.amount)}
                    </AppText>
                  ))}
                  {preview.rows.length > 20 ? (
                    <AppText variant="caption" muted>
                      And {preview.rows.length - 20} more allocated periods.
                    </AppText>
                  ) : null}
                  {preview.unallocated ? (
                    <AppText variant="caption">
                      Unallocated credit: {formatUGX(preview.unallocated)}
                    </AppText>
                  ) : null}
                </>
              )}
            </>
          ) : null}
        </>
      )}
      {error ? (
        <AppText style={{ color: colors.danger }}>{error}</AppText>
      ) : null}
    </AppBottomSheet>
  )
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
})
