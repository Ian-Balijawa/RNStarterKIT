import { AxiosInstance } from 'axios';
import { ApiError, createApiClient } from './client';

describe('API client session requests', () => {
  it('sends cookies and the current CSRF token for mutations', async () => {
    const request = jest.fn().mockResolvedValue({ data: { data: 'saved' } });
    let csrf = 'first';
    const api = createApiClient({
      baseUrl: 'https://example.test/api/v1',
      axiosInstance: { request } as unknown as AxiosInstance,
      getCsrfToken: () => csrf,
    });
    await api.request('/members', {
      method: 'POST',
      body: JSON.stringify({ name: 'A' }),
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'members',
        method: 'POST',
        withCredentials: true,
        headers: expect.objectContaining({
          'x-csrf-token': 'first',
          'content-type': 'application/json',
        }),
      }),
    );
    csrf = 'rotated';
    await api.request('/members/1', { method: 'PATCH', body: '{}' });
    expect(request.mock.calls[1][0].headers['x-csrf-token']).toBe('rotated');
  });

  it('does not attach CSRF to reads', async () => {
    const request = jest.fn().mockResolvedValue({ data: {} });
    const api = createApiClient({
      baseUrl: 'https://example.test/api/v1',
      axiosInstance: { request } as unknown as AxiosInstance,
      getCsrfToken: () => 'token',
    });
    await api.request('/auth/session');
    expect(request.mock.calls[0][0].headers['x-csrf-token']).toBeUndefined();
  });

  it('invalidates the session after an unauthorized response', async () => {
    const request = jest.fn().mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Session expired' } },
    });
    const onUnauthorized = jest.fn();
    const api = createApiClient({
      baseUrl: 'https://example.test/api/v1',
      axiosInstance: { request } as unknown as AxiosInstance,
      onUnauthorized,
    });
    await expect(api.request('/members')).rejects.toEqual(
      expect.objectContaining({
        status: 401,
        message: 'Session expired',
      } as Partial<ApiError>),
    );
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});

it('shows the backend problem detail for Axios and problem+json responses', async () => {
  const request = jest.fn().mockRejectedValue({
    isAxiosError: true,
    response: { status: 412, data: { detail: 'This record has changed.' } },
  });
  const api = createApiClient({
    baseUrl: 'https://example.test/api/v1',
    axiosInstance: { request } as unknown as AxiosInstance,
  });
  await expect(api.request('/members')).rejects.toMatchObject({
    status: 412,
    message: 'This record has changed.',
  });
  const fetchImpl = jest.fn().mockResolvedValue({
    status: 422,
    ok: false,
    headers: new Headers({ 'Content-Type': 'application/problem+json' }),
    json: async () => ({ detail: 'Enter a valid phone number.' }),
  });
  const fetchApi = createApiClient({
    baseUrl: 'https://example.test/api/v1',
    fetchImpl,
  });
  await expect(fetchApi.request('/members')).rejects.toMatchObject({
    status: 422,
    message: 'Enter a valid phone number.',
  });
});
