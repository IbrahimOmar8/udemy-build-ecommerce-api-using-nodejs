import { create } from 'zustand';
import { api, tokenStore } from '@/lib/api';
import type { AuthResponse, User } from '@/types';

interface AuthState {
  user: User | null;
  hydrated: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: 'student' | 'instructor'
  ) => Promise<User>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  bootstrap: async () => {
    try {
      const token = await tokenStore.get();
      if (!token) {
        set({ user: null, hydrated: true });
        return;
      }
      const res = await api.get<{ data: User }>('/auth/me');
      set({ user: res.data.data, hydrated: true });
    } catch {
      await tokenStore.clear();
      set({ user: null, hydrated: true });
    }
  },

  login: async (email, password) => {
    const res = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    await tokenStore.set(res.data.accessToken, res.data.refreshToken);
    set({ user: res.data.data });
    return res.data.data;
  },

  register: async (name, email, password, role = 'student') => {
    const res = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
      passwordConfirm: password,
      role,
    });
    await tokenStore.set(res.data.accessToken, res.data.refreshToken);
    set({ user: res.data.data });
    return res.data.data;
  },

  logout: async () => {
    const refreshToken = await tokenStore.getRefresh();
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      /* ignore */
    }
    await tokenStore.clear();
    set({ user: null });
  },
}));
