import {
  createMemoryStore,
  createStorage,
} from '../src/services/storage/storage';
import { createOfflineLedgerStore } from '../src/features/ledger/offline';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: () => {},
    remove: () => {},
  }),
}));

test('MMKV ledger snapshot and pending changes survive reload and coalesce edits', () => {
  const storage = createStorage(createMemoryStore(), 'preferences');
  const store = createOfflineLedgerStore(storage);
  const first = store.load();
  const expense = {
    id: 'expense-1',
    kind: 'expense' as const,
    amount: 1000,
    accountId: 'cash',
    note: 'Lunch',
    occurredAt: '2026-11-03T10:00:00Z',
  };
  const added = store.commit(first, {
    ...first.ledger,
    transactions: [expense],
  });
  const updated = store.commit(added, {
    ...added.ledger,
    transactions: [{ ...expense, amount: 1500 }],
  });
  expect(
    updated.pending.filter(item => item.recordId === expense.id),
  ).toHaveLength(1);
  const reloaded = createOfflineLedgerStore(storage).load();
  expect(reloaded.ledger.transactions[0].amount).toBe(1500);
  expect(
    reloaded.pending.filter(item => item.recordId === expense.id),
  ).toHaveLength(1);
  expect(
    reloaded.pending.find(item => item.recordId === expense.id),
  ).toMatchObject({
    action: 'upsert',
    value: { amount: 1500 },
  });
  const removed = store.commit(reloaded, {
    ...reloaded.ledger,
    transactions: [],
  });
  expect(
    removed.pending.find(item => item.recordId === expense.id)?.action,
  ).toBe('delete');
});
