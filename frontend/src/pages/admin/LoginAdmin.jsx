import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginAdmin() {
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminId, setAdminId] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const { loginAdmin, verifyOtp } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setCargando(true);
    try {
      const data = await loginAdmin(email, password);
      setAdminId(data.adminId);
      setPaso(2);
      toast.success('Código OTP enviado a tu email.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciales inválidas.');
    } finally {
      setCargando(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setCargando(true);
    try {
      await verifyOtp(adminId, codigo);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Código incorrecto.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-certia-green rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CERTIA</h1>
          <p className="text-gray-500 text-sm mt-1">Panel de Administración</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {paso === 1 ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Iniciar sesión</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green focus:border-transparent"
                  placeholder="admin@certia.uy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-certia-green text-white font-semibold py-2.5 rounded-lg hover:bg-certia-green-dark transition disabled:opacity-60"
              >
                {cargando ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <div className="text-3xl mb-2">📧</div>
                <h2 className="text-lg font-semibold text-gray-800">Verificación 2FA</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Ingresá el código de 6 dígitos enviado a tu email. Válido por 10 minutos.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código OTP</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-certia-green"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={cargando || codigo.length !== 6}
                className="w-full bg-certia-green text-white font-semibold py-2.5 rounded-lg hover:bg-certia-green-dark transition disabled:opacity-60"
              >
                {cargando ? 'Verificando...' : 'Acceder'}
              </button>
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
              >
                ← Volver
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
