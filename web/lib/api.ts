import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const TOKEN_KEY = 'el_access_token';
const REFRESH_KEY = 'el_refresh_token';

export const tokenStore = {
  get accessToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  get refreshToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;
const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const rt = tokenStore.refreshToken;
    if (!rt) return null;
    try {
      const res = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken: rt,
      });
      const newToken = res.data?.accessToken;
      if (newToken) {
        tokenStore.set(newToken);
        return newToken;
      }
      return null;
    } catch (e) {
      tokenStore.clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      !original._retry &&
      tokenStore.refreshToken &&
      !original.url?.includes('/auth/')
    ) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken && original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export const extractError = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: { msg: string }[] }
      | undefined;
    if (data?.errors?.length) return data.errors.map((e) => e.msg).join(', ');
    if (data?.message) return data.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
};
