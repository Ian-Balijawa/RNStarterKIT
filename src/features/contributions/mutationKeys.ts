import { ApiError } from '../../services/api/client';
import type { ApiClient } from '../../services/api/client';
import { newId } from './model';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

type PendingKey = { key: string; createdAt: number };

/** The server may have committed a write which it cannot replay. */
export class UncertainMutationError extends Error {
  constructor() {
    super(
      'The result could not be confirmed. Check the refreshed record before trying again.',
    );
    this.name = 'UncertainMutationError';
  }
}

export class ReplayableMutationError extends Error {
  constructor() {
    super(
      'The result is uncertain. Retry without changing any fields or closing this form.',
    );
    this.name = 'ReplayableMutationError';
  }
}

/** Keeps retries of the same request on the same key for this signed-in session. */
export function createMutationKeys(
  makeKey: () => string = newId,
  now: () => number = Date.now,
) {
  const pending = new Map<string, PendingKey>();
  return {
    async request<T>(
      api: ApiClient,
      path: string,
      init: RequestInit,
    ): Promise<T> {
      if (init.body != null && typeof init.body !== 'string') {
        throw new Error('The request body must be JSON.');
      }
      const headers = new Headers(init.headers);
      // CSRF rotates independently and is added by the API client. If-Match is
      // part of the backend's request fingerprint and changes the operation.
      const fingerprint = JSON.stringify([
        (init.method ?? 'GET').toUpperCase(),
        path,
        headers.get('If-Match'),
        init.body ?? null,
      ]);
      let operation = pending.get(fingerprint);
      if (operation && now() - operation.createdAt >= RETENTION_MS) {
        throw new Error(
          'This request is too old to retry safely. Refresh the data before trying again.',
        );
      }
      if (!operation) {
        operation = { key: makeKey(), createdAt: now() };
        pending.set(fingerprint, operation);
      }
      headers.set('Idempotency-Key', operation.key);
      try {
        const result = await api.request<T>(path, {
          ...init,
          headers: Object.fromEntries(headers.entries()),
        });
        pending.delete(fingerprint);
        return result;
      } catch (failure) {
        const method = (init.method ?? 'GET').toUpperCase();
        const nonReplayable =
          method === 'PATCH' || /\/(?:archive|unarchive)$/.test(path);
        if (
          failure instanceof ApiError &&
          (failure.offline ||
            failure.status === 0 ||
            failure.status === 408 ||
            failure.status >= 500)
        ) {
          if (nonReplayable) throw new UncertainMutationError();
          throw new ReplayableMutationError();
        }
        throw failure;
      }
    },
  };
}

export type MutationKeys = ReturnType<typeof createMutationKeys>;
