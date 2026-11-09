import {
  AllocationInput,
  AllocationPayment,
  AllocationPledge,
  rebuildAllocations,
} from './allocation'

const daily: AllocationPledge = {
  id: 'a',
  memberId: 'm',
  projectId: 'x',
  frequency: 'daily',
  amount: 1000,
  startDate: '2026-06-01',
}
const payment = (
  amount: number,
  paidAt = '2026-06-11',
  rest: Partial<AllocationPayment> = {},
): AllocationPayment => ({ id: 'pay', memberId: 'm', amount, paidAt, ...rest })
const run = (changes: Partial<AllocationInput> = {}) =>
  rebuildAllocations({
    memberId: 'm',
    pledges: [daily],
    payments: [],
    asOf: '2026-06-11',
    ...changes,
  })

test('debt, current amount and future credit are distinct', () => {
  expect(run().totals).toMatchObject({ debt: 10000, dueNow: 1000, advance: 0 })
  const paid = run({ payments: [payment(15000)] })
  // Today is paid before future days, as required by oldest-first allocation.
  expect(paid.totals).toMatchObject({ debt: 0, dueNow: 0, advance: 4000 })
  expect(
    paid.periods.filter(p => p.status === 'advance' && p.paid),
  ).toHaveLength(4)
})
test('partial payment fills oldest periods first', () => {
  const result = run({ payments: [payment(4000)] })
  expect(result.totals).toMatchObject({ debt: 6000, dueNow: 1000, advance: 0 })
  expect(result.allocations.map(a => a.periodStart)).toEqual([
    '2026-06-01',
    '2026-06-02',
    '2026-06-03',
    '2026-06-04',
  ])
  expect(run({ payments: [payment(500)] }).periods[0]).toMatchObject({
    paid: 500,
    remaining: 500,
  })
})
test('weekly periods are Monday to Sunday and amount after current week is advance', () => {
  const weekly = { ...daily, frequency: 'weekly' as const, amount: 5000 }
  const result = run({
    pledges: [weekly],
    asOf: '2026-06-22',
    payments: [payment(20000, '2026-06-22')],
  })
  expect(result.totals).toMatchObject({ debt: 0, dueNow: 0, advance: 0 })
  expect(result.periods.map(p => [p.periodStart, p.periodEnd])).toEqual([
    ['2026-06-01', '2026-06-07'],
    ['2026-06-08', '2026-06-14'],
    ['2026-06-15', '2026-06-21'],
    ['2026-06-22', '2026-06-28'],
  ])
})
test('unscoped payments use oldest period and scoped payments remain in their project', () => {
  const monthly = {
    ...daily,
    id: 'b',
    projectId: 'y',
    frequency: 'monthly' as const,
    amount: 20000,
  }
  const result = run({ pledges: [monthly, daily], payments: [payment(22000)] })
  expect(result.allocations.slice(0, 3)).toEqual([
    {
      paymentId: 'pay',
      pledgeId: 'a',
      periodStart: '2026-06-01',
      amount: 1000,
    },
    {
      paymentId: 'pay',
      pledgeId: 'b',
      periodStart: '2026-06-01',
      amount: 20000,
    },
    {
      paymentId: 'pay',
      pledgeId: 'a',
      periodStart: '2026-06-02',
      amount: 1000,
    },
  ])
  const scoped = run({
    pledges: [daily, monthly],
    payments: [payment(2000, '2026-06-11', { projectId: 'y' })],
  })
  expect(scoped.allocations.every(a => a.pledgeId === 'b')).toBe(true)
})
test('void and backdated payments rebuild deterministically', () => {
  const first = payment(15000, '2026-06-11')
  expect(run({ payments: [{ ...first, voided: true }] }).totals).toMatchObject({
    debt: 10000,
    dueNow: 1000,
    advance: 0,
  })
  const later = payment(2000, '2026-06-11', { id: 'later' })
  const earlier = payment(1000, '2026-06-03', { id: 'earlier' })
  const a = run({ payments: [later, earlier] })
  const b = run({ payments: [earlier, later] })
  expect(a).toEqual(b)
  expect(a.allocations[0]).toMatchObject({
    paymentId: 'earlier',
    periodStart: '2026-06-01',
  })
})
test('finite pledge leaves excess unallocated, including first and last day payments', () => {
  const finite = { ...daily, endDate: '2026-06-03' }
  const result = run({
    pledges: [finite],
    payments: [payment(8000, '2026-06-03')],
  })
  expect(result.totals).toMatchObject({
    debt: 0,
    dueNow: 0,
    advance: 0,
    unallocated: 5000,
  })
  expect(
    run({
      pledges: [finite],
      asOf: '2026-06-01',
      payments: [payment(1000, '2026-06-01')],
    }).totals,
  ).toMatchObject({ debt: 0, dueNow: 0 })
})
test('calendar months handle different month lengths and pauses suppress intersecting periods', () => {
  const monthly = {
    ...daily,
    frequency: 'monthly' as const,
    startDate: '2026-01-31',
    pauses: [{ startDate: '2026-02-01', endDate: '2026-02-28' }],
  }
  const result = run({ pledges: [monthly], asOf: '2026-05-01' })
  expect(result.periods.map(p => p.periodEnd)).toEqual([
    '2026-01-31',
    '2026-03-31',
    '2026-04-30',
    '2026-05-31',
  ])
  expect(result.totals).toMatchObject({ debt: 3000, dueNow: 1000 })
})
test('start basis marks previous period starts overdue', () => {
  const weekly = { ...daily, frequency: 'weekly' as const }
  expect(
    run({ pledges: [weekly], asOf: '2026-06-02', dueBasis: 'start' }).totals,
  ).toMatchObject({ debt: 1000, dueNow: 0 })
})

test('extreme advance fails with a bounded, explicit error', () => {
  expect(() => run({ payments: [payment(1000000000)] })).toThrow(
    'Allocation exceeds the supported number of periods',
  )
})

test('an amount change mid-month preserves the existing period amount', () => {
  const first: AllocationPledge = {
    ...daily,
    frequency: 'monthly',
    amount: 1000,
    endDate: '2026-06-14',
  }
  const revised: AllocationPledge = {
    ...first,
    id: 'b',
    amount: 2000,
    startDate: '2026-06-15',
    endDate: undefined,
  }
  const result = run({ pledges: [first, revised], asOf: '2026-07-01' })
  expect(
    result.periods.map(p => [p.pledgeId, p.periodStart, p.amount]),
  ).toEqual([
    ['a', '2026-06-01', 1000],
    ['b', '2026-07-01', 2000],
  ])
})
