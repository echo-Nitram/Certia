import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import EstadoBadge from '../../components/EstadoBadge';
import { useAuthStore } from '../../stores/auth.store';

function formatFecha(d) {
  return d ? new Date(d).toLocaleDateString('es-UY') : '—';
}

function diasRestantes(fechaVencimiento) {
  if (!fechaVencimiento) return null;
  const diff = new Date(fechaVencimiento) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const { usuario } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['mis-solicitudes-recientes'],
    queryFn: () => api.get('/solicitudes?limit=5').then(r => r.data),
  });

  const solicitudes = data?.data || [];
  const observadas = solicitudes.filter(s => s.estadoActual === 'OBSERVADO');
  const activas = solicitudes.filter(s => !['FINALIZADO', 'RECHAZADO', 'VENCIDO'].includes(s.estadoActual));
  const proximasVencer = solicitudes.filter(s => {
    if (s.estadoActual !== 'FINALIZADO') return false;
    const dias = diasRestantes(s.fechaVencimiento);
    return dias !== null && dias <= 30 && dias >= 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {usuario?.nombre}</h1>
        <p className="text-gray-500 text-sm mt-1">{usuario?.nombreEmpresa}</p>
      </div>

      {/* Alertas */}
      {observadas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-medium text-amber-800">
            ⚠️ Tenés {observadas.length} solicitud{observadas.length > 1 ? 'es' : ''} con observaciones pendientes
          </p>
          <div className="mt-2 space-y-1">
            {observadas.map(s => (
              <Link key={s.id} to={`/cliente/solicitudes/${s.id}`}
                className="block text-sm text-amber-700 hover:text-amber-900 hover:underline">
                → {s.nExpediente} — {s.tipoCert?.nombre}
              </Link>
            ))}
          </div>
        </div>
      )}

      {proximasVencer.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="font-medium text-orange-800">
            🕐 Certificados próximos a vencer
          </p>
          <div className="mt-2 space-y-1">
            {proximasVencer.map(s => {
              const dias = diasRestantes(s.fechaVencimiento);
              return (
                <Link key={s.id} to={`/cliente/solicitudes/${s.id}`}
                  className="block text-sm text-orange-700 hover:underline">
                  → {s.nExpediente} vence en {dias} día{dias !== 1 ? 's' : ''} ({formatFecha(s.fechaVencimiento)})
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-certia-green">{activas.length}</p>
          <p className="text-sm text-gray-500 mt-1">En trámite</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{solicitudes.filter(s => s.estadoActual === 'FINALIZADO').length}</p>
          <p className="text-sm text-gray-500 mt-1">Finalizados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-3xl font-bold text-red-500">{solicitudes.filter(s => s.estadoActual === 'RECHAZADO').length}</p>
          <p className="text-sm text-gray-500 mt-1">Rechazados</p>
        </div>
      </div>

      {/* Solicitudes recientes */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Solicitudes recientes</h2>
          <Link to="/cliente/solicitudes" className="text-sm text-certia-green hover:underline">Ver todas →</Link>
        </div>
        {isLoading ? (
          <div className="text-center py-10 text-gray-400">Cargando...</div>
        ) : solicitudes.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>Aún no tenés solicitudes.</p>
            <Link to="/cliente/solicitudes/nueva" className="mt-3 inline-block bg-certia-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark transition">
              + Nueva solicitud
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {solicitudes.map(s => (
              <Link key={s.id} to={`/cliente/solicitudes/${s.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 text-sm">{s.nExpediente}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.tipoCert?.nombre} · {formatFecha(s.creadoEn)}</p>
                </div>
                <EstadoBadge estado={s.estadoActual} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Acceso rápido */}
      <Link to="/cliente/solicitudes/nueva"
        className="flex items-center justify-center gap-2 w-full bg-certia-green text-white font-medium py-3 rounded-xl hover:bg-certia-green-dark transition">
        <span className="text-lg">+</span>
        <span>Nueva solicitud de certificado</span>
      </Link>
    </div>
  );
}
