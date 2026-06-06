import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import { disconnectSocket } from '../hooks/useSocket';

const NAV = [
  { to: '/cliente', label: 'Inicio', icon: '🏠', exact: true },
  { to: '/cliente/solicitudes', label: 'Mis Solicitudes', icon: '📋' },
  { to: '/cliente/nueva', label: 'Nueva Solicitud', icon: '➕' },
];

export default function ClienteLayout() {
  const { usuario, logout } = useAuth();
  useNotifications();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    disconnectSocket();
    navigate('/cliente/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Topbar */}
      <header className="bg-certia-green shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-lg">CERTIA</span>
            <span className="text-green-200 text-xs ml-2 hidden sm:inline">Certificados Halal</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive ? 'bg-white/20 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {icon} {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="text-right hidden sm:block">
              <p className="text-white text-xs font-medium">{usuario?.nombre}</p>
              <button onClick={handleLogout} className="text-green-200 text-xs hover:text-white transition">
                Salir →
              </button>
            </div>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden border-t border-certia-green-dark px-4 py-2 flex gap-1 overflow-x-auto">
          {NAV.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition ${
                  isActive ? 'bg-white/20 text-white' : 'text-green-100 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
