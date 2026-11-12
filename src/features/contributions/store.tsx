import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../auth/AuthProvider';
import { ContributionsData, EMPTY_DATA } from './model';
import {
  loadContributions,
  previewPayment as requestPaymentPreview,
  saveContributionChange,
} from './api';
import type { PaymentPreview, PreviewInput } from './api';
import { createMutationKeys, UncertainMutationError } from './mutationKeys';
import { ApiError } from '../../services/api/client';

type Update = React.SetStateAction<ContributionsData>;
type ContributionsContextValue = {
  data: ContributionsData;
  setData: (update: Update) => Promise<void>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  previewPayment: (input: PreviewInput) => Promise<PaymentPreview>;
};
const ContributionsContext = createContext<ContributionsContextValue | null>(
  null,
);

export function ContributionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { api } = useAuth();
  const [data, setLocalData] = useState<ContributionsData>(EMPTY_DATA);
  const dataRef = useRef(data);
  const savingRef = useRef(false);
  const mutationKeys = useRef(createMutationKeys()).current;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const result = await loadContributions(api);
      dataRef.current = result;
      setLocalData(result);
      setError(null);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Unable to load contributions.',
      );
      throw failure;
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);
  const setData = useCallback(
    async (update: Update) => {
      if (savingRef.current)
        throw new Error('Please wait for the current change to finish.');
      savingRef.current = true;
      setSaving(true);
      try {
        const current = dataRef.current;
        const next = typeof update === 'function' ? update(current) : update;
        try {
          await saveContributionChange(api, current, next, mutationKeys);
        } catch (failure) {
          if (
            (failure instanceof ApiError && failure.status === 412) ||
            failure instanceof UncertainMutationError
          ) {
            try {
              await refresh();
            } catch {
              throw new Error(
                'Could not reload the record. Check your connection and try again.',
              );
            }
            if (failure instanceof UncertainMutationError) {
              throw new Error(
                'The result is uncertain. Close this form and check the refreshed record before trying again.',
              );
            }
            throw new Error(
              'This record changed. Close this form and reopen it to review the latest data.',
            );
          }
          throw failure;
        }
        // A committed write must never be retried just because the following read failed.
        try {
          await refresh();
        } catch {
          /* refresh exposes its error for retry */
        }
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [api, refresh, mutationKeys],
  );
  const previewPayment = useCallback(
    (input: PreviewInput) => requestPaymentPreview(api, input),
    [api],
  );
  const value = useMemo(
    () => ({ data, setData, loading, saving, error, refresh, previewPayment }),
    [data, setData, loading, saving, error, refresh, previewPayment],
  );
  return (
    <ContributionsContext.Provider value={value}>
      {children}
    </ContributionsContext.Provider>
  );
}
export function useContributions() {
  const value = useContext(ContributionsContext);
  if (!value)
    throw new Error(
      'useContributions must be used within ContributionsProvider',
    );
  return value;
}
