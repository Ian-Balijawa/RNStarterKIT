import type { ApiClient } from '../../services/api/client';
import {
  loadContributions,
  previewPayment,
  saveContributionChange,
} from './api';
import { EMPTY_DATA } from './model';
import { createMutationKeys } from './mutationKeys';

test('loads all pages and preserves server balances and allocation records', async () => {
  const pages: Record<string, unknown> = {
    '/churches?page=1': {
      data: [
        { id: 'c', version: 3, name: 'Church', phone: null, status: 'active' },
      ],
      meta: { page: 1, totalPages: 1 },
    },
    '/members?page=1': {
      data: [
        {
          id: 'm',
          version: 2,
          name: 'Member',
          phone: '+256700000000',
          homeChurchId: 'c',
          churchIds: ['c'],
          status: 'active',
          totalGiven: 20,
          debt: 7,
          dueToday: 2,
          advance: 3,
          unallocatedCredit: 4,
        },
      ],
      meta: { page: 1, totalPages: 2 },
    },
    '/members?page=2': {
      data: [
        {
          id: 'm2',
          version: 1,
          name: 'Other',
          phone: '+256700000001',
          homeChurchId: 'c',
          churchIds: ['c'],
          status: 'active',
          totalGiven: 0,
          debt: 0,
          dueToday: 0,
          advance: 0,
          unallocatedCredit: 0,
        },
      ],
      meta: { page: 2, totalPages: 2 },
    },
    '/projects?page=1': {
      data: [
        {
          id: 'pr',
          version: 4,
          name: 'Project',
          description: null,
          ownerChurchId: 'c',
          target: 100,
          startDate: '2026-01-01',
          endDate: null,
          churchIds: ['c'],
          status: 'active',
          collected: 20,
          debt: 7,
          dueToday: 2,
          advance: 3,
          memberCount: 1,
          targetProgressBasisPoints: 2000,
        },
      ],
      meta: { page: 1, totalPages: 1 },
    },
    '/pledges?page=1': {
      data: [
        {
          id: 'pl',
          version: 1,
          memberId: 'm',
          projectId: 'pr',
          amount: 10,
          frequency: 'monthly',
          startDate: '2026-01-01',
          endDate: null,
          status: 'active',
          demand: 30,
          paid: 20,
          debt: 7,
          dueToday: 2,
          advance: 3,
        },
      ],
      meta: { page: 1, totalPages: 1 },
    },
    '/payments?page=1': {
      data: [
        {
          id: 'pay',
          version: 5,
          memberId: 'm',
          projectId: null,
          amount: 20,
          date: '2026-02-01',
          method: 'mobile_money',
          note: null,
          voidedAt: null,
          voidReason: null,
          allocations: [
            { pledgeId: 'pl', periodStart: '2026-01-01', amount: 10 },
          ],
        },
      ],
      meta: { page: 1, totalPages: 1 },
    },
  };
  const request = jest.fn(async (path: string) => pages[path]);
  const data = await loadContributions({ request } as ApiClient);
  expect(request).toHaveBeenCalledWith('/members?page=2');
  expect(data.members).toHaveLength(2);
  expect(data.churches[0].version).toBe(3);
  expect(data.members[0].version).toBe(2);
  expect(data.projects[0].version).toBe(4);
  expect(data.contributions[0].version).toBe(5);
  expect(data.members[0].summary?.unallocatedCredit).toBe(4);
  expect(data.projects[0].summary?.collected).toBe(20);
  expect(data.pledges[0].calculatedBalance).toMatchObject({
    paid: 20,
    debt: 7,
    dueNow: 2,
    advance: 3,
  });
  expect(data.contributions[0]).toMatchObject({
    method: 'mobile money',
    allocations: [{ pledgeId: 'pl', projectId: 'pr', amount: 10 }],
  });
  expect(data.contributions[0].churchId).toBeUndefined();
});

