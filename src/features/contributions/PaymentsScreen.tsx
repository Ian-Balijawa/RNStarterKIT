import React, { useMemo, useState } from 'react'
import { Animated, ScrollView, StyleSheet, View } from 'react-native'
import { AppScreen } from '../../components/layout/AppScreen'
import { AppBottomSheet } from '../../components/overlays/AppBottomSheet'
import { SheetField } from '../../components/forms/SheetField'
import { AppButton } from '../../components/ui/AppButton'
import { AppCard } from '../../components/ui/AppCard'
import { AppChip } from '../../components/ui/AppChip'
import { AppText } from '../../components/ui/AppText'
import { useAppTheme } from '../../theme/theme'
import { formatUGX, inPeriod } from './model'
import type { Contribution, ContributionsData } from './model'

type Props = {
  data: ContributionsData
  onAddContribution: () => void
  onReports: () => void
  onVoid: (paymentId: string, reason: string) => void
}
type StatusFilter = 'active' | 'voided' | 'all'
type DateFilter = 'all' | 'weekly' | 'monthly'

/** Payment history keeps voided entries visible for audit and correction. */
export function PaymentsScreen({
  data,
  onAddContribution,
  onReports,
  onVoid,
}: Props) {
  const { colors, radius } = useAppTheme()
  const [status, setStatus] = useState<StatusFilter>('active')
  const [period, setPeriod] = useState<DateFilter>('all')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [voiding, setVoiding] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const selected = data.contributions.find(item => item.id === selectedId)
  const memberName = (item: Contribution) =>
    data.members.find(member => member.id === item.memberId)?.name ?? 'Member'
  const projectName = (item: Contribution) =>
    data.projects.find(project => project.id === item.projectId)?.name ??
    (item.projectId ? 'Project' : 'Across projects')
  const filtered = useMemo(
    () =>
      data.contributions
        .filter(item => {
          if (status === 'active' && item.voidedAt) return false
          if (status === 'voided' && !item.voidedAt) return false
          if (period !== 'all' && !inPeriod(item.paidAt, period)) return false
          if (
            projectId &&
            item.projectId !== projectId &&
            !item.allocations?.some(
              allocation => allocation.projectId === projectId,
            )
          )
            return false
          return true
        })
        .slice()
        .sort(
          (a, b) =>
            b.paidAt.localeCompare(a.paidAt) || b.id.localeCompare(a.id),
        ),
    [data.contributions, status, period, projectId],
  )
  const close = () => {
    setSelectedId(null)
    setVoiding(false)
    setReason('')
    setError('')
  }
  const confirmVoid = () => {
    const trimmed = reason.trim()
    if (!trimmed) {
      setError('Enter a reason to void this payment.')
      return
    }
    if (selected && !selected.voidedAt) {
      onVoid(selected.id, trimmed)
      setVoiding(false)
      setReason('')
      setError('')
    }
  }
  const header = (expandedHeader: React.ReactNode) => (
    <View style={styles.header}>
      {expandedHeader}
      <AppButton title="Period reports" variant="outline" onPress={onReports} />
      <View style={styles.filterGroup}>
        <AppText variant="label">Status</AppText>
        <View style={styles.chips}>
          {(
            [
              { key: 'active', label: 'Recorded' },
              { key: 'voided', label: 'Voided' },
              { key: 'all', label: 'All' },
            ] as const
          ).map(option => (
            <AppChip
              key={option.key}
              label={option.label}
              selected={status === option.key}
              onPress={() => setStatus(option.key)}
            />
          ))}
        </View>
      </View>
      <View style={styles.filterGroup}>
        <AppText variant="label">Date received</AppText>
        <View style={styles.chips}>
          {(
            [
              { key: 'all', label: 'All time' },
              { key: 'weekly', label: 'This week' },
              { key: 'monthly', label: 'This month' },
            ] as const
          ).map(option => (
            <AppChip
              key={option.key}
              label={option.label}
              selected={period === option.key}
              onPress={() => setPeriod(option.key)}
            />
          ))}
        </View>
      </View>
      {data.projects.length ? (
        <View style={styles.filterGroup}>
          <AppText variant="label">Project</AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            <AppChip
              label="All projects"
              selected={!projectId}
              onPress={() => setProjectId(null)}
            />
            {data.projects.map(project => (
              <AppChip
                key={project.id}
                label={project.name}
                selected={projectId === project.id}
                onPress={() => setProjectId(project.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
      <View style={styles.listHeading}>
        <AppText variant="heading">History</AppText>
        <AppText variant="caption" muted>
          {filtered.length} {filtered.length === 1 ? 'payment' : 'payments'}
        </AppText>
      </View>
    </View>
  )
  return (
    <>
      <AppScreen
        title="Payments"
        eyebrow="GIVING HISTORY"
        subtitle="Review gifts and correct mistakes with a void."
        headerAction={
          <AppButton
            title="Record"
            icon="plus"
            accessibilityLabel="Record payment"
            onPress={onAddContribution}
          />
        }
        renderScrollable={(onScroll, expandedHeader, minimumContentHeight) => (
          <Animated.FlatList
            data={filtered}
            keyExtractor={item => item.id}
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
                <AppText variant="label">No payments found</AppText>
                <AppText variant="caption" muted>
                  Record a payment or change the filters to see more history.
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
                  <AppText variant="label">{memberName(item)}</AppText>
                  <AppText variant="caption" muted>
                    {projectName(item)} · {item.paidAt.slice(0, 10)}
                  </AppText>
                  {item.voidedAt ? (
                    <AppText variant="caption" style={{ color: colors.danger }}>
                      Voided
                    </AppText>
                  ) : null}
                </View>
                <View style={styles.paymentEnd}>
                  <AppText variant="label">{formatUGX(item.amount)}</AppText>
                  <AppButton
                    title="Details"
                    variant="ghost"
                    onPress={() => setSelectedId(item.id)}
                  />
                </View>
              </View>
            )}
          />
        )}
      />
      <AppBottomSheet
        visible={!!selected}
        onDismiss={close}
        title={voiding ? 'Void payment' : 'Payment details'}
        scrollable
        snapPoints={['70%', '90%']}
        footer={
          voiding ? (
            <AppButton
              title="Confirm void"
              variant="danger"
              onPress={confirmVoid}
            />
          ) : undefined
        }>
        {selected ? (
          <>
            <AppText variant="display">{formatUGX(selected.amount)}</AppText>
            <AppText muted>
              {selected.voidedAt ? 'Voided payment' : 'Recorded payment'}
            </AppText>
            <Detail label="Member" value={memberName(selected)} />
            <Detail label="Project" value={projectName(selected)} />
            <Detail
              label="Date received"
              value={selected.paidAt.slice(0, 10)}
            />
            <Detail
              label="Method"
              value={
                selected.method
                  ? selected.method.replace(/_/g, ' ')
                  : 'Not recorded'
              }
            />
            {selected.reference ? (
              <Detail label="Reference" value={selected.reference} />
            ) : null}
            {selected.note ? (
              <Detail label="Note" value={selected.note} />
            ) : null}
            {selected.allocations?.length ? (
              <View style={styles.allocations}>
                <AppText variant="label">Allocation breakdown</AppText>
                {selected.allocations.map((allocation, index) => (
                  <View
                    key={`${allocation.pledgeId}-${allocation.periodStart}-${index}`}
                    style={styles.allocationRow}>
                    <View style={styles.paymentInfo}>
                      <AppText variant="label">
                        {data.projects.find(
                          project => project.id === allocation.projectId,
                        )?.name ?? 'Project'}
                      </AppText>
                      <AppText variant="caption" muted>
                        Period starting {allocation.periodStart}
                      </AppText>
                    </View>
                    <AppText variant="label">
                      {formatUGX(allocation.amount)}
                    </AppText>
                  </View>
                ))}
                {selected.amount >
                selected.allocations.reduce(
                  (sum, allocation) => sum + allocation.amount,
                  0,
                ) ? (
                  <Detail
                    label="Unallocated credit"
                    value={formatUGX(
                      selected.amount -
                        selected.allocations.reduce(
                          (sum, allocation) => sum + allocation.amount,
                          0,
                        ),
                    )}
                  />
                ) : null}
              </View>
            ) : !selected.voidedAt && selected.allocations ? (
              <Detail
                label="Unallocated credit"
                value={formatUGX(selected.amount)}
              />
            ) : null}
            {selected.voidedAt ? (
              <>
                <Detail
                  label="Voided at"
                  value={selected.voidedAt.slice(0, 10)}
                />
                <Detail
                  label="Reason"
                  value={selected.voidReason || 'Not provided'}
                />
              </>
            ) : null}
            {voiding ? (
              <>
                <AppText muted>
                  Voiding removes this payment from totals and pledge balances.
                  The original record stays in history.
                </AppText>
                <SheetField
                  label="Reason for voiding"
                  value={reason}
                  onChangeText={value => {
                    setReason(value)
                    setError('')
                  }}
                  placeholder="Explain what needs correcting"
                  multiline
                />
                {error ? (
                  <AppText variant="caption" style={{ color: colors.danger }}>
                    {error}
                  </AppText>
                ) : null}
                <AppButton
                  title="Keep payment"
                  variant="ghost"
                  onPress={() => {
                    setVoiding(false)
                    setError('')
                  }}
                />
              </>
            ) : !selected.voidedAt ? (
              <AppButton
                title="Void payment"
                variant="danger"
                onPress={() => setVoiding(true)}
              />
            ) : null}
          </>
        ) : null}
      </AppBottomSheet>
    </>
  )
}

function Separator() {
  return <View style={styles.separator} />
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  )
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
  header: { gap: 8, marginBottom: 16 },
  eyebrow: { letterSpacing: 1.2, fontWeight: '700' },
  headerButton: { alignSelf: 'flex-start', marginTop: 8 },
  filterGroup: { gap: 8, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
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
  paymentEnd: { alignItems: 'flex-end' },
  detail: { gap: 3 },
  allocations: { gap: 12 },
  allocationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
})
