import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notificaciones: [],
  noLeidas: 0,
  agregar: (notif) => {
    const nueva = { id: Date.now(), leida: false, fecha: new Date(), ...notif };
    set((s) => ({
      notificaciones: [nueva, ...s.notificaciones].slice(0, 50),
      noLeidas: s.noLeidas + 1,
    }));
  },
  marcarTodasLeidas: () =>
    set((s) => ({
      notificaciones: s.notificaciones.map((n) => ({ ...n, leida: true })),
      noLeidas: 0,
    })),
  limpiar: () => set({ notificaciones: [], noLeidas: 0 }),
}));
