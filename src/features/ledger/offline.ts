import { useCallback, useRef, useState } from 'react';
import { createStorage } from '../../services/storage/storage';
import { preferences } from '../../services/storage/mmkv';
import { INITIAL_LEDGER, LedgerState, newId } from './model';

type Collection = keyof LedgerState;
type RecordWithId = { id: string };
export type PendingChange = {
  id: string;
  collection: Collection;
  recordId: string;
  action: 'upsert' | 'delete';
  value?: RecordWithId;
  recordedAt: string;
};
export type OfflineLedger = {
  version: 1;
  ledger: LedgerState;
  pending: PendingChange[];
  updatedAt: string;
};
const KEY = 'ledger.offline.v1';
const COLLECTIONS: Collection[] = [
  'accounts',
  'categories',
  'transactions',
  'schedules',
  'budgets',
];

type Storage = ReturnType<typeof createStorage>;

function changesBetween(
  before: LedgerState,
  after: LedgerState,
): PendingChange[] {
  const changes: PendingChange[] = [];
  for (const collection of COLLECTIONS) {
    const previous = new Map(
      (before[collection] as RecordWithId[]).map(item => [item.id, item]),
    );
    const current = new Map(
      (after[collection] as RecordWithId[]).map(item => [item.id, item]),
    );
    for (const [id, item] of current) {
      if (JSON.stringify(previous.get(id)) !== JSON.stringify(item)) {
        changes.push({
          id: newId(),
          collection,
          recordId: id,
          action: 'upsert',
          value: item,
          recordedAt: new Date().toISOString(),
        });
      }
    }
    for (const id of previous.keys()) {
      if (!current.has(id)) {
        changes.push({
          id: newId(),
          collection,
          recordId: id,
          action: 'delete',
          recordedAt: new Date().toISOString(),
        });
      }
    }
  }
  return changes;
}

function coalesce(existing: PendingChange[], incoming: PendingChange[]) {
  const next = [...existing];
  for (const change of incoming) {
    const index = next.findIndex(
      item =>
        item.collection === change.collection &&
        item.recordId === change.recordId,
    );
    if (index < 0) next.push(change);
    else next[index] = { ...change, id: next[index].id };
  }
  return next;
}

export function createOfflineLedgerStore(storage: Storage) {
  return {
    load(): OfflineLedger {
      const stored = storage.get<OfflineLedger>(KEY);
      if (
        stored?.version === 1 &&
        stored.ledger &&
        Array.isArray(stored.pending)
      )
        return stored;
      const ledger = storage.get<LedgerState>('ledger.v1') ?? INITIAL_LEDGER;
      const envelope: OfflineLedger = {
        version: 1,
        ledger,
        pending: changesBetween(
          { ...INITIAL_LEDGER, accounts: [], categories: [] },
          ledger,
        ),
        updatedAt: new Date().toISOString(),
      };
      storage.set(KEY, envelope);
      return envelope;
    },
    commit(before: OfflineLedger, ledger: LedgerState): OfflineLedger {
      const changes = changesBetween(before.ledger, ledger);
      if (!changes.length) return before;
      const next: OfflineLedger = {
        version: 1,
        ledger,
        pending: coalesce(before.pending, changes),
        updatedAt: new Date().toISOString(),
      };
      storage.set(KEY, next);
      return next;
    },
    acknowledge(current: OfflineLedger, ids: string[]): OfflineLedger {
      const next = {
        ...current,
        pending: current.pending.filter(item => !ids.includes(item.id)),
      };
      storage.set(KEY, next);
      return next;
    },
  };
}

export function useOfflineLedger() {
  const store = useRef(createOfflineLedgerStore(preferences)).current;
  const [envelope, setEnvelope] = useState(() => store.load());
  const latest = useRef(envelope);
  const setLedger = useCallback(
    (update: React.SetStateAction<LedgerState>) => {
      const current = latest.current;
      const nextLedger =
        typeof update === 'function'
          ? (update as (value: LedgerState) => LedgerState)(current.ledger)
          : update;
      const next = store.commit(current, nextLedger);
      latest.current = next;
      setEnvelope(next);
    },
    [store],
  );
  const refreshLocal = useCallback(() => {
    const next = store.load();
    latest.current = next;
    setEnvelope(next);
  }, [store]);
  return {
    ledger: envelope.ledger,
    setLedger,
    pendingCount: envelope.pending.length,
    refreshLocal,
  };
}
