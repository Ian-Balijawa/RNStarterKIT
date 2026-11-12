import type { ApiClient } from '../../services/api/client';
import { createMutationKeys } from './mutationKeys';

test('reuses a key and exact request when a write fails and is retried', async () => {
  const request = jest
    .fn()
    .mockRejectedValueOnce(new Error('Network unavailable'))
    .mockResolvedValue({ data: 'saved' });
  const api = { request } as ApiClient;
  const makeKey = jest
    .fn()
    .mockReturnValue('123e4567-e89b-42d3-a456-426614174000');
  const keys = createMutationKeys(makeKey);
  const init = { method: 'POST', body: '{"id":"payment","amount":10}' };
  await expect(keys.request(api, '/payments', init)).rejects.toThrow(
    'Network unavailable',
  );
  await expect(keys.request(api, '/payments', init)).resolves.toEqual({
    data: 'saved',
  });
  expect(request.mock.calls[0]).toEqual(request.mock.calls[1]);
  expect(request.mock.calls[0][1].headers['idempotency-key']).toBe(
    '123e4567-e89b-42d3-a456-426614174000',
  );
  expect(makeKey).toHaveBeenCalledTimes(1);
});

test('uses a new key when the body or If-Match changes and after success', async () => {
  const request = jest
    .fn()
    .mockRejectedValueOnce(new Error('timeout'))
    .mockRejectedValueOnce(new Error('timeout'))
    .mockResolvedValue({});
  const api = { request } as ApiClient;
  let counter = 0;
  const keys = createMutationKeys(() => `key-${++counter}`);
  const init = {
    method: 'PATCH',
    headers: { 'If-Match': '"1"' },
    body: '{"name":"A"}',
  };
  await expect(keys.request(api, '/members/1', init)).rejects.toThrow();
  await expect(
    keys.request(api, '/members/1', { ...init, body: '{"name":"B"}' }),
  ).rejects.toThrow();
  await keys.request(api, '/members/1', {
    ...init,
    headers: { 'If-Match': '"2"' },
  });
  await keys.request(api, '/members/1', {
    ...init,
    headers: { 'If-Match': '"2"' },
  });
  expect(
    request.mock.calls.map(call => call[1].headers['idempotency-key']),
  ).toEqual(['key-1', 'key-2', 'key-3', 'key-4']);
});

test('does not retry an unresolved request after the backend retention period', async () => {
  const request = jest.fn().mockRejectedValue(new Error('timeout'));
  let time = 0;
  const keys = createMutationKeys(
    () => 'key',
    () => time,
  );
  const api = { request } as ApiClient;
  const init = { method: 'POST', body: '{"reason":"correction"}' };
  await expect(keys.request(api, '/payments/1/void', init)).rejects.toThrow(
    'timeout',
  );
  time = 30 * 24 * 60 * 60 * 1000;
  await expect(keys.request(api, '/payments/1/void', init)).rejects.toThrow(
    'too old to retry safely',
  );
  expect(request).toHaveBeenCalledTimes(1);
});

test('explains uncertain results differently for replayable and non-replayable writes', async () => {
  const { ApiError } = require('../../services/api/client');
  const api = {
    request: jest
      .fn()
      .mockRejectedValue(
        new ApiError(0, 'Network unavailable', undefined, true),
      ),
  } as ApiClient;
  const keys = createMutationKeys(() => 'key');
  await expect(
    keys.request(api, '/payments', { method: 'POST', body: '{}' }),
  ).rejects.toThrow('Retry without changing');
  await expect(
    keys.request(api, '/members/1', { method: 'PATCH', body: '{}' }),
  ).rejects.toThrow('Check the refreshed record');
  await expect(
    keys.request(api, '/members/1/archive', { method: 'POST', body: '{}' }),
  ).rejects.toThrow('Check the refreshed record');
  (api.request as jest.Mock).mockRejectedValue(
    new ApiError(408, 'Request timed out'),
  );
  await expect(
    keys.request(api, '/pledges', { method: 'POST', body: '{}' }),
  ).rejects.toThrow('Retry without changing');
});
