import axios, { AxiosError, AxiosInstance } from 'axios';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
    public offline = false,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const error = body as { detail?: unknown; message?: unknown };
    if (typeof error.detail === 'string' && error.detail) return error.detail;
    if (typeof error.message === 'string' && error.message)
      return error.message;
  }
  return status ? `Request failed (${status})` : 'Network unavailable';
}

export type ApiClient = {
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
};

type Options = {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  getCsrfToken?: () => string | null;
  onUnauthorized?: () => void;
  timeoutMs?: number;
  axiosInstance?: AxiosInstance;
  /** Kept for existing callers while the app moves from fetch to axios. */
  fetchImpl?: typeof fetch;
};

export function createApiClient({
  baseUrl,
  getToken,
  getCsrfToken,
  onUnauthorized,
  timeoutMs = 15000,
  axiosInstance,
  fetchImpl,
}: Options): ApiClient {
  const client =
    axiosInstance ??
    axios.create({
      baseURL: `${baseUrl.replace(/\/$/, '')}/`,
      timeout: timeoutMs,
      withCredentials: true,
    });
  return {
    async request<T>(path: string, init: RequestInit = {}) {
      const token = await getToken?.();
      const headers = new Headers(init.headers);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (
        init.body &&
        typeof init.body === 'string' &&
        !headers.has('Content-Type')
      ) {
        headers.set('Content-Type', 'application/json');
      }
      const method = (init.method ?? 'GET').toUpperCase();
      const csrfToken = getCsrfToken?.();
      if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        headers.set('x-csrf-token', csrfToken);
      }
      const relativePath = path.replace(/^\//, '');
      if (fetchImpl) {
        const response = await fetchImpl(
          `${baseUrl.replace(/\/$/, '')}/${relativePath}`,
          { ...init, headers, credentials: 'include' },
        );
        if (response.status === 401) onUnauthorized?.();
        const contentType = response.headers.get('Content-Type') || '';
        const body =
          response.status === 204
            ? undefined
            : contentType.includes('application/json') ||
              contentType.includes('+json')
            ? await response.json()
            : await response.text();
        if (!response.ok) {
          throw new ApiError(
            response.status,
            errorMessage(body, response.status),
            body,
          );
        }
        return body as T;
      }
      try {
        const response = await client.request<T>({
          url: relativePath,
          method,
          withCredentials: true,
          headers: Object.fromEntries(headers.entries()),
          data: init.body,
          signal: init.signal ?? undefined,
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const failure = error as AxiosError;
          const status = failure.response?.status ?? 0;
          if (status === 401) onUnauthorized?.();
          throw new ApiError(
            status,
            errorMessage(failure.response?.data, status),
            failure.response?.data,
            !failure.response,
          );
        }
        throw error;
      }
    },
  };
}
