import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import { disconnectSocket } from '../hooks/useSocket';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/admin/solicitudes', label: 'Solicitudes', icon: '📋' },
  { to: '/admin/clientes', label: 'Clientes', icon: '🏢' },
  { to: '/admin/tipos', label: 'Tipos de Cert.', icon: '📄' },
  { to: '/admin/webhooks', label: 'Webhooks', icon: '🔗' },
  { to: '/admin/auditoria', label: 'Auditoría', icon: '🔍' },
  { to: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
];

export default function AdminLayout() {
  const { usuario, logout } = useAuth();
  useNotifications();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    disconnectSocket();
    navigate('/admin/login');
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-certia-green flex flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-certia-green-dark">
          <h1 className="text-white font-bold text-xl tracking-tight">CERTIA</h1>
          <p className="text-green-200 text-xs mt-0.5">Centro Islámico del Uruguay</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-green-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-certia-green-dark">
          <p className="text-green-200 text-xs truncate">{usuario?.nombre}</p>
          <p className="text-green-300/60 text-xs truncate">{usuario?.email}</p>
          <button onClick={handleLogout} className="mt-3 text-xs text-red-300 hover:text-red-100 transition">
            Cerrar sesión →
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-certia-green px-6 py-3 flex items-center justify-between flex-shrink-0 shadow">
          <div />
          <NotificationCenter />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
