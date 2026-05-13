import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';

export function useRestoreSession() {
  const { accessToken, usuario } = useAuthStore();
  // Si ya tenemos accessToken (persiste en localStorage), no hay nada que restaurar
  // Si no hay ni token ni usuario, tampoco
  // Solo intentamos restaurar si hay usuario pero no token
  const needsRestore = !accessToken && !!usuario;
  const [restoring, setRestoring] = useState(needsRestore);

  useEffect(() => {
    // Si tiene accessToken, ya está restaurado - no hacer nada
    if (accessToken || !usuario) {
      setRestoring(false);
      return;
    }
    // No hay token pero hay usuario -> el token se perdió (expiró o fue a localStorage viejo)
    // No intentamos refresh (falla cross-domain en Vercel) - simplemente dejamos pasar
    // El RequireAdmin va a redirigir a login si no hay token
    setRestoring(false);
  }, []);

  return restoring;
}