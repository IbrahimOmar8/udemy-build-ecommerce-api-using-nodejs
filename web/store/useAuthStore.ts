import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, tokenStore } from '@/lib/api';
import type { AuthResponse, User } from '@/types';

interface AuthState {
  user: User | null;
  hydrated: boolean;
  setUser: (u: User | null) => void;
  setHydrated: (h: boolean) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: 'student' | 'instructor'
  ) => Promise<User>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      hydrated: false,
      setUser: (user) => set({ user }),
      setHydrated: (hydrated) => set({ hydrated }),

      login: async (email, password) => {
        const res = await api.post<AuthResponse>('/auth/login', {
          email,
          password,
        });
        tokenStore.set(res.data.accessToken, res.data.refreshToken);
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
        tokenStore.set(res.data.accessToken, res.data.refreshToken);
        set({ user: res.data.data });
        return res.data.data;
      },

      logout: async () => {
        const refreshToken = tokenStore.refreshToken;
        try {
          await api.post('/auth/logout', { refreshToken });
        } catch {
          /* ignore */
        }
        tokenStore.clear();
        set({ user: null });
      },

      fetchMe: async () => {
        if (!tokenStore.accessToken) {
          set({ user: null });
          return null;
        }
        try {
          const res = await api.get<{ data: User }>('/auth/me');
          set({ user: res.data.data });
          return res.data.data;
        } catch {
          set({ user: null });
          tokenStore.clear();
          return null;
        }
      },
    }),
    {
      name: 'el-auth-store',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
