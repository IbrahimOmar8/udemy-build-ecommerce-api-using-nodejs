import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

export const API_URL =
  (Constants.expoConfig?.extra as { apiUrl?: string })?.apiUrl ||
  'http://localhost:8000/api/v1';

const ACCESS_KEY = 'el_access_token';
const REFRESH_KEY = 'el_refresh_token';

export const tokenStore = {
  async get() {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  async getRefresh() {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async set(access: string, refresh?: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    if (refresh) await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStore.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;
const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const rt = await tokenStore.getRefresh();
    if (!rt) return null;
    try {
      const res = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken: rt,
      });
      const newToken = res.data?.accessToken;
      if (newToken) {
        await tokenStore.set(newToken);
        return newToken;
      }
      return null;
    } catch (e) {
      await tokenStore.clear();
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
