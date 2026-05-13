import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import EstadoBadge from '../../components/EstadoBadge';

const ESTADOS = ['PENDIENTE','EN_REVISION','OBSERVADO','PAGO_VALIDADO','EN_ELABORACION','REVISION_PDF','PENDIENTE_FIRMA'];

function useMetricas() {
  return useQuery({
    queryKey: ['dashboard-metricas'],
    queryFn: async () => {
      const [activasRes, vencimientoRes, firmaRes] = await Promise.all([
        api.get('/solicitudes?limit=200'),
        api.get('/solicitudes?estado=FINALIZADO&limit=200'),
        api.get('/solicitudes?estado=PENDIENTE_FIRMA&limit=50'),
      ]);
      const activas = activasRes.data.data || [];
      const finalizadas = vencimientoRes.data.data || [];
      const pendientesFirma = firmaRes.data.data || [];

      const porEstado = {};
      for (const e of ESTADOS) porEstado[e] = activas.filter(s => s.estadoActual === e).length;

      const hoy = new Date();
      const en30dias = new Date(hoy.getTime() + 30 * 86400000);
      const porVencer = finalizadas.filter(s => {
        const v = s.fechaVencimiento ? new Date(s.fechaVencimiento) : null;
        return v && v > hoy && v <= en30dias;
      });

      const sinGestionar72h = activas.filter(s => {
        const creado = new Date(s.creadoEn);
        return (hoy - creado) > 72 * 3600000 && ['PENDIENTE','EN_REVISION'].includes(s.estadoActual);
      });

      return { porEstado, porVencer, pendientesFirma: pendientesFirma.data || pendientesFirma, sinGestionar72h };
    },
    refetchInterval: 30000,
    retry: 2,
  });
}

function TarjetaEstado({ estado, cantidad }) {
  return (
    <Link to={`/admin/solicitudes?estado=${estado}`} className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition">
      <EstadoBadge estado={estado} />
      <p className="mt-2 text-3xl font-bold text-gray-800">{cantidad}</p>
    </Link>
  );
}

function TarjetaAlerta({ titulo, cantidad, color, link }) {
  const colores = { red: 'border-red-200 bg-red-50', amber: 'border-amber-200 bg-amber-50', blue: 'border-blue-200 bg-blue-50' };
  return (
    <Link to={link} className={`block rounded-xl border p-4 hover:shadow-md transition ${colores[color]}`}>
      <p className="text-sm font-medium text-gray-600">{titulo}</p>
      <p className="text-3xl font-bold mt-1">{cantidad}</p>
    </Link>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useMetricas();

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      Cargando...
    </div>
  );

  if (isError || !data) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-gray-500 text-sm">Error al cargar las metricas</p>
      <button
        onClick={() => refetch()}
        className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800"
      >
        Reintentar
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen del sistema en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TarjetaAlerta
          titulo="Sin gestionar +72h"
          cantidad={data?.sinGestionar72h?.length || 0}
          color="red"
          link="/admin/solicitudes?estado=PENDIENTE"
        />
        <TarjetaAlerta
          titulo="Pendientes de firma"
          cantidad={data?.pendientesFirma?.length || 0}
          color="amber"
          link="/admin/solicitudes?estado=PENDIENTE_FIRMA"
        />
        <TarjetaAlerta
          titulo="Vencen en 30 dias"
          cantidad={data?.porVencer?.length || 0}
          color="blue"
          link="/admin/solicitudes?estado=FINALIZADO"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Solicitudes activas por estado</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ESTADOS.map(e => (
            <TarjetaEstado key={e} estado={e} cantidad={data?.porEstado?.[e] || 0} />
          ))}
        </div>
      </div>

      {data?.porVencer?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Certificados proximos a vencer</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Expediente</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.porVencer.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/solicitudes/${s.id}`} className="text-green-700 font-medium hover:underline">
                        {s.nExpediente}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.cliente?.nombreEmpresa}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">
                      {s.fechaVencimiento ? new Date(s.fechaVencimiento).toLocaleDateString('es-UY') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}