import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        }
        const { data } = await refreshing;
        refreshing = null;
        const { accessToken } = data;
        useAuthStore.getState().setAuth(accessToken, useAuthStore.getState().usuario);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        refreshing = null;
        useAuthStore.getState().clearAuth();
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
