import { allocateData } from './derived'
import {
  balanceForPledge,
  ContributionsData,
  totalContributions,
} from './model'

const data: ContributionsData = {
  churches: [{ id: 'c', name: 'Church', location: '' }],
  members: [{ id: 'm', name: 'Member', phone: '', churchId: 'c' }],
  projects: [
    { id: 'x', name: 'X', description: '', targetAmount: 0, churchIds: [] },
    { id: 'y', name: 'Y', description: '', targetAmount: 0, churchIds: [] },
  ],
  pledges: [
    {
      id: 'a',
      memberId: 'm',
      projectId: 'x',
      amount: 1000,
      frequency: 'daily',
      startDate: '2026-06-01',
    },
    {
      id: 'b',
      memberId: 'm',
      projectId: 'y',
      amount: 20000,
      frequency: 'monthly',
      startDate: '2026-06-01',
    },
  ],
  contributions: [
    {
      id: 'p',
      memberId: 'm',
      churchId: 'c',
      amount: 21000,
      paidAt: '2026-06-02',
    },
  ],
}

test('unrestricted payments are allocated once across projects and attributed to the original church', () => {
  const result = allocateData(data, '2026-06-02')
  expect(totalContributions(result.contributions, { projectId: 'x' })).toBe(
    1000,
  )
  expect(totalContributions(result.contributions, { projectId: 'y' })).toBe(
    20000,
  )
  expect(totalContributions(result.contributions, { churchId: 'c' })).toBe(
    21000,
  )
  expect(
    balanceForPledge(result.pledges[0], result.contributions),
  ).toMatchObject({ debt: 0, dueNow: 1000 })
})

test('void rebuilds the balances and removes money from every report', () => {
  const result = allocateData(
    {
      ...data,
      contributions: data.contributions.map(item => ({
        ...item,
        voidedAt: '2026-06-03T00:00:00Z',
        voidReason: 'Correction',
      })),
    },
    '2026-06-02',
  )
  expect(totalContributions(result.contributions)).toBe(0)
  expect(totalContributions(result.contributions, { projectId: 'y' })).toBe(0)
  expect(
    balanceForPledge(result.pledges[0], result.contributions),
  ).toMatchObject({ debt: 1000, dueNow: 1000 })
  expect(result.contributions[0].allocations).toEqual([])
})

test('a member moving church does not change earlier payment attribution', () => {
  const result = allocateData(
    { ...data, members: [{ ...data.members[0], churchId: 'new' }] },
    '2026-06-02',
  )
  expect(totalContributions(result.contributions, { churchId: 'c' })).toBe(
    21000,
  )
  expect(totalContributions(result.contributions, { churchId: 'new' })).toBe(0)
})
