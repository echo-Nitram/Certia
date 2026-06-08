import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setCargando(true);
    try {
      await loginAdmin(email, password);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciales inválidas.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="c-login-layout">
      {/* LEFT PANEL — dark green with Islamic pattern */}
      <div className="c-login-panel c-login-panel--brand">
        {/* Islamic pattern background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><g fill='none'><polygon points='30,4 33.9,18.5 46,14.5 38,26.5 50,30 38,33.5 46,45.5 33.9,41.5 30,56 26.1,41.5 14,45.5 22,33.5 10,30 22,26.5 14,14.5 26.1,18.5 Z' stroke='%23C8A84B' stroke-width='0.5' opacity='0.13'/></g></svg>")`,
          backgroundRepeat: 'repeat', backgroundSize: '60px 60px',
        }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          {/* Crescent + star SVG logo */}
          <svg width="72" height="72" viewBox="0 0 100 100" fill="none" style={{ marginBottom: 24, opacity: 0.25 }}>
            <path d="M88 50.97A38 38 0 1 1 49.03 13 29.3 29.3 0 0 0 88 50.97z" stroke="#C8A84B" strokeWidth="1.5"/>
            <polygon points="72,16 74,22 80,22 75.1,26 77,32 72,28.5 67,32 68.9,26 64,22 70,22" stroke="#C8A84B" strokeWidth="0.8" fill="none"/>
          </svg>
          <div className="font-brand" style={{ color: '#fff', fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6 }}>CERTIA</div>
          <div style={{ color: 'rgba(200,168,75,0.9)', fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>
            Panel de Administración
          </div>
          <div style={{ width: 40, height: 2, background: 'rgba(200,168,75,0.35)', marginBottom: 20 }} />
          <p style={{ color: 'rgba(210,232,218,0.45)', fontSize: 12, lineHeight: 1.7, maxWidth: 260 }}>
            Centro Islámico del Uruguay · Sistema de gestión de certificados Halal
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, fontSize: 11, color: 'rgba(210,232,218,0.25)' }}>
          © {new Date().getFullYear()} Centro Islámico del Uruguay
        </div>
      </div>

      {/* RIGHT SIDE — form */}
      <div className="c-login-form">
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
            Iniciar sesión
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28 }}>
            Ingresá tus credenciales para acceder al panel.
          </p>

          <form onSubmit={handleLogin}>
            <div className="c-field">
              <label className="c-label">Email</label>
              <input
                type="email"
                className="c-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@certia.uy"
              />
            </div>
            <div className="c-field">
              <label className="c-label">Contraseña</label>
              <input
                type="password"
                className="c-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="c-btn c-btn--primary c-btn--full c-btn--lg"
              disabled={cargando}
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
