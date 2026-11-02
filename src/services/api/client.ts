export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}
export type ApiClient = {
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
};
export function createApiClient({
  baseUrl,
  getToken,
  onUnauthorized,
  fetchImpl = fetch,
}: {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
}): ApiClient {
  return {
    async request<T>(path: string, init: RequestInit = {}) {
      const token = await getToken?.();
      const headers = new Headers(init.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (
        init.body &&
        !headers.has('Content-Type') &&
        typeof init.body === 'string'
      ) {
        headers.set('Content-Type', 'application/json');
      }
      const response = await fetchImpl(
        `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
        { ...init, headers },
      );
      if (response.status === 401) {
        onUnauthorized?.();
      }
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
    },
  };
}
