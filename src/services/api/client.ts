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

export type ApiClient = {
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
};

type Options = {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
  timeoutMs?: number;
  axiosInstance?: AxiosInstance;
  /** Kept for existing callers while the app moves from fetch to axios. */
  fetchImpl?: typeof fetch;
};

export function createApiClient({
  baseUrl,
  getToken,
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
      const relativePath = path.replace(/^\//, '');
      if (fetchImpl) {
        const response = await fetchImpl(
          `${baseUrl.replace(/\/$/, '')}/${relativePath}`,
          { ...init, headers },
        );
        if (response.status === 401) onUnauthorized?.();
        const contentType = response.headers.get('Content-Type') || '';
        const body =
          response.status === 204
            ? undefined
            : contentType.includes('application/json')
            ? await response.json()
            : await response.text();
        if (!response.ok) {
          throw new ApiError(
            response.status,
            typeof body === 'object' && body && 'message' in body
              ? String(body.message)
              : `Request failed (${response.status})`,
            body,
          );
        }
        return body as T;
      }
      try {
        const response = await client.request<T>({
          url: relativePath,
          method: init.method ?? 'GET',
          headers: Object.fromEntries(headers.entries()),
          data: init.body,
          signal: init.signal ?? undefined,
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const failure = error as AxiosError<{ message?: string }>;
          const status = failure.response?.status ?? 0;
          if (status === 401) onUnauthorized?.();
          throw new ApiError(
            status,
            failure.response?.data?.message ??
              (status ? `Request failed (${status})` : 'Network unavailable'),
            failure.response?.data,
            !failure.response,
          );
        }
        throw error;
      }
    },
  };
}
