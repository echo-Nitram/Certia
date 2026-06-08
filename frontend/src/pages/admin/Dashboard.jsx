import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import EstadoBadge from '../../components/EstadoBadge';

const ESTADOS = ['PENDIENTE','EN_REVISION','OBSERVADO','PAGO_VALIDADO','EN_ELABORACION','REVISION_PDF','PENDIENTE_FIRMA'];

function useMetricas() {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['dashboard-metricas'],
    enabled: !!accessToken,
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
    <Link to={`/admin/solicitudes?estado=${estado}`} className="c-card" style={{ display: 'block', padding: '14px 16px' }}>
      <EstadoBadge estado={estado} />
      <p className="mt-2" style={{ fontSize: 28, fontWeight: 700, color: 'var(--green-700)', lineHeight: 1 }}>{cantidad}</p>
    </Link>
  );
}

const ALERTA_STYLES = {
  red:   { borderColor: 'var(--c-danger, #dc2626)',  background: '#fef2f2' },
  amber: { borderColor: 'var(--c-gold,   #d97706)',  background: '#fffbeb' },
  blue:  { borderColor: '#3b82f6',                   background: '#eff6ff' },
};

function TarjetaAlerta({ titulo, cantidad, color, link }) {
  return (
    <Link
      to={link}
      className="c-card"
      style={{ display: 'block', padding: '14px 16px', borderLeftWidth: 3, ...ALERTA_STYLES[color] }}
    >
      <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 4 }}>{titulo}</div>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{cantidad}</div>
    </Link>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useMetricas();

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>
  );

  if (isError || !data) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-gray-500 text-sm">Error al cargar las metricas</p>
      <button onClick={() => refetch()} className="c-btn c-btn--primary c-btn--sm">Reintentar</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Resumen del sistema en tiempo real</p>
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
        <h2 className="c-section-title" style={{ marginBottom: 12 }}>Solicitudes activas por estado</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ESTADOS.map(e => (
            <TarjetaEstado key={e} estado={e} cantidad={data?.porEstado?.[e] || 0} />
          ))}
        </div>
      </div>

      {data?.porVencer?.length > 0 && (
        <div>
          <h2 className="c-section-title" style={{ marginBottom: 12 }}>Certificados proximos a vencer</h2>
          <div className="c-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Expediente</th>
                  <th>Cliente</th>
                  <th>Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {data.porVencer.map(s => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/admin/solicitudes/${s.id}`} className="c-exp">
                        {s.nExpediente}
                      </Link>
                    </td>
                    <td className="text-gray-600">{s.cliente?.nombreEmpresa}</td>
                    <td className="text-red-600 font-medium">
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