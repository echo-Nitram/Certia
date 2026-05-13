import { useAuthStore } from '../stores/auth.store';

export function useRestoreSession() {
  // Con persist en Zustand, accessToken se hidrata desde localStorage automaticamente.
  // No necesitamos llamar /auth/refresh (falla cross-domain en Vercel).
  // App.jsx ya espera hasHydrated() antes de renderizar.
  return false;
}