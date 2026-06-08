import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import { disconnectSocket } from '../hooks/useSocket';

const NAV = [
  { to: '/admin', label: 'Dashboard', exact: true, icon: 'dashboard' },
  { to: '/admin/solicitudes', label: 'Solicitudes', icon: 'solicitudes' },
  { to: '/admin/clientes', label: 'Clientes', icon: 'building' },
  { to: '/admin/tipos', label: 'Tipos de Cert.', icon: 'tipos' },
  { to: '/admin/webhooks', label: 'Webhooks', icon: 'webhooks' },
  { to: '/admin/auditoria', label: 'Auditoría', icon: 'auditoria' },
  { to: '/admin/configuracion', label: 'Configuración', icon: 'configuracion' },
];

const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </>
  ),
  solicitudes: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="16" y2="17"/>
    </>
  ),
  building: (
    <>
      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>
      <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/>
    </>
  ),
  tipos: (
    <>
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </>
  ),
  webhooks: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </>
  ),
  auditoria: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </>
  ),
  configuracion: (
    <>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </>
  ),
};

function NavIcon({ name, size = 15 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      {ICONS[name] || <circle cx="12" cy="12" r="6" />}
    </svg>
  );
}

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/solicitudes': 'Solicitudes',
  '/admin/clientes': 'Clientes',
  '/admin/tipos': 'Tipos de Certificado',
  '/admin/webhooks': 'Webhooks',
  '/admin/auditoria': 'Auditoría',
  '/admin/configuracion': 'Configuración',
};

export default function AdminLayout() {
  const { usuario, logout } = useAuth();
  useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    disconnectSocket();
    navigate('/admin/login');
  }

  const pageTitle = Object.entries(PAGE_TITLES)
    .filter(([path]) => location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path)))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] || 'Administración';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="c-sidebar">
        {/* Islamic pattern background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><g fill='none'><polygon points='30,4 33.9,18.5 46,14.5 38,26.5 50,30 38,33.5 46,45.5 33.9,41.5 30,56 26.1,41.5 14,45.5 22,33.5 10,30 22,26.5 14,14.5 26.1,18.5 Z' stroke='%23C8A84B' stroke-width='0.5' opacity='0.13'/></g></svg>")`,
          backgroundRepeat: 'repeat', backgroundSize: '60px 60px',
        }} />

        {/* Brand */}
        <div className="c-sidebar__brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="c-sidebar__mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div className="c-sidebar__wordmark">CERTIA</div>
              <div className="c-sidebar__sub">Centro Islámico del Uruguay</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="c-sidebar__nav">
          {NAV.map(({ to, label, icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `c-nav-item${isActive ? ' is-active' : ''}`}
            >
              <NavIcon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="c-sidebar__footer">
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(210,232,218,0.85)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {usuario?.nombre}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(210,232,218,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {usuario?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="c-nav-item"
            style={{ width: '100%' }}
          >
            <NavIcon name="logout" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header className="c-topbar">
          <span className="page-title" style={{ fontSize: 17 }}>{pageTitle}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationCenter />
          </div>
        </header>

        {/* Content */}
        <main className="c-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
