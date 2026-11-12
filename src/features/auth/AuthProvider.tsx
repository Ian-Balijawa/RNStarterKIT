import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ApiClient,
  ApiError,
  createApiClient,
} from '../../services/api/client';
import { preferences } from '../../services/storage/mmkv';
import { API_BASE_URL } from '../../app/config/api';

export type UserProfile = {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  role: 'organization_admin' | 'church_admin' | 'treasurer' | 'viewer';
  churchIds: string[];
  version: number;
  updatedAt: string;
};
type AuthResult = {
  user: UserProfile;
  session: { expiresAt?: string };
  csrfToken: string;
};
type AuthContextValue = {
  api: ApiClient;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  baseUrl: string;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function normalizeApiUrl(input: string) {
  const value = input.trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^/\s]+(?:\/[^\s]*)?$/i.test(value))
    throw new Error(
      'Enter a valid server URL beginning with http:// or https://.',
    );
  return value.endsWith('/api/v1') ? value : `${value}/api/v1`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [baseUrl] = useState(() => {
    const url = API_BASE_URL || preferences.get<string>('api-url') || '';
    return url ? normalizeApiUrl(url) : '';
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [generation, setGeneration] = useState(0);
  const currentGeneration = useRef(0);
  const csrf = useRef<string | null>(null);
  const api = useMemo(
    () =>
      createApiClient({
        baseUrl,
        getCsrfToken: () => csrf.current,
        onUnauthorized: () => {
          if (currentGeneration.current === generation) {
            csrf.current = null;
            setUser(null);
          }
        },
      }),
    [baseUrl, generation],
  );

  useEffect(() => {
    let active = true;
    if (!baseUrl) {
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setError(null);
    api
      .request<{ data: AuthResult }>('/auth/session')
      .then(({ data }) => {
        if (active) {
          csrf.current = data.csrfToken;
          setUser(data.user);
        }
      })
      .catch(err => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) setUser(null);
        else
          setError(
            err instanceof Error
              ? err.message
              : 'Could not connect to the server.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, baseUrl, retryCount]);

  const signIn = useCallback(
    async (phone: string, password: string) => {
      if (!baseUrl)
        throw new Error(
          'The backend address is not configured. Contact your administrator.',
        );
      const nextUrl = normalizeApiUrl(baseUrl);
      let loginCsrf: string | null = null;
      const loginApi = createApiClient({
        baseUrl: nextUrl,
        getCsrfToken: () => loginCsrf,
      });
      const token = await loginApi.request<{ data: { csrfToken: string } }>(
        '/auth/csrf',
      );
      loginCsrf = token.data.csrfToken;
      const result = await loginApi.request<{ data: AuthResult }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ phone: phone.trim(), password }),
        },
      );
      // Ignore late unauthorized responses from the previous session.
      currentGeneration.current += 1;
      setGeneration(currentGeneration.current);
      csrf.current = result.data.csrfToken;
      setUser(result.data.user);
      setError(null);
    },
    [baseUrl],
  );
  const signOut = useCallback(async () => {
    try {
      await api.request('/auth/logout', { method: 'POST' });
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) throw err;
    }
    csrf.current = null;
    setUser(null);
  }, [api]);
  const value = useMemo(
    () => ({
      api,
      user,
      loading,
      error,
      baseUrl,
      signIn,
      signOut,
      retry: () => setRetryCount(x => x + 1),
    }),
    [api, user, loading, error, baseUrl, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
