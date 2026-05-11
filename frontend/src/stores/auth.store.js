import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      usuario: null,
      setAuth: (accessToken, usuario) => set({ accessToken, usuario }),
      clearAuth: () => set({ accessToken: null, usuario: null }),
    }),
    { name: 'certia-auth', partialize: (s) => ({ usuario: s.usuario }) }
  )
);
