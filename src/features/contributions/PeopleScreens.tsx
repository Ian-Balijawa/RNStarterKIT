import React, { useContext, useState } from 'react';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppScreen } from '../../components/layout/AppScreen';
import { AppBottomSheet } from '../../components/overlays/AppBottomSheet';
import { BottomSheetInputContext } from '../../components/overlays/BottomSheetInputContext';
import { AppAvatar } from '../../components/ui/AppAvatar';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { useAppTheme } from '../../theme/theme';
import {
  allocationPledges,
  balanceForPledge,
  formatUGX,
  kampalaDate,
  newId,
  totalContributions,
} from './model';
import { rebuildAllocations } from './allocation';
import type { Church, ContributionsData, Member } from './model';

type Props = {
  data: ContributionsData;
  onSaveMember: (member: Member) => void;
  onSaveChurch: (church: Church) => void;
  onAddPledge: (memberId?: string, projectId?: string) => void;
  onAddContribution: (memberId?: string) => void;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
}) {
  const { colors, radius } = useAppTheme();
  const inSheet = useContext(BottomSheetInputContext);
  const Input = inSheet ? BottomSheetTextInput : TextInput;
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <Input
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.background,
            borderRadius: radius.md,
          },
        ]}
      />
    </View>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, radius } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.choice,
        {
          borderRadius: radius.md,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? `${colors.primary}12` : colors.surface,
        },
      ]}>
      <AppText
        variant="label"
        style={{ color: selected ? colors.primary : colors.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function Row({
  name,
  subtitle,
  detail,
  onPress,
}: {
  name: string;
  subtitle: string;
  detail?: string;
  onPress: () => void;
}) {
  const { colors, radius } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          opacity: pressed ? 0.75 : 1,
        },
      ]}>
      <AppAvatar name={name} size={46} />
      <View style={styles.rowBody}>
        <AppText variant="label" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <View style={styles.rowEnd}>
        {detail ? (
          <AppText
            variant="caption"
            style={{ color: colors.primary, fontWeight: '700' }}>
            {detail}
          </AppText>
        ) : null}
        <AppText muted style={styles.chevron}>
          ›
        </AppText>
      </View>
    </Pressable>
  );
}

function Empty({ title, description }: { title: string; description: string }) {
  const { colors, radius } = useAppTheme();
  return (
    <View
      style={[
        styles.empty,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
        },
      ]}>
      <AppText variant="label">{title}</AppText>
      <AppText muted variant="caption">
        {description}
      </AppText>
    </View>
  );
}

