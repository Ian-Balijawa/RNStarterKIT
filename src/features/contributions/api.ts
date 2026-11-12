import type { ApiClient } from '../../services/api/client';
import type { MutationKeys } from './mutationKeys';
import type {
  ContributionsData,
  Contribution,
  Church,
  Member,
  Pledge,
  Project,
} from './model';

type Page<T> = { data: T[]; meta: { page: number; totalPages: number } };
type ChurchRecord = {
  id: string;
  version: number;
  name: string;
  phone: string | null;
  status: 'active' | 'archived';
};
type MemberRecord = {
  id: string;
  version: number;
  name: string;
  phone: string;
  homeChurchId: string;
  churchIds: string[];
  status: 'active' | 'archived';
  totalGiven: number;
  debt: number;
  dueToday: number;
  advance: number;
  unallocatedCredit: number;
};
type ProjectRecord = {
  id: string;
  version: number;
  name: string;
  description: string | null;
  ownerChurchId: string;
  target: number;
  startDate: string;
  endDate: string | null;
  churchIds: string[];
  status: 'active' | 'archived';
  collected: number;
  debt: number;
  dueToday: number;
  advance: number;
  memberCount: number;
  targetProgressBasisPoints: number | null;
};
type PledgeRecord = {
  id: string;
  version: number;
  memberId: string;
  projectId: string;
  amount: number;
  frequency: Pledge['frequency'];
  startDate: string;
  endDate: string | null;
  status: 'active' | 'paused' | 'cancelled';
  demand: number;
  paid: number;
  debt: number;
  dueToday: number;
  advance: number;
};
type PaymentRecord = {
  id: string;
  version: number;
  memberId: string;
  projectId: string | null;
  amount: number;
  date: string;
  method: 'cash' | 'mobile_money' | 'bank';
  note: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  allocations: { pledgeId: string; periodStart: string; amount: number }[];
};
export type PaymentPreview = {
  before: {
    debt: number;
    dueToday: number;
    advance: number;
    unallocatedCredit: number;
  };
  after: {
    debt: number;
    dueToday: number;
    advance: number;
    unallocatedCredit: number;
  };
  allocations: {
    pledgeId: string;
    periodStart: string;
    periodEnd: string;
    amount: number;
  }[];
  unallocatedCredit: number;
  asOf: string;
  ledgerVersion: number;
};
export type PreviewInput = {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  projectId?: string | null;
  asOf?: string;
};

async function allPages<T>(api: ApiClient, path: string): Promise<T[]> {
  const records: T[] = [];
  let page = 1;
  for (;;) {
    const result = await api.request<Page<T>>(`${path}?page=${page}`);
    if (
      !Array.isArray(result.data) ||
      !result.meta ||
      !Number.isInteger(result.meta.totalPages) ||
      result.meta.totalPages < 0 ||
      result.meta.page !== page
    )
      throw new Error(
        'The server returned an invalid page. Please retry or contact your administrator.',
      );
    if (result.data.length === 0 && page < result.meta.totalPages)
      throw new Error('The server returned an incomplete list. Please retry.');
    records.push(...result.data);
    if (page >= result.meta.totalPages) break;
    page += 1;
  }
  return records;
}

