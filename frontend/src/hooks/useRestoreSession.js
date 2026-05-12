import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export function useRestoreSession() {
  const { accessToken, usuario, setAuth, clearAuth } = useAuthStore();
  const [restoring, setRestoring] = useState(!accessToken && !!usuario);

  useEffect(() => {
    if (!accessToken && usuario) {
      axios
        .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        .then(({ data }) => {
          setAuth(data.accessToken, usuario);
        })
        .catch(() => {
          clearAuth();
        })
        .finally(() => {
          setRestoring(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return restoring;
}
