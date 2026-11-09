/** Deterministic, database-free allocation using plain calendar dates and integer UGX. */
export type AllocationFrequency = 'daily' | 'weekly' | 'monthly'
export type AllocationPledge = {
  id: string
  memberId: string
  projectId: string
  amount: number
  frequency: AllocationFrequency
  startDate: string
  endDate?: string
  /** A pause touching a period suppresses that whole period. */
  pauses?: { startDate: string; endDate?: string }[]
}
export type AllocationPayment = {
  id: string
  memberId: string
  projectId?: string
  /** Compatibility with payments already restricted to a particular pledge. */
  pledgeId?: string
  amount: number
  paidAt: string
  voided?: boolean
}
export type AllocatedPeriod = {
  pledgeId: string
  projectId: string
  periodStart: string
  periodEnd: string
  amount: number
  paid: number
  remaining: number
  status: 'overdue' | 'dueNow' | 'advance'
}
export type Allocation = {
  paymentId: string
  pledgeId: string
  periodStart: string
  amount: number
}
export type AllocationResult = {
  periods: AllocatedPeriod[]
  allocations: Allocation[]
  unallocated: { paymentId: string; amount: number }[]
  totals: {
    debt: number
    dueNow: number
    advance: number
    unallocated: number
    paid: number
  }
}
export type AllocationInput = {
  memberId: string
  pledges: AllocationPledge[]
  payments: AllocationPayment[]
  asOf: string
  dueBasis?: 'start' | 'end'
}

const DAY = 86400000
function parse(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error(`Invalid date: ${value}`)
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    throw new Error(`Invalid date: ${value}`)
  return date
}
function dateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}
function addDays(value: string, days: number): string {
  return dateString(new Date(parse(value).getTime() + days * DAY))
}
function startOfPeriod(value: string, frequency: AllocationFrequency): string {
  const d = parse(value)
  if (frequency === 'monthly') return `${value.slice(0, 7)}-01`
  if (frequency === 'weekly') return addDays(value, -((d.getUTCDay() + 6) % 7))
  return value
}
function nextPeriod(value: string, frequency: AllocationFrequency): string {
  if (frequency === 'daily') return addDays(value, 1)
  if (frequency === 'weekly') return addDays(value, 7)
  const d = parse(value)
  return dateString(
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)),
  )
}
function positiveAmount(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error('Amounts must be positive whole UGX')
}
function compareText(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0
}
type Series = {
  pledge: AllocationPledge
  next: string | null
  periods: AllocatedPeriod[]
  cursor: number
}

/** Bound materialization to protect the mobile UI from pathological input. */
export const MAX_ALLOCATION_PERIODS = 10000

