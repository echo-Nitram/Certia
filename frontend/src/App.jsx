import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useHasHydrated } from './stores/auth.store';
import { useRestoreSession } from './hooks/useRestoreSession';

// Layouts
import AdminLayout from './components/AdminLayout';
import ClienteLayout from './components/ClienteLayout';

// Admin pages
import LoginAdmin from './pages/admin/LoginAdmin';
import Dashboard from './pages/admin/Dashboard';
import Solicitudes from './pages/admin/Solicitudes';
import SolicitudDetalle from './pages/admin/SolicitudDetalle';
import Clientes from './pages/admin/Clientes';
import Tipos from './pages/admin/Tipos';
import Configuracion from './pages/admin/Configuracion';
import Webhooks from './pages/admin/Webhooks';
import Auditoria from './pages/admin/Auditoria';

// Cliente pages
import LoginCliente from './pages/cliente/LoginCliente';
import DashboardCliente from './pages/cliente/Dashboard';
import SolicitudesCliente from './pages/cliente/Solicitudes';
import NuevaSolicitud from './pages/cliente/NuevaSolicitud';
import SolicitudDetalleCliente from './pages/cliente/SolicitudDetalle';

// Public
import Verify from './pages/Verify';

function RequireAdmin({ children }) {
  const { usuario, accessToken } = useAuthStore();
  if (!accessToken || usuario?.rol !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function RequireCliente({ children }) {
  const { usuario, accessToken } = useAuthStore();
  if (!accessToken || usuario?.rol !== 'cliente') return <Navigate to="/cliente/login" replace />;
  return children;
}

function RootRedirect() {
  const { usuario, accessToken } = useAuthStore();
  if (!accessToken) return <Navigate to="/admin/login" replace />;
  if (usuario?.rol === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/cliente" replace />;
}

export default function App() {
  const restoring = useRestoreSession();

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-certia-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RootRedirect />} />

      {/* Admin */}
      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route path="/admin" element={
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      }>
        <Route index element={<Dashboard />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="solicitudes/:id" element={<SolicitudDetalle />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="tipos" element={<Tipos />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="webhooks" element={<Webhooks />} />
        <Route path="auditoria" element={<Auditoria />} />
      </Route>

      {/* Cliente */}
      <Route path="/cliente/login" element={<LoginCliente />} />
      <Route path="/cliente" element={
        <RequireCliente>
          <ClienteLayout />
        </RequireCliente>
      }>
        <Route index element={<DashboardCliente />} />
        <Route path="solicitudes" element={<SolicitudesCliente />} />
        <Route path="solicitudes/nueva" element={<NuevaSolicitud />} />
        <Route path="solicitudes/:id" element={<SolicitudDetalleCliente />} />
      </Route>

      {/* Public verify */}
      <Route path="/verify/:token" element={<Verify />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