export async function loadContributions(
  api: ApiClient,
): Promise<ContributionsData> {
  const [churches, members, projects, pledges, payments] = await Promise.all([
    allPages<ChurchRecord>(api, '/churches'),
    allPages<MemberRecord>(api, '/members'),
    allPages<ProjectRecord>(api, '/projects'),
    allPages<PledgeRecord>(api, '/pledges'),
    allPages<PaymentRecord>(api, '/payments'),
  ]);
  return {
    churches: churches.map(c => ({
      id: c.id,
      version: c.version,
      name: c.name,
      location: '',
      contact: c.phone ?? '',
      status: c.status === 'archived' ? 'inactive' : 'active',
    })),
    members: members.map(m => ({
      id: m.id,
      version: m.version,
      name: m.name,
      phone: m.phone,
      churchId: m.homeChurchId,
      churchIds: m.churchIds,
      status: m.status === 'archived' ? 'inactive' : 'active',
      summary: {
        totalGiven: m.totalGiven,
        debt: m.debt,
        dueToday: m.dueToday,
        advance: m.advance,
        unallocatedCredit: m.unallocatedCredit,
      },
    })),
    projects: projects.map(p => ({
      id: p.id,
      version: p.version,
      name: p.name,
      description: p.description ?? '',
      targetAmount: p.target,
      ownerChurchId: p.ownerChurchId,
      churchIds: p.churchIds,
      memberIds: Array.from(
        new Set(
          pledges
            .filter(item => item.projectId === p.id)
            .map(item => item.memberId),
        ),
      ),
      startDate: p.startDate,
      endDate: p.endDate ?? undefined,
      status: p.status === 'archived' ? 'cancelled' : 'active',
      summary: {
        collected: p.collected,
        debt: p.debt,
        dueToday: p.dueToday,
        advance: p.advance,
        memberCount: p.memberCount,
        targetProgressBasisPoints: p.targetProgressBasisPoints,
      },
    })),
    pledges: pledges.map(p => ({
      id: p.id,
      version: p.version,
      memberId: p.memberId,
      projectId: p.projectId,
      amount: p.amount,
      frequency: p.frequency,
      startDate: p.startDate,
      endDate: p.endDate ?? undefined,
      status: p.status,
      calculatedBalance: {
        periodsDue: p.amount ? Math.floor(p.demand / p.amount) : 0,
        due: p.demand,
        paid: p.paid,
        debt: p.debt,
        dueNow: p.dueToday,
        advance: p.advance,
      },
    })),
    contributions: payments.map(p => ({
      id: p.id,
      version: p.version,
      memberId: p.memberId,
      projectId: p.projectId ?? undefined,
      amount: p.amount,
      paidAt: p.date,
      method: p.method === 'mobile_money' ? 'mobile money' : p.method,
      note: p.note ?? undefined,
      voidedAt: p.voidedAt ?? undefined,
      voidReason: p.voidReason ?? undefined,
      allocations: p.allocations.map(a => ({
        ...a,
        projectId:
          pledges.find(item => item.id === a.pledgeId)?.projectId ?? '',
      })),
    })),
  };
}

const body = (value: unknown): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(value),
});
const patch = (value: unknown): RequestInit => ({
  method: 'PATCH',
  body: JSON.stringify(value),
});
function ifMatch(init: RequestInit, record: { version?: number }): RequestInit {
  if (!Number.isSafeInteger(record.version) || (record.version ?? 0) < 1) {
    throw new Error('This record has no valid version. Reload and try again.');
  }
  return { ...init, headers: { 'If-Match': `"${record.version}"` } };
}
const unsupported = () => {
  throw new Error('This change is not supported by the backend.');
};
const changed = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);

function ensureOnlyChanged(before: object, after: object, allowed: string[]) {
  const a = before as Record<string, unknown>,
    b = after as Record<string, unknown>;
  if (
    Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).some(
      field => !allowed.includes(field) && changed(a[field], b[field]),
    )
  )
    unsupported();
}
function onlyStatus(
  before: { status?: string },
  after: { status?: string },
  fieldsChanged: boolean,
) {
  if (!changed(before.status, after.status)) return false;
  if (fieldsChanged || !['active', 'inactive'].includes(after.status ?? ''))
    unsupported();
  return true;
}