export function PeopleScreen({
  data,
  onSaveMember,
  onAddPledge,
  onAddContribution,
}: Props) {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const [showStatement, setShowStatement] = useState(false);
  const [statementLimit, setStatementLimit] = useState(50);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Member['gender']>();
  const [joinedAt, setJoinedAt] = useState('');
  const [churchIds, setChurchIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [memberFilter, setMemberFilter] = useState<
    'all' | 'active' | 'inactive' | 'debt' | 'advance'
  >('all');
  const [churchFilter, setChurchFilter] = useState<string | undefined>();
  const [projectFilter, setProjectFilter] = useState<string | undefined>();
  const [churchId, setChurchId] = useState<string | undefined>();
  const [error, setError] = useState('');
  const member = data.members.find(item => item.id === detailId);
  const filtered = data.members.filter(item => {
    if (
      !`${item.name} ${item.phone} ${item.email || ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    )
      return false;
    if (
      churchFilter &&
      item.churchId !== churchFilter &&
      !item.churchIds?.includes(churchFilter)
    )
      return false;
    const pledges = data.pledges.filter(pledge => pledge.memberId === item.id);
    if (
      projectFilter &&
      !pledges.some(pledge => pledge.projectId === projectFilter)
    )
      return false;
    if (memberFilter === 'active' && item.status === 'inactive') return false;
    if (memberFilter === 'inactive' && item.status !== 'inactive') return false;
    if (
      memberFilter === 'debt' &&
      !pledges.some(
        pledge => balanceForPledge(pledge, data.contributions).debt > 0,
      )
    )
      return false;
    if (
      memberFilter === 'advance' &&
      !pledges.some(
        pledge => balanceForPledge(pledge, data.contributions).advance > 0,
      )
    )
      return false;
    return true;
  });
  function openForm(item?: Member) {
    setEditing(item || null);
    setName(item?.name || '');
    setPhone(item?.phone || '');
    setGender(item?.gender);
    setJoinedAt(item?.joinedAt || '');
    setChurchIds(item?.churchIds || []);
    setStatus(item?.status || 'active');
    setChurchId(item?.churchId);
    setError('');
    setDetailId(null);
    setFormOpen(true);
  }
  function save() {
    if (!name.trim()) {
      setError('Enter the member’s name.');
      return;
    }
    if (joinedAt.trim()) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(joinedAt.trim());
      const date = match
        ? new Date(
            Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
          )
        : null;
      if (
        !match ||
        !date ||
        date.getUTCFullYear() !== Number(match[1]) ||
        date.getUTCMonth() !== Number(match[2]) - 1 ||
        date.getUTCDate() !== Number(match[3])
      ) {
        setError('Enter a valid date joined in YYYY-MM-DD format.');
        return;
      }
    }
    const normalizedPhone = phone.replace(/[^0-9+]/g, '');
    const memberChurches = [churchId, ...churchIds].filter(Boolean);
    if (
      normalizedPhone &&
      data.members.some(
        item =>
          item.id !== editing?.id &&
          item.phone.replace(/[^0-9+]/g, '') === normalizedPhone &&
          [item.churchId, ...(item.churchIds || [])].some(
            id => id && memberChurches.includes(id),
          ),
      )
    ) {
      setError(
        'Another member of a selected church already has this phone number.',
      );
      return;
    }
    onSaveMember({
      ...editing,
      id: editing?.id || newId(),
      name: name.trim(),
      phone: phone.trim(),
      gender,
      joinedAt: joinedAt.trim() || undefined,
      churchId,
      churchIds: churchIds.filter(id => id !== churchId),
      status,
    });
    setFormOpen(false);
  }
  const memberPledges = data.pledges.filter(
    item => item.memberId === member?.id,
  );
  const memberPaid = member
    ? totalContributions(data.contributions, { memberId: member.id })
    : 0;
  const debt = memberPledges.reduce(
    (sum, item) => sum + balanceForPledge(item, data.contributions).debt,
    0,
  );
  const dueNow = memberPledges.reduce(
    (sum, item) => sum + balanceForPledge(item, data.contributions).dueNow,
    0,
  );
  const unallocated = member
    ? data.contributions
        .filter(item => item.memberId === member.id && !item.voidedAt)
        .reduce(
          (sum, item) =>
            sum +
            Math.max(
              0,
              item.amount -
                (item.allocations ?? []).reduce(
                  (allocated, row) => allocated + row.amount,
                  0,
                ),
            ),
          0,
        )
    : 0;
  const statement =
    member && showStatement
      ? rebuildAllocations({
          memberId: member.id,
          pledges: allocationPledges(data, member.id).map(item => ({
            ...item,
            endDate: item.effectiveEndDate,
          })),
          payments: data.contributions.map(item => ({
            ...item,
            voided: !!item.voidedAt,
          })),
          asOf: kampalaDate(),
        }).periods
      : [];
  let runningBalance = 0;
  const advance = memberPledges.reduce(
    (sum, item) => sum + balanceForPledge(item, data.contributions).advance,
    0,
  );
  return (
    <>
      <AppScreen
        scroll
        contentBottomPadding={100}
        eyebrow="YOUR COMMUNITY"
        title="Members"
        subtitle="Keep every person and their commitments in one place."
        headerAction={
          <AppButton
            title="Add member"
            icon="plus"
            onPress={() => openForm()}
          />
        }>
        <Field
          label="Search members"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or phone"
        />
        <View style={styles.choices}>
          {(['all', 'active', 'inactive', 'debt', 'advance'] as const).map(
            filter => (
              <Choice
                key={filter}
                label={
                  filter === 'debt'
                    ? 'In debt'
                    : filter === 'advance'
                    ? 'In advance'
                    : filter[0].toUpperCase() + filter.slice(1)
                }
                selected={memberFilter === filter}
                onPress={() => setMemberFilter(filter)}
              />
            ),
          )}
        </View>
        {data.churches.length > 0 && (
          <View style={styles.field}>
            <AppText variant="caption" muted>
              Church
            </AppText>
            <View style={styles.choices}>
              <Choice
                label="All churches"
                selected={!churchFilter}
                onPress={() => setChurchFilter(undefined)}
              />
              {data.churches.map(church => (
                <Choice
                  key={church.id}
                  label={church.name}
                  selected={churchFilter === church.id}
                  onPress={() => setChurchFilter(church.id)}
                />
              ))}
            </View>
          </View>
        )}
        {data.projects.length > 0 && (
          <View style={styles.field}>
            <AppText variant="caption" muted>
              Project
            </AppText>
            <View style={styles.choices}>
              <Choice
                label="All projects"
                selected={!projectFilter}
                onPress={() => setProjectFilter(undefined)}
              />
              {data.projects.map(project => (
                <Choice
                  key={project.id}
                  label={project.name}
                  selected={projectFilter === project.id}
                  onPress={() => setProjectFilter(project.id)}
                />
              ))}
            </View>
          </View>
        )}
        <View style={styles.sectionTitle}>
          <AppText variant="heading">Members</AppText>
          <AppText variant="caption" muted>
            {filtered.length} {filtered.length === 1 ? 'person' : 'people'}
          </AppText>
        </View>
        <View style={styles.list}>
          {filtered.map(item => {
            const church = data.churches.find(ch => ch.id === item.churchId);
            const paid = totalContributions(data.contributions, {
              memberId: item.id,
            });
            return (
              <Row
                key={item.id}
                name={item.name}
                subtitle={`${church?.name || 'No church assigned'}${
                  item.status === 'inactive' ? ' · Inactive' : ''
                }`}
                detail={formatUGX(paid)}
                onPress={() => setDetailId(item.id)}
              />
            );
          })}
          {filtered.length === 0 && (
            <Empty
              title={query ? 'No members found' : 'Your community starts here'}
              description={
                query
                  ? 'Try another name or phone number.'
                  : 'Add a member to record their pledges and contributions.'
              }
            />
          )}
        </View>
      </AppScreen>
      <AppBottomSheet
        visible={formOpen}
        onDismiss={() => setFormOpen(false)}
        title={editing ? 'Edit member' : 'Add member'}
        scrollable
        footer={
          <AppButton
            title={editing ? 'Save changes' : 'Add member'}
            onPress={save}
          />
        }>
        <AppText muted>Details can be updated any time.</AppText>
        <Field
          label="Full name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sarah Nakato"
        />
        <Field
          label="Phone number (optional)"
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. 0700 000 000"
          keyboardType="phone-pad"
        />
        <Field
          label="Date joined (optional)"
          value={joinedAt}
          onChangeText={setJoinedAt}
          placeholder="YYYY-MM-DD"
        />
        <View style={styles.field}>
          <AppText variant="label">Gender (optional)</AppText>
          <View style={styles.choices}>
            <Choice
              label="Not specified"
              selected={!gender}
              onPress={() => setGender(undefined)}
            />
            {(['female', 'male', 'other'] as const).map(option => (
              <Choice
                key={option}
                label={option[0].toUpperCase() + option.slice(1)}
                selected={gender === option}
                onPress={() => setGender(option)}
              />
            ))}
          </View>
        </View>
        <View style={styles.field}>
          <AppText variant="label">Status</AppText>
          <View style={styles.choices}>
            <Choice
              label="Active"
              selected={status === 'active'}
              onPress={() => setStatus('active')}
            />
            <Choice
              label="Inactive"
              selected={status === 'inactive'}
              onPress={() => setStatus('inactive')}
            />
          </View>
        </View>
        <View style={styles.field}>
          <AppText variant="label">Home church (optional)</AppText>
          <AppText variant="caption" muted>
            Choose the member’s home church. They can still support projects
            from other churches.
          </AppText>
          <View style={styles.choices}>
            <Choice
              label="No church"
              selected={!churchId}
              onPress={() => setChurchId(undefined)}
            />
            {data.churches.map(church => (
              <Choice
                key={church.id}
                label={church.name}
                selected={churchId === church.id}
                onPress={() => setChurchId(church.id)}
              />
            ))}
          </View>
        </View>
        {data.churches.some(church => church.id !== churchId) && (
          <View style={styles.field}>
            <AppText variant="label">Additional churches</AppText>
            <AppText variant="caption" muted>
              These links do not change the home church used for contribution
              totals.
            </AppText>
            <View style={styles.choices}>
              {data.churches
                .filter(church => church.id !== churchId)
                .map(church => (
                  <Choice
                    key={church.id}
                    label={church.name}
                    selected={churchIds.includes(church.id)}
                    onPress={() =>
                      setChurchIds(current =>
                        current.includes(church.id)
                          ? current.filter(id => id !== church.id)
                          : [...current, church.id],
                      )
                    }
                  />
                ))}
            </View>
          </View>
        )}
        {error ? (
          <AppText variant="caption" style={{ color: colors.danger }}>
            {error}
          </AppText>
        ) : null}
      </AppBottomSheet>
      <AppBottomSheet
        visible={!!member}
        onDismiss={() => setDetailId(null)}
        title={member?.name}
        scrollable>
        {member ? (
          <>
            <View style={styles.detailIntro}>
              <AppAvatar name={member.name} size={56} />
              <View style={styles.rowBody}>
                <AppText variant="heading">{member.name}</AppText>
                <AppText muted variant="caption">
                  {data.churches.find(ch => ch.id === member.churchId)?.name ||
                    'No church assigned'}
                  {member.phone ? ` · ${member.phone}` : ''}
                  {member.email ? ` · ${member.email}` : ''}
                  {member.status === 'inactive' ? ' · Inactive' : ''}
                  {member.joinedAt ? ` · Joined ${member.joinedAt}` : ''}
                </AppText>
              </View>
            </View>
            {(member.churchIds || []).length > 0 && (
              <AppText variant="caption" muted>
                Also linked to:{' '}
                {(member.churchIds || [])
                  .map(
                    id => data.churches.find(church => church.id === id)?.name,
                  )
                  .filter(Boolean)
                  .join(', ')}
              </AppText>
            )}
            <View style={styles.metrics}>
              <Metric label="TOTAL GIVEN" value={formatUGX(memberPaid)} />
              <Metric label="OUTSTANDING" value={formatUGX(debt)} />
            </View>
            <View style={styles.metrics}>
              <Metric label="DUE THIS PERIOD" value={formatUGX(dueNow)} />
              <Metric label="ADVANCE" value={formatUGX(advance)} />
            </View>
            <View style={styles.metrics}>
              <Metric
                label="THIS WEEK"
                value={formatUGX(
                  totalContributions(data.contributions, {
                    memberId: member.id,
                    period: 'weekly',
                  }),
                )}
              />
              <Metric
                label="THIS MONTH"
                value={formatUGX(
                  totalContributions(data.contributions, {
                    memberId: member.id,
                    period: 'monthly',
                  }),
                )}
              />
            </View>
            {unallocated > 0 ? (
              <AppText muted>
                Unallocated credit: {formatUGX(unallocated)}
              </AppText>
            ) : null}
            <View style={styles.actions}>
              <AppButton
                title="Record gift"
                onPress={() => {
                  setDetailId(null);
                  onAddContribution(member.id);
                }}
                style={styles.flex}
              />
              <AppButton
                title="Add pledge"
                variant="outline"
                onPress={() => {
                  setDetailId(null);
                  onAddPledge(member.id);
                }}
                style={styles.flex}
              />
            </View>
            <AppButton
              title={showStatement ? 'Hide statement' : 'View statement'}
              variant="secondary"
              onPress={() => {
                setShowStatement(!showStatement);
                setStatementLimit(50);
              }}
            />
            {showStatement ? (
              <>
                <AppText variant="heading">Pledge statement</AppText>
                <AppText muted variant="caption">
                  Scheduled amounts and payments by period. Running balance
                  includes future periods shown.
                </AppText>
                {statement.slice(0, statementLimit).map((period, index) => {
                  runningBalance += period.amount - period.paid;
                  return (
                    <View
                      key={`${period.pledgeId}-${period.periodStart}-${index}`}
                      style={[styles.pledge, { borderColor: colors.border }]}>
                      <AppText variant="label">
                        {period.periodStart} ·{' '}
                        {data.projects.find(
                          project => project.id === period.projectId,
                        )?.name ?? 'Project'}
                      </AppText>
                      <AppText variant="caption" muted>
                        Due {formatUGX(period.amount)} · Paid{' '}
                        {formatUGX(period.paid)} · Balance{' '}
                        {formatUGX(runningBalance)}
                      </AppText>
                    </View>
                  );
                })}
                {!statement.length ? (
                  <AppText muted>No scheduled periods yet.</AppText>
                ) : null}
                {statement.length > statementLimit ? (
                  <AppButton
                    title="Show more"
                    variant="outline"
                    onPress={() => setStatementLimit(statementLimit + 50)}
                  />
                ) : null}
              </>
            ) : null}
            <View style={styles.sectionTitle}>
              <AppText variant="heading">Pledges</AppText>
              <AppButton
                title="Edit"
                variant="ghost"
                onPress={() => openForm(member)}
              />
            </View>
            {memberPledges.length ? (
              memberPledges.map(pledge => {
                const balance = balanceForPledge(pledge, data.contributions);
                return (
                  <View
                    key={pledge.id}
                    style={[styles.pledge, { borderColor: colors.border }]}>
                    <AppText variant="label">
                      {data.projects.find(
                        project => project.id === pledge.projectId,
                      )?.name || 'Project'}
                    </AppText>
                    <AppText variant="caption" muted>
                      {formatUGX(pledge.amount)} · {pledge.frequency}
                    </AppText>
                    <AppText
                      variant="caption"
                      style={{
                        color: balance.debt ? colors.danger : colors.success,
                      }}>
                      {balance.debt
                        ? `${formatUGX(balance.debt)} outstanding`
                        : balance.dueNow
                        ? `${formatUGX(balance.dueNow)} due this period`
                        : balance.advance
                        ? `${formatUGX(balance.advance)} in advance`
                        : 'Up to date'}
                    </AppText>
                  </View>
                );
              })
            ) : (
              <Empty
                title="No pledges yet"
                description="Add a pledge to start tracking this member’s commitment."
              />
            )}
          </>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors, radius } = useAppTheme();
  return (
    <View
      style={[
        styles.metric,
        { backgroundColor: colors.background, borderRadius: radius.md },
      ]}>
      <AppText variant="caption" muted style={styles.metricLabel}>
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

export function ChurchesScreen({ data, onSaveChurch, onSaveMember }: Props) {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Church | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [churchStatus, setChurchStatus] = useState<'active' | 'inactive'>(
    'active',
  );
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const church = data.churches.find(item => item.id === detailId);
  const filtered = data.churches.filter(item =>
    `${item.name} ${item.location}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  function openForm(item?: Church) {
    setEditing(item || null);
    setName(item?.name || '');
    setLocation(item?.location || '');
    setContact(item?.contact || '');
    setChurchStatus(item?.status || 'active');
    setError('');
    setDetailId(null);
    setFormOpen(true);
  }
  function save() {
    if (!name.trim()) {
      setError('Enter the church name.');
      return;
    }
    onSaveChurch({
      ...editing,
      id: editing?.id || newId(),
      name: name.trim(),
      location: location.trim(),
      contact: contact.trim() || undefined,
      status: churchStatus,
    });
    setFormOpen(false);
  }
  const members = data.members.filter(
    item =>
      church &&
      (item.churchId === church.id || item.churchIds?.includes(church.id)),
  );
  const total = church
    ? totalContributions(data.contributions, { churchId: church.id })
    : 0;
  const homeMembers = data.members.filter(item => item.churchId === church?.id);
  const homePledges = data.pledges.filter(item =>
    homeMembers.some(member => member.id === item.memberId),
  );
  const debtByMember = homeMembers.map(member => ({
    id: member.id,
    debt: homePledges
      .filter(item => item.memberId === member.id)
      .reduce(
        (sum, item) => sum + balanceForPledge(item, data.contributions).debt,
        0,
      ),
  }));
  const totalDebt = debtByMember.reduce((sum, item) => sum + item.debt, 0);
  const debtCount = debtByMember.filter(item => item.debt > 0).length;
  const ownedProjects = data.projects.filter(
    item => church && item.ownerChurchId === church.id,
  );
  const projectTotal = ownedProjects.reduce(
    (sum, item) =>
      sum + totalContributions(data.contributions, { projectId: item.id }),
    0,
  );
  const projects = data.projects.filter(
    item =>
      church &&
      (item.ownerChurchId === church.id || item.churchIds.includes(church.id)),
  );
  return (
    <>
      <AppScreen
        scroll
        contentBottomPadding={100}
        eyebrow="OUR CHURCHES"
        title="Churches"
        subtitle="Connect congregations, people and projects."
        headerAction={
          <AppButton
            title="Add church"
            icon="plus"
            onPress={() => openForm()}
          />
        }>
        <Field
          label="Search churches"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or location"
        />
        <View style={styles.sectionTitle}>
          <AppText variant="heading">All churches</AppText>
          <AppText variant="caption" muted>
            {filtered.length} {filtered.length === 1 ? 'church' : 'churches'}
          </AppText>
        </View>
        <View style={styles.list}>
          {filtered.map(item => {
            const count = data.members.filter(
              member =>
                member.churchId === item.id ||
                member.churchIds?.includes(item.id),
            ).length;
            return (
              <Row
                key={item.id}
                name={item.name}
                subtitle={`${item.location || 'Location not added'}${
                  item.status === 'inactive' ? ' · Inactive' : ''
                }`}
                detail={`${count} ${count === 1 ? 'member' : 'members'}`}
                onPress={() => setDetailId(item.id)}
              />
            );
          })}
          {filtered.length === 0 && (
            <Empty
              title={query ? 'No churches found' : 'Add your first church'}
              description={
                query
                  ? 'Try another name or location.'
                  : 'Bring your congregations together and see their impact.'
              }
            />
          )}
        </View>
      </AppScreen>
      <AppBottomSheet
        visible={formOpen}
        onDismiss={() => setFormOpen(false)}
        title={editing ? 'Edit church' : 'Add church'}
        scrollable
        footer={
          <AppButton
            title={editing ? 'Save changes' : 'Add church'}
            onPress={save}
          />
        }>
        <AppText muted>
          Register a church to connect its members and projects.
        </AppText>
        <Field
          label="Church name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Grace Community Church"
        />
        <Field
          label="Location (optional)"
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Kampala"
        />
        <Field
          label="Contact (optional)"
          value={contact}
          onChangeText={setContact}
          placeholder="Phone or email"
        />
        <View style={styles.field}>
          <AppText variant="label">Status</AppText>
          <View style={styles.choices}>
            <Choice
              label="Active"
              selected={churchStatus === 'active'}
              onPress={() => setChurchStatus('active')}
            />
            <Choice
              label="Inactive"
              selected={churchStatus === 'inactive'}
              onPress={() => setChurchStatus('inactive')}
            />
          </View>
        </View>
        {error ? (
          <AppText variant="caption" style={{ color: colors.danger }}>
            {error}
          </AppText>
        ) : null}
      </AppBottomSheet>
      <AppBottomSheet
        visible={!!church}
        onDismiss={() => {
          setDetailId(null);
          setAssigning(false);
          setAssignmentError('');
        }}
        title={church?.name}
        scrollable>
        {church ? (
          <>
            <View style={styles.detailIntro}>
              <AppAvatar name={church.name} size={56} />
              <View style={styles.rowBody}>
                <AppText variant="heading">{church.name}</AppText>
                <AppText muted variant="caption">
                  {church.location || 'Location not added'}
                  {church.contact ? ` · ${church.contact}` : ''}
                  {church.status === 'inactive' ? ' · Inactive' : ''}
                </AppText>
              </View>
            </View>
            <View style={styles.metrics}>
              <Metric label="BY HOME MEMBERS" value={formatUGX(total)} />
              <Metric
                label="TO OWNED PROJECTS"
                value={formatUGX(projectTotal)}
              />
            </View>
            <AppText variant="caption" muted>
              The first total follows the member's home church when the gift was
              recorded. The second includes gifts from anyone to this church's
              owned projects.
            </AppText>
            <View style={styles.metrics}>
              <Metric label="HOME MEMBER DEBT" value={formatUGX(totalDebt)} />
              <Metric label="MEMBERS IN DEBT" value={String(debtCount)} />
            </View>
            <View style={styles.actions}>
              <AppButton
                title={assigning ? 'Done' : 'Manage members'}
                onPress={() => setAssigning(!assigning)}
                style={styles.flex}
              />
              <AppButton
                title="Edit church"
                variant="outline"
                onPress={() => openForm(church)}
                style={styles.flex}
              />
            </View>
            {assigning ? (
              <>
                <AppText variant="label">Select members to attach</AppText>
                <AppText muted variant="caption">
                  Attach or detach church links here. Removing a home church
                  leaves the member without one; set a new home church in the
                  member's profile.
                </AppText>
                {assignmentError ? (
                  <AppText variant="caption" style={{ color: colors.danger }}>
                    {assignmentError}
                  </AppText>
                ) : null}
                <View style={styles.choices}>
                  {data.members.map(item => (
                    <Choice
                      key={item.id}
                      label={item.name}
                      selected={
                        item.churchId === church.id ||
                        !!item.churchIds?.includes(church.id)
                      }
                      onPress={() => {
                        setAssignmentError('');
                        const links = item.churchIds || [];
                        const phoneNumber = item.phone.replace(/[^0-9+]/g, '');
                        if (
                          item.churchId !== church.id &&
                          !links.includes(church.id) &&
                          phoneNumber &&
                          data.members.some(
                            other =>
                              other.id !== item.id &&
                              other.phone.replace(/[^0-9+]/g, '') ===
                                phoneNumber &&
                              (other.churchId === church.id ||
                                other.churchIds?.includes(church.id)),
                          )
                        ) {
                          setAssignmentError(
                            'Another member of this church already has this phone number.',
                          );
                          return;
                        }
                        if (item.churchId === church.id) {
                          onSaveMember({ ...item, churchId: undefined });
                          return;
                        }
                        onSaveMember({
                          ...item,
                          churchIds: links.includes(church.id)
                            ? links.filter(id => id !== church.id)
                            : [...links, church.id],
                        });
                      }}
                    />
                  ))}
                </View>
                {!data.members.length && (
                  <Empty
                    title="No members yet"
                    description="Add members first, then attach them to a church."
                  />
                )}
              </>
            ) : (
              <>
                <AppText variant="heading">Members</AppText>
                {members.length ? (
                  members.map(item => (
                    <View
                      key={item.id}
                      style={[styles.pledge, { borderColor: colors.border }]}>
                      <AppText variant="label">{item.name}</AppText>
                      <AppText muted variant="caption">
                        {item.churchId === church.id
                          ? 'Home church'
                          : 'Additional church'}
                        {item.phone ? ` · ${item.phone}` : ''}
                      </AppText>
                    </View>
                  ))
                ) : (
                  <Empty
                    title="No members attached"
                    description="Use Manage members to add people to this church."
                  />
                )}
                <AppText variant="heading">Connected projects</AppText>
                {projects.length ? (
                  projects.map(project => (
                    <View
                      key={project.id}
                      style={[styles.pledge, { borderColor: colors.border }]}>
                      <AppText variant="label">{project.name}</AppText>
                      <AppText variant="caption" muted>
                        {project.ownerChurchId === church.id
                          ? 'Owned project'
                          : 'Participating church'}
                      </AppText>
                    </View>
                  ))
                ) : (
                  <AppText muted variant="caption">
                    No projects connected yet.
                  </AppText>
                )}
              </>
            )}
          </>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  input: { borderWidth: 1, minHeight: 50, paddingHorizontal: 14, fontSize: 16 },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  list: { gap: 10 },
  row: {
    minHeight: 76,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  rowBody: { flex: 1, minWidth: 0, gap: 3 },
  rowEnd: { alignItems: 'flex-end', flexDirection: 'row', gap: 8 },
  chevron: { fontSize: 24 },
  empty: { borderWidth: 1, borderStyle: 'dashed', padding: 20, gap: 6 },
  choice: {
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailIntro: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, padding: 14, gap: 5 },
  metricLabel: { letterSpacing: 0.7, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  pledge: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    gap: 4,
  },
});
