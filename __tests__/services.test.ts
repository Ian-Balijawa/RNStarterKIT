import { ApiError, createApiClient } from '../src/services/api/client';
import {
  createMemoryStore,
  createStorage,
} from '../src/services/storage/storage';

test('storage namespaces values and survives malformed data', () => {
  const memory = createMemoryStore();
  const preferences = createStorage(memory, 'preferences');
  const session = createStorage(memory, 'session');
  preferences.set('view', { mode: 'compact' });
  expect(preferences.get<{ mode: string }>('view')).toEqual({
    mode: 'compact',
  });
  expect(session.get('view')).toBeUndefined();
  memory.set('preferences:broken', '{');
  expect(preferences.get('broken')).toBeUndefined();
  preferences.remove('view');
  expect(preferences.get('view')).toBeUndefined();
});

test('API client reports HTTP errors and invokes the unauthorized callback', async () => {
  const onUnauthorized = jest.fn();
  const fetchImpl = jest.fn(async () => ({
    status: 401,
    ok: false,
    headers: { get: () => 'application/json' },
    json: async () => ({ message: 'Session expired' }),
  })) as unknown as typeof fetch;
  const api = createApiClient({
    baseUrl: 'https://api.example.com/',
    fetchImpl,
    onUnauthorized,
  });
  await expect(api.request('/me')).rejects.toMatchObject({
    status: 401,
    message: 'Session expired',
  } as ApiError);
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
  expect(fetchImpl).toHaveBeenCalledWith(
    'https://api.example.com/me',
    expect.any(Object),
  );
});