export async function saveContributionChange(
  api: ApiClient,
  current: ContributionsData,
  next: ContributionsData,
  keys: MutationKeys,
) {
  const collections = [
    'churches',
    'members',
    'projects',
    'pledges',
    'contributions',
  ] as const;
  const changes: {
    key: (typeof collections)[number];
    before?: any;
    after?: any;
  }[] = [];
  for (const key of collections) {
    const before = current[key] as { id: string }[],
      after = next[key] as { id: string }[];
    for (const item of before) {
      const replacement = after.find(row => row.id === item.id);
      if (!replacement || changed(item, replacement))
        changes.push({ key, before: item, after: replacement });
    }
    for (const item of after)
      if (!before.some(row => row.id === item.id))
        changes.push({ key, after: item });
  }
  if (!changes.length) return;
  if (changes.length !== 1 || !changes[0].after) unsupported();
  const { key, before, after } = changes[0];
  if (key === 'churches') {
    const item = after as Church;
    if (!before) {
      if (item.location || (item.status && item.status !== 'active'))
        unsupported();
      await keys.request(
        api,
        '/churches',
        body({ id: item.id, name: item.name, phone: item.contact || null }),
      );
    } else {
      ensureOnlyChanged(before, item, ['name', 'contact', 'status']);
      const fieldsChanged =
        changed(before.name, item.name) ||
        changed(before.contact, item.contact);
      if (onlyStatus(before, item, fieldsChanged))
        await keys.request(
          api,
          `/churches/${item.id}/${
            item.status === 'inactive' ? 'archive' : 'unarchive'
          }`,
          ifMatch(body({}), before),
        );
      else if (fieldsChanged)
        await keys.request(
          api,
          `/churches/${item.id}`,
          ifMatch(
            patch({ name: item.name, phone: item.contact || null }),
            before,
          ),
        );
    }
  } else if (key === 'members') {
    const item = after as Member;
    if (!before) {
      if (!item.churchId)
        throw new Error('Choose a home church for this member.');
      if (
        item.email ||
        item.gender ||
        (item.status && item.status !== 'active')
      )
        unsupported();
      await keys.request(
        api,
        '/members',
        body({
          id: item.id,
          name: item.name,
          phone: item.phone,
          homeChurchId: item.churchId,
        }),
      );
    } else {
      ensureOnlyChanged(before, item, ['name', 'phone', 'status']);
      const fieldsChanged =
        changed(before.name, item.name) || changed(before.phone, item.phone);
      if (onlyStatus(before, item, fieldsChanged))
        await keys.request(
          api,
          `/members/${item.id}/${
            item.status === 'inactive' ? 'archive' : 'unarchive'
          }`,
          ifMatch(body({}), before),
        );
      else if (fieldsChanged)
        await keys.request(
          api,
          `/members/${item.id}`,
          ifMatch(patch({ name: item.name, phone: item.phone }), before),
        );
    }
  } else if (key === 'projects') {
    const item = after as Project;
    if (!before) {
      if (!item.ownerChurchId || !item.startDate)
        throw new Error('Choose an owner church and start date.');
      if (
        (item.status && item.status !== 'active') ||
        item.churchIds.some(id => id !== item.ownerChurchId) ||
        item.memberIds?.length
      )
        unsupported();
      await keys.request(
        api,
        '/projects',
        body({
          id: item.id,
          name: item.name,
          description: item.description || null,
          ownerChurchId: item.ownerChurchId,
          target: item.targetAmount,
          startDate: item.startDate,
          endDate: item.endDate || null,
        }),
      );
    } else {
      ensureOnlyChanged(before, item, [
        'name',
        'description',
        'targetAmount',
        'endDate',
        'status',
      ]);
      const fieldsChanged = [
        'name',
        'description',
        'targetAmount',
        'endDate',
      ].some(k => changed(before[k], (item as any)[k]));
      if (changed(before.status, item.status)) {
        if (
          fieldsChanged ||
          !['active', 'cancelled'].includes(item.status ?? '')
        )
          unsupported();
        await keys.request(
          api,
          `/projects/${item.id}/${
            item.status === 'cancelled' ? 'archive' : 'unarchive'
          }`,
          ifMatch(body({}), before),
        );
      } else if (fieldsChanged)
        await keys.request(
          api,
          `/projects/${item.id}`,
          ifMatch(
            patch({
              name: item.name,
              description: item.description || null,
              target: item.targetAmount,
              endDate: item.endDate || null,
            }),
            before,
          ),
        );
    }
  } else if (key === 'pledges') {
    const item = after as Pledge;
    if (
      before ||
      (item.status && item.status !== 'active') ||
      item.pauses?.length
    )
      unsupported();
    await keys.request(
      api,
      '/pledges',
      body({
        id: item.id,
        memberId: item.memberId,
        projectId: item.projectId,
        amount: item.amount,
        frequency: item.frequency,
        startDate: item.startDate,
        endDate: item.endDate || null,
      }),
    );
  } else {
    const item = after as Contribution;
    if (!before) {
      if (
        item.reference ||
        item.pledgeId ||
        !item.method ||
        item.method === 'other'
      )
        unsupported();
      await keys.request(
        api,
        '/payments',
        body({
          id: item.id,
          memberId: item.memberId,
          projectId: item.projectId || null,
          amount: item.amount,
          date: item.paidAt,
          method: item.method === 'mobile money' ? 'mobile_money' : item.method,
          note: item.note || null,
        }),
      );
    } else {
      ensureOnlyChanged(before, item, ['voidedAt', 'voidReason']);
      if (before.voidedAt || !item.voidedAt || !item.voidReason?.trim())
        unsupported();
      await keys.request(
        api,
        `/payments/${item.id}/void`,
        ifMatch(body({ reason: item.voidReason }), before),
      );
    }
  }
}

export async function previewPayment(
  api: ApiClient,
  input: PreviewInput,
): Promise<PaymentPreview> {
  const result = await api.request<{ data: PaymentPreview }>(
    '/payments/preview',
    body(input),
  );
  return result.data;
}
