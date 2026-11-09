import { balanceForPledge, totalContributions } from './model'
import type { Contribution, Pledge } from './model'

const pledge: Pledge = {
  id: 'pledge-1',
  memberId: 'member-1',
  projectId: 'project-1',
  amount: 1000,
  frequency: 'daily',
  startDate: '2026-11-01',
}
const payment: Contribution = {
  id: 'payment-1',
  pledgeId: 'pledge-1',
  memberId: 'member-1',
  projectId: 'project-1',
  churchId: 'church-1',
  amount: 15000,
  paidAt: '2026-11-10',
}

test('payments clear arrears and provide credit for future installments', () => {
  expect(balanceForPledge(pledge, [], new Date(2026, 10, 10))).toMatchObject({
    due: 10000,
    debt: 9000,
    dueNow: 1000,
    advance: 0,
  })
  expect(
    balanceForPledge(pledge, [payment], new Date(2026, 10, 10)),
  ).toMatchObject({ due: 10000, paid: 15000, debt: 0, advance: 5000 })
  expect(
    balanceForPledge(pledge, [payment], new Date(2026, 10, 15)),
  ).toMatchObject({ debt: 0, advance: 0 })
  expect(
    balanceForPledge(pledge, [payment], new Date(2026, 10, 16)),
  ).toMatchObject({ debt: 0, dueNow: 1000, advance: 0 })
})

test('future payments do not affect an earlier balance and totals filter by church and period', () => {
  expect(balanceForPledge(pledge, [payment], new Date(2026, 10, 9)).paid).toBe(
    0,
  )
  expect(
    totalContributions([payment], {
      churchId: 'church-1',
      period: 'monthly',
      date: new Date(2026, 10, 2),
    }),
  ).toBe(15000)
  expect(totalContributions([payment], { churchId: 'church-2' })).toBe(0)
})