export function rebuildAllocations({
  memberId,
  pledges,
  payments,
  asOf,
  dueBasis = 'end',
}: AllocationInput): AllocationResult {
  parse(asOf)
  const series: Series[] = pledges
    .filter(p => p.memberId === memberId)
    .map(pledge => {
      parse(pledge.startDate)
      if (pledge.endDate) {
        parse(pledge.endDate)
        if (pledge.endDate < pledge.startDate)
          throw new Error('Pledge end precedes start')
      }
      positiveAmount(pledge.amount)
      pledge.pauses?.forEach(pause => {
        parse(pause.startDate)
        if (pause.endDate) {
          parse(pause.endDate)
          if (pause.endDate < pause.startDate)
            throw new Error('Pause end precedes start')
        }
      })
      return {
        pledge,
        next: startOfPeriod(pledge.startDate, pledge.frequency),
        periods: [],
        cursor: 0,
      }
    })
  let generated = 0
  const makeNext = (s: Series): AllocatedPeriod | null => {
    while (s.next) {
      const start = s.next
      if (s.pledge.endDate && start > s.pledge.endDate) {
        s.next = null
        return null
      }
      const next = nextPeriod(start, s.pledge.frequency)
      const end = addDays(next, -1)
      s.next = next
      const pause = s.pledge.pauses?.find(
        p => p.startDate <= end && (!p.endDate || p.endDate >= start),
      )
      if (pause) {
        if (!pause.endDate) {
          s.next = null
          return null
        }
        // Skip directly beyond a long pause, then continue at the next complete period.
        const lastPaused = startOfPeriod(pause.endDate, s.pledge.frequency)
        if (lastPaused >= start)
          s.next = nextPeriod(lastPaused, s.pledge.frequency)
        continue
      }
      // When a replacement starts within an existing calendar period, that
      // period retains the previous version's amount; the new version starts
      // charging from the following period.
      const priorVersion = series.some(
        other =>
          other !== s &&
          other.pledge.projectId === s.pledge.projectId &&
          other.pledge.startDate < s.pledge.startDate &&
          !!other.pledge.endDate &&
          other.pledge.endDate < s.pledge.startDate &&
          other.pledge.endDate >= start &&
          other.pledge.startDate <= end,
      )
      if (priorVersion) continue
      const begins = start > s.pledge.startDate ? start : s.pledge.startDate
      const status =
        begins > asOf
          ? 'advance'
          : dueBasis === 'start'
          ? begins === asOf
            ? 'dueNow'
            : 'overdue'
          : end < asOf
          ? 'overdue'
          : 'dueNow'
      if (++generated > MAX_ALLOCATION_PERIODS)
        throw new RangeError(
          'Allocation exceeds the supported number of periods',
        )
      const period: AllocatedPeriod = {
        pledgeId: s.pledge.id,
        projectId: s.pledge.projectId,
        periodStart: start,
        periodEnd: end,
        amount: s.pledge.amount,
        paid: 0,
        remaining: s.pledge.amount,
        status,
      }
      s.periods.push(period)
      return period
    }
    return null
  }
  // Include all periods through today even when there are no payments.
  for (const s of series) while (s.next && s.next <= asOf) makeNext(s)
  const allocations: Allocation[] = []
  const unallocated: { paymentId: string; amount: number }[] = []
  const ordered = payments
    .filter(p => p.memberId === memberId && !p.voided && p.paidAt <= asOf)
    .slice()
    .sort((a, b) => compareText(a.paidAt, b.paidAt) || compareText(a.id, b.id))
  for (const payment of ordered) {
    parse(payment.paidAt)
    positiveAmount(payment.amount)
    let left = payment.amount
    const eligible = series.filter(
      s =>
        (!payment.projectId || s.pledge.projectId === payment.projectId) &&
        (!payment.pledgeId || s.pledge.id === payment.pledgeId),
    )
    while (left > 0) {
      const candidates = eligible
        .map(s => {
          while (
            s.cursor < s.periods.length &&
            s.periods[s.cursor].remaining === 0
          )
            s.cursor++
          return { s, period: s.periods[s.cursor] || makeNext(s) }
        })
        .filter(
          (item): item is { s: Series; period: AllocatedPeriod } =>
            item.period !== null,
        )
      candidates.sort(
        (a, b) =>
          compareText(a.period.periodStart, b.period.periodStart) ||
          compareText(a.s.pledge.startDate, b.s.pledge.startDate) ||
          compareText(a.s.pledge.id, b.s.pledge.id),
      )
      if (!candidates.length) break
      const period = candidates[0].period
      const applied = Math.min(left, period.remaining)
      period.paid += applied
      period.remaining -= applied
      left -= applied
      allocations.push({
        paymentId: payment.id,
        pledgeId: period.pledgeId,
        periodStart: period.periodStart,
        amount: applied,
      })
    }
    if (left) unallocated.push({ paymentId: payment.id, amount: left })
  }
  const periods = series
    .flatMap(s => s.periods)
    .sort(
      (a, b) =>
        compareText(a.periodStart, b.periodStart) ||
        compareText(a.pledgeId, b.pledgeId),
    )
  return {
    periods,
    allocations,
    unallocated,
    totals: {
      debt: periods
        .filter(p => p.status === 'overdue')
        .reduce((sum, p) => sum + p.remaining, 0),
      dueNow: periods
        .filter(p => p.status === 'dueNow')
        .reduce((sum, p) => sum + p.remaining, 0),
      advance: periods
        .filter(p => p.status === 'advance')
        .reduce((sum, p) => sum + p.paid, 0),
      unallocated: unallocated.reduce((sum, item) => sum + item.amount, 0),
      paid: allocations.reduce((sum, item) => sum + item.amount, 0),
    },
  }
}
