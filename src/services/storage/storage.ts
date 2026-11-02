export interface KeyValueStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}
export function createStorage(store: KeyValueStore, prefix = 'app') {
  const keyFor = (key: string) => `${prefix}:${key}`;
  return {
    get<T>(key: string): T | undefined {
      const raw = store.getString(keyFor(key));
      if (raw === undefined) {
        return undefined;
      }
      try {
        return JSON.parse(raw) as T;
      } catch {
        return undefined;
      }
    },
    set<T>(key: string, value: T) {
      store.set(keyFor(key), JSON.stringify(value));
    },
    remove(key: string) {
      store.delete(keyFor(key));
    },
  };
}
export function createMemoryStore(): KeyValueStore {
  const values = new Map<string, string>();
  return {
    getString: key => values.get(key),
    set: (key, value) => {
      values.set(key, value);
    },
    delete: key => {
      values.delete(key);
    },
  };
}
