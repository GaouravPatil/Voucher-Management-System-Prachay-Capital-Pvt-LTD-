import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { TOKEN_KEY } from '../lib/constants';

const baseURL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  timeout: 30000,
});

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — ignore */
  }
}

let unauthorizedHandler: ((from: string) => void) | null = null;

/** Registered once by AuthProvider so the interceptor can trigger logout+redirect. */
export function onUnauthorized(handler: (from: string) => void): void {
  unauthorizedHandler = handler;
}

// Attach Bearer token to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (missing/invalid/expired token): clear token, redirect to login with ?from=.
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const isAuthCall =
      url.includes('/auth/login') || url.includes('/auth/me');
    if (status === 401 && !isAuthCall) {
      setToken(null);
      const from =
        window.location.pathname + window.location.search || '/';
      if (unauthorizedHandler) unauthorizedHandler(from);
      else {
        const target = `/login?from=${encodeURIComponent(from)}&expired=1`;
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign(target);
        }
      }
    }
    return Promise.reject(error);
  },
);

export interface Envelope<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function unwrap<T>(promise: Promise<{ data: Envelope<T> }>): Promise<T> {
  return promise.then((res) => res.data.data);
}

/** GET that returns a Blob (authenticated image streaming). */
export async function getBlob(url: string): Promise<Blob> {
  const token = getToken();
  const res = await api.get(url, {
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  } as AxiosRequestConfig);
  return res.data as Blob;
}

export function apiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { code?: string; message?: string } }
      | undefined;
    if (data?.error?.message) return data.error.message;
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Check your connection and try again.';
    }
  }
  return fallback;
}

export interface FieldErrors {
  [field: string]: string;
}

/** Map server `details: [{field, message}]` onto form field errors. */
export function apiFieldErrors(error: unknown): FieldErrors {
  const out: FieldErrors = {};
  if (axios.isAxiosError(error)) {
    const details = (
      error.response?.data as {
        error?: { details?: { field?: string; message: string }[] };
      }
    )?.error?.details;
    if (Array.isArray(details)) {
      for (const d of details) {
        if (d.field && !out[d.field]) out[d.field] = d.message;
      }
    }
  }
  return out;
}
