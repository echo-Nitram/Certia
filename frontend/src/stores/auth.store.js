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
    {
      name: 'certia-auth',
      partialize: (s) => ({ accessToken: s.accessToken, usuario: s.usuario }),
    }
  )
);

export const useHasHydrated = () => {
  const [hydrated, setHydrated] = require('react').useState(
    useAuthStore.persist.hasHydrated()
  );
  require('react').useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuthStore.persist.hasHydrated());
    return () => unsub();
  }, []);
  return hydrated;
};