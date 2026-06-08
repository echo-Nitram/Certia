import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import { disconnectSocket } from '../hooks/useSocket';

const NAV = [
  { to: '/cliente/dashboard', label: 'Inicio', exact: true, icon: 'home' },
  { to: '/cliente/solicitudes', label: 'Mis Solicitudes', icon: 'solicitudes' },
  { to: '/cliente/solicitudes/nueva', label: 'Nueva Solicitud', icon: 'plus' },
];

const ICONS = {
  home: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
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
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
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
  '/cliente/dashboard': 'Inicio',
  '/cliente/solicitudes/nueva': 'Nueva Solicitud',
  '/cliente/solicitudes': 'Mis Solicitudes',
};

export default function ClienteLayout() {
  const { usuario, logout } = useAuth();
  useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await logout();
    disconnectSocket();
    navigate('/cliente/login');
  }

  const pageTitle = Object.entries(PAGE_TITLES)
    .filter(([path]) => location.pathname === path || location.pathname.startsWith(path + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] || 'Portal Cliente';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile overlay */}
      <div
        className={`c-sidebar-overlay${sidebarOpen ? ' is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`c-sidebar${sidebarOpen ? ' is-open' : ''}`}>
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
              <div className="c-sidebar__sub">Certificados Halal</div>
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
              onClick={() => setSidebarOpen(false)}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="c-topbar__hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menú">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="page-title" style={{ fontSize: 17 }}>{pageTitle}</span>
          </div>
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
