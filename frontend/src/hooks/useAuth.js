import { useAuthStore } from '../stores/auth.store';
import api from '../lib/api';

export function useAuth() {
  const { accessToken, usuario, setAuth, clearAuth } = useAuthStore();

  async function loginAdmin(email, password) {
    const { data } = await api.post('/auth/admin/login', { email, password });
    return data; // { otpRequerido: true, adminId }
  }

  async function verifyOtp(adminId, codigo) {
    const { data } = await api.post('/auth/admin/verify-otp', { adminId, codigo });
    setAuth(data.accessToken, data.usuario);
    return data;
  }

  async function loginCliente(email, password) {
    const { data } = await api.post('/auth/cliente/login', { email, password });
    setAuth(data.accessToken, data.usuario);
    return data;
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {});
    clearAuth();
  }

  const estaAutenticado = !!accessToken || !!usuario;
  const esAdmin = usuario?.rol === 'admin';
  const esCliente = usuario?.rol === 'cliente';

  return { usuario, estaAutenticado, esAdmin, esCliente, loginAdmin, verifyOtp, loginCliente, logout, setAuth };
}
