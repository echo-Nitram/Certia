import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import EstadoBadge from '../../components/EstadoBadge';

const ESTADOS = ['','PENDIENTE','EN_REVISION','OBSERVADO','PAGO_VALIDADO','EN_ELABORACION','REVISION_PDF','PENDIENTE_FIRMA','FINALIZADO','RECHAZADO','VENCIDO'];

function formatFecha(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-UY');
}

export default function Solicitudes() {
  const [params, setParams] = useSearchParams();
  const [busqueda, setBusqueda] = useState('');

  const estado = params.get('estado') || '';
  const page = parseInt(params.get('page') || '1');

  const { data, isLoading } = useQuery({
    queryKey: ['solicitudes', estado, page, busqueda],
    queryFn: () => api.get('/solicitudes', { params: { estado: estado || undefined, page, limit: 20, busqueda: busqueda || undefined } }).then(r => r.data),
    keepPreviousData: true,
  });

  function exportar() {
    const url = `/api/export/solicitudes?${estado ? `estado=${estado}` : ''}`;
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Solicitudes</h1>
        <button onClick={exportar} className="c-btn c-btn--gold c-btn--sm">
          Exportar Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="c-card" style={{ padding: '12px 16px' }}>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar expediente o empresa..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="c-input flex-1 min-w-48"
          />
          <select
            value={estado}
            onChange={e => setParams({ estado: e.target.value, page: '1' })}
            className="c-select"
          >
            {ESTADOS.map(e => <option key={e} value={e}>{e || 'Todos los estados'}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="c-card text-center text-gray-400" style={{ padding: 48 }}>Cargando...</div>
      ) : (
        <div className="c-card" style={{ padding: 0 }}>
          <div className="c-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Expediente</th>
                  <th className="hidden md:table-cell">Cliente</th>
                  <th className="hidden lg:table-cell">Tipo</th>
                  <th>Estado</th>
                  <th className="hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Sin resultados</td></tr>
                )}
                {data?.data?.map(s => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/admin/solicitudes/${s.id}`} className="c-exp">
                        {s.nExpediente}
                      </Link>
                    </td>
                    <td className="text-gray-600 hidden md:table-cell">{s.cliente?.nombreEmpresa}</td>
                    <td className="text-gray-500 text-xs hidden lg:table-cell">
                      {s.tipoCert?.codigo} — {s.tipoCert?.nombre}
                    </td>
                    <td><EstadoBadge estado={s.estadoActual} /></td>
                    <td className="text-gray-400 hidden sm:table-cell">{formatFecha(s.creadoEn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Paginación */}
          <div className="px-4 py-3 flex items-center justify-between text-sm text-gray-500" style={{ borderTop: '1px solid var(--border)' }}>
            <span>Total: {data?.total || 0}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setParams({ estado, page: String(page - 1) })}
                className="c-btn c-btn--ghost c-btn--sm"
              >← Anterior</button>
              <button
                disabled={!data?.data?.length || data.data.length < 20}
                onClick={() => setParams({ estado, page: String(page + 1) })}
                className="c-btn c-btn--ghost c-btn--sm"
              >Siguiente →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