test('sends the contract payment body and rejects unsupported changes', async () => {
  const request = jest.fn(async () => ({}));
  const api = { request } as ApiClient;
  const payment = {
    id: 'id',
    memberId: 'member',
    amount: 4000,
    paidAt: '2026-11-11',
    method: 'mobile money' as const,
    note: 'Gift',
  };
  await saveContributionChange(
    api,
    EMPTY_DATA,
    {
      ...EMPTY_DATA,
      contributions: [payment],
    },
    createMutationKeys(() => 'key'),
  );
  expect(request).toHaveBeenCalledWith('/payments', {
    method: 'POST',
    headers: { 'idempotency-key': 'key' },
    body: JSON.stringify({
      id: 'id',
      memberId: 'member',
      projectId: null,
      amount: 4000,
      date: '2026-11-11',
      method: 'mobile_money',
      note: 'Gift',
    }),
  });
  await expect(
    saveContributionChange(
      api,
      EMPTY_DATA,
      {
        ...EMPTY_DATA,
        contributions: [{ ...payment, reference: 'unsupported' }],
      },
      createMutationKeys(() => 'key'),
    ),
  ).rejects.toThrow('not supported');
  expect(request).toHaveBeenCalledTimes(1);
});

test('uses the server preview and does not modify the ledger', async () => {
  const result = {
    before: {},
    after: {},
    allocations: [],
    unallocatedCredit: 0,
    asOf: '2026-11-11',
    ledgerVersion: 1,
  };
  const request = jest.fn(async () => ({ data: result }));
  const input = {
    id: 'id',
    memberId: 'member',
    amount: 100,
    date: '2026-11-11',
  };
  await expect(
    previewPayment({ request } as ApiClient, input),
  ).resolves.toEqual(result);
  expect(request).toHaveBeenCalledWith('/payments/preview', {
    method: 'POST',
    body: JSON.stringify(input),
  });
});

test('rejects a server that ignores the requested page', async () => {
  const request = jest.fn(async (path: string) => ({
    data: [{ id: path }],
    meta: { page: 1, totalPages: path.startsWith('/members') ? 2 : 1 },
  }));
  await expect(loadContributions({ request } as ApiClient)).rejects.toThrow(
    'invalid page',
  );
});

test('updates, archive actions, and payment void send the current quoted version', async () => {
  const request = jest.fn(async () => ({}));
  const api = { request } as ApiClient;
  const keys = createMutationKeys(() => 'key');
  const church = {
    id: 'c',
    version: 3,
    name: 'Church',
    location: '',
    status: 'active' as const,
  };
  const member = {
    id: 'm',
    version: 4,
    name: 'Member',
    phone: '+256700000000',
    churchId: 'c',
    status: 'active' as const,
  };
  const project = {
    id: 'pr',
    version: 5,
    name: 'Project',
    description: '',
    targetAmount: 100,
    churchIds: ['c'],
    status: 'active' as const,
  };
  const payment = {
    id: 'pay',
    version: 6,
    memberId: 'm',
    amount: 10,
    paidAt: '2026-01-01',
    method: 'cash' as const,
  };
  const data = {
    ...EMPTY_DATA,
    churches: [church],
    members: [member],
    projects: [project],
    contributions: [payment],
  };
  const cases = [
    {
      next: { ...data, churches: [{ ...church, name: 'New' }] },
      path: '/churches/c',
      method: 'PATCH',
      version: 3,
    },
    {
      next: { ...data, churches: [{ ...church, status: 'inactive' as const }] },
      path: '/churches/c/archive',
      method: 'POST',
      version: 3,
    },
    {
      next: { ...data, members: [{ ...member, name: 'New' }] },
      path: '/members/m',
      method: 'PATCH',
      version: 4,
    },
    {
      next: { ...data, members: [{ ...member, status: 'inactive' as const }] },
      path: '/members/m/archive',
      method: 'POST',
      version: 4,
    },
    {
      next: { ...data, projects: [{ ...project, name: 'New' }] },
      path: '/projects/pr',
      method: 'PATCH',
      version: 5,
    },
    {
      next: {
        ...data,
        projects: [{ ...project, status: 'cancelled' as const }],
      },
      path: '/projects/pr/archive',
      method: 'POST',
      version: 5,
    },
    {
      next: {
        ...data,
        contributions: [
          { ...payment, voidedAt: '2026-01-02', voidReason: 'Error' },
        ],
      },
      path: '/payments/pay/void',
      method: 'POST',
      version: 6,
    },
  ];
  for (const row of cases) {
    await saveContributionChange(api, data, row.next, keys);
    expect(request).toHaveBeenLastCalledWith(
      row.path,
      expect.objectContaining({
        method: row.method,
        headers: { 'if-match': `"${row.version}"`, 'idempotency-key': 'key' },
      }),
    );
  }
  await expect(
    saveContributionChange(
      api,
      { ...data, churches: [{ ...church, version: undefined }] },
      { ...data, churches: [{ ...church, version: undefined, name: 'New' }] },
      keys,
    ),
  ).rejects.toThrow('no valid version');
});
