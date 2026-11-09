import { rebuildAllocations } from './allocation'

/** Local records for church projects and their pledges. Amounts are whole UGX. */
export type Frequency = 'daily' | 'weekly' | 'monthly'
export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type Church = {
  id: string
  name: string
  location: string
  contact?: string
  status?: 'active' | 'inactive'
}

export type Member = {
  id: string
  name: string
  phone: string
  churchId?: string
  churchIds?: string[]
  email?: string
  gender?: 'female' | 'male' | 'other'
  joinedAt?: string
  status?: 'active' | 'inactive'
}

export type Project = {
  id: string
  name: string
  description: string
  targetAmount: number
  churchIds: string[]
  ownerChurchId?: string
  memberIds?: string[]
  startDate?: string
  endDate?: string
  status?: 'draft' | 'active' | 'completed' | 'cancelled'
}

export type Pledge = {
  id: string
  memberId: string
  projectId: string
  amount: number
  frequency: Frequency
  /** First due date. A date-only YYYY-MM-DD value avoids timezone shifts. */
  startDate: string
  endDate?: string
  pauses?: { startDate: string; endDate?: string }[]
  status?: 'active' | 'paused' | 'cancelled' | 'completed'
  /** Derived from project status; not a replacement for the pledge's own end date. */
  effectiveEndDate?: string
  calculatedBalance?: PledgeBalance
}

export type Contribution = {
  id: string
  pledgeId?: string
  memberId: string
  projectId?: string
  method?: 'cash' | 'mobile money' | 'bank' | 'other'
  reference?: string
  note?: string
  voidedAt?: string
  voidReason?: string
  allocations?: {
    pledgeId: string
    projectId: string
    periodStart: string
    amount: number
  }[]
  /** Church at the time of payment, so historic church totals stay accurate. */
  churchId?: string
  amount: number
  paidAt: string
}

export type ContributionsData = {
  churches: Church[]
  members: Member[]
  projects: Project[]
  pledges: Pledge[]
  contributions: Contribution[]
}

export const EMPTY_DATA: ContributionsData = {
  churches: [],
  members: [],
  projects: [],
  pledges: [],
  contributions: [],
}

/** Resolve a project's closing date without changing the saved pledge version. */
export function allocationPledges(
  data: ContributionsData,
  memberId: string,
): Pledge[] {
  return data.pledges
    .filter(item => item.memberId === memberId)
    .map(item => {
      const project = data.projects.find(
        candidate => candidate.id === item.projectId,
      )
      const projectEnd =
        project &&
        (project.status === 'completed' || project.status === 'cancelled')
          ? project.endDate
          : undefined
      const endDate =
        projectEnd && (!item.endDate || projectEnd < item.endDate)
          ? projectEnd
          : item.endDate
      return { ...item, effectiveEndDate: endDate }
    })
    .filter(
      item => !item.effectiveEndDate || item.effectiveEndDate >= item.startDate,
    )
}

export const newId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

// Kampala observes UTC+03:00 throughout the year.
export function kampalaDate(now = new Date()): string {
  return new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function formatUGX(amount: number) {
  return `UGX ${Math.round(amount).toLocaleString('en-UG')}`
}

export function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[\s,]/g, '')
  if (!/^\d+$/.test(cleaned)) return null
  const amount = Number(cleaned)
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null
}

/** Interpret date-only strings as local calendar dates rather than UTC midnight. */
function calendarDate(value: string | Date): Date {
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (match)
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  const date = value instanceof Date ? value : new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export type PledgeBalance = {
  periodsDue: number
  due: number
  paid: number
  debt: number
  dueNow: number
  advance: number
}

/** Uses the allocations calculated for the whole member, not payment totals alone. */
export function balanceForPledge(
  pledge: Pledge,
  contributions: Contribution[],
  asOf?: Date,
): PledgeBalance {
  if (!asOf && pledge.calculatedBalance) return pledge.calculatedBalance
  if (pledge.effectiveEndDate && pledge.effectiveEndDate < pledge.startDate)
    return { periodsDue: 0, due: 0, paid: 0, debt: 0, dueNow: 0, advance: 0 }
  const payments = contributions
    .filter(item => !item.voidedAt)
    .flatMap(item => {
      const amount = item.allocations
        ? item.allocations
            .filter(allocation => allocation.pledgeId === pledge.id)
            .reduce((sum, allocation) => sum + allocation.amount, 0)
        : item.pledgeId === pledge.id
        ? item.amount
        : 0
      return amount
        ? [
            {
              id: item.id,
              memberId: item.memberId,
              pledgeId: pledge.id,
              amount,
              paidAt: item.paidAt,
            },
          ]
        : []
    })
  const result = rebuildAllocations({
    memberId: pledge.memberId,
    pledges: [
      { ...pledge, endDate: pledge.effectiveEndDate ?? pledge.endDate },
    ],
    payments,
    asOf: kampalaDate(asOf ?? new Date()),
  })
  const periodsDue = result.periods.filter(
    period => period.status !== 'advance',
  ).length
  return {
    periodsDue,
    due: periodsDue * pledge.amount,
    paid: result.totals.paid,
    debt: result.totals.debt,
    dueNow: result.totals.dueNow,
    advance: result.totals.advance,
  }
}

export function periodStart(period: Period, date: Date): Date {
  const start = calendarDate(date)
  if (period === 'weekly')
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  if (period === 'monthly') start.setDate(1)
  if (period === 'yearly') start.setMonth(0, 1)
  return start
}

export function inPeriod(value: string, period: Period, date?: Date): boolean {
  const start = periodStart(period, date ?? calendarDate(kampalaDate()))
  const end = new Date(start)
  if (period === 'daily') end.setDate(end.getDate() + 1)
  if (period === 'weekly') end.setDate(end.getDate() + 7)
  if (period === 'monthly') end.setMonth(end.getMonth() + 1)
  if (period === 'yearly') end.setFullYear(end.getFullYear() + 1)
  const day = calendarDate(value).getTime()
  return day >= start.getTime() && day < end.getTime()
}

export type ContributionFilters = {
  memberId?: string
  projectId?: string
  churchId?: string
  pledgeId?: string
  period?: Period
  date?: Date
}

export function totalContributions(
  contributions: Contribution[],
  filters: ContributionFilters = {},
): number {
  return contributions.reduce((total, item) => {
    if (item.voidedAt) return total
    if (filters.memberId && item.memberId !== filters.memberId) return total
    if (
      filters.projectId &&
      item.projectId !== filters.projectId &&
      !item.allocations?.some(
        allocation => allocation.projectId === filters.projectId,
      )
    )
      return total
    if (filters.churchId && item.churchId !== filters.churchId) return total
    if (filters.pledgeId && item.pledgeId !== filters.pledgeId) return total
    if (filters.period && !inPeriod(item.paidAt, filters.period, filters.date))
      return total
    if (filters.projectId && !item.projectId)
      return (
        total +
        (item.allocations ?? [])
          .filter(allocation => allocation.projectId === filters.projectId)
          .reduce((sum, allocation) => sum + allocation.amount, 0)
      )
    return total + item.amount
  }, 0)
}
