import { ContributionsData, kampalaDate, allocationPledges } from './model'
import { rebuildAllocations } from './allocation'

/** Rebuild derived allocation rows whenever local records change. */
export function allocateData(
  data: ContributionsData,
  asOf = kampalaDate(),
): ContributionsData {
  const effectiveEnds = new Map<string, string>()
  const balances = new Map<string, import('./model').PledgeBalance>()
  const allocations = new Map<
    string,
    NonNullable<ContributionsData['contributions'][number]['allocations']>
  >()
  for (const member of data.members) {
    const allPledges = allocationPledges(data, member.id)
    const pledges = allPledges.map(item => ({
      ...item,
      endDate: item.effectiveEndDate,
    }))
    for (const item of allPledges)
      if (item.effectiveEndDate)
        effectiveEnds.set(item.id, item.effectiveEndDate)
    const payments = data.contributions
      .filter(item => item.memberId === member.id)
      .map(item => ({ ...item, voided: !!item.voidedAt }))
    const result = rebuildAllocations({
      memberId: member.id,
      pledges,
      payments,
      asOf,
    })
    for (const pledge of pledges) {
      const periods = result.periods.filter(
        period => period.pledgeId === pledge.id,
      )
      const duePeriods = periods.filter(period => period.status !== 'advance')
      balances.set(pledge.id, {
        periodsDue: duePeriods.length,
        due: duePeriods.reduce((sum, period) => sum + period.amount, 0),
        paid: periods.reduce((sum, period) => sum + period.paid, 0),
        debt: periods
          .filter(period => period.status === 'overdue')
          .reduce((sum, period) => sum + period.remaining, 0),
        dueNow: periods
          .filter(period => period.status === 'dueNow')
          .reduce((sum, period) => sum + period.remaining, 0),
        advance: periods
          .filter(period => period.status === 'advance')
          .reduce((sum, period) => sum + period.paid, 0),
      })
    }
    for (const item of result.allocations) {
      const projectId = pledges.find(
        pledge => pledge.id === item.pledgeId,
      )?.projectId
      if (!projectId) continue
      const rows = allocations.get(item.paymentId) ?? []
      rows.push({
        pledgeId: item.pledgeId,
        projectId,
        periodStart: item.periodStart,
        amount: item.amount,
      })
      allocations.set(item.paymentId, rows)
    }
  }
  return {
    ...data,
    projects: data.projects.map(project => ({
      ...project,
      memberIds:
        project.memberIds ??
        Array.from(
          new Set(
            data.pledges
              .filter(pledge => pledge.projectId === project.id)
              .map(pledge => pledge.memberId),
          ),
        ),
    })),
    pledges: data.pledges.map(item => {
      const project = data.projects.find(p => p.id === item.projectId)
      const projectEnd =
        project &&
        (project.status === 'completed' || project.status === 'cancelled')
          ? project.endDate
          : undefined
      return {
        ...item,
        effectiveEndDate:
          effectiveEnds.get(item.id) ?? projectEnd ?? item.endDate,
        calculatedBalance: balances.get(item.id) ?? {
          periodsDue: 0,
          due: 0,
          paid: 0,
          debt: 0,
          dueNow: 0,
          advance: 0,
        },
      }
    }),
    contributions: data.contributions.map(item => ({
      ...item,
      allocations: allocations.get(item.id) ?? [],
    })),
  }
}
