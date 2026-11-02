import { useCallback, useState } from 'react';
import { createStorage } from '../services/storage/storage';
type Storage = ReturnType<typeof createStorage>;
export function usePersistedState<T>(
  storage: Storage,
  key: string,
  initialValue: T,
) {
  const [value, setValue] = useState<T>(
    () => storage.get<T>(key) ?? initialValue,
  );
  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue(current => {
        const resolved =
          typeof next === 'function'
            ? (next as (current: T) => T)(current)
            : next;
        storage.set(key, resolved);
        return resolved;
      });
    },
    [key, storage],
  );
  return [value, update] as const;
}
