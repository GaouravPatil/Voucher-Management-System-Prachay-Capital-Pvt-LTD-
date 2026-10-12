import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getToken, onUnauthorized, setToken } from '../api/client';
import { authApi } from '../api/auth.api';
import { ROLE_HOME } from '../lib/constants';
import type { Role, User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: (reason?: 'manual' | 'expired') => void;
  refresh: () => Promise<User | null>;
  hasRole: (...roles: Role[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState(true);
  const redirectedRef = useRef(false);

  const logout = useCallback(
    (reason: 'manual' | 'expired' = 'manual') => {
      setToken(null);
      setTokenState(null);
      setUser(null);
      delete api.defaults.headers.common.Authorization;
      if (reason === 'expired') {
        toast.error('Session expired. Please log in again.');
      }
      navigate('/login', { replace: true });
    },
    [navigate],
  );

  // Wire the axios 401 interceptor -> logout + redirect with ?from=.
  useEffect(() => {
    onUnauthorized((from: string) => {
      setToken(null);
      setTokenState(null);
      setUser(null);
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        toast.error('Session expired. Please log in again.');
        navigate(
          `/login?from=${encodeURIComponent(from)}&expired=1`,
          { replace: true },
        );
        window.setTimeout(() => {
          redirectedRef.current = false;
        }, 1000);
      }
    });
  }, [navigate]);

  const refresh = useCallback(async (): Promise<User | null> => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setTokenState(null);
      return null;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      setTokenState(t);
      return me;
    } catch {
      setToken(null);
      setTokenState(null);
      setUser(null);
      return null;
    }
  }, []);

  // Restore session on app load via GET /auth/me.
  useEffect(() => {
    let alive = true;
    (async () => {
      setIsLoading(true);
      const me = await refresh();
      if (alive) {
        void me;
        setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const res = await authApi.login(email, password);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const hasRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user && !!token,
      login,
      logout,
      refresh,
      hasRole,
    }),
    [user, token, isLoading, login, logout, refresh, hasRole],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function homeForRole(role: Role | undefined): string {
  if (!role) return '/login';
  return ROLE_HOME[role] ?? '/login';
}
