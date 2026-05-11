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
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
        <button onClick={exportar} className="bg-certia-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-gold-dark transition">
          Exportar Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar expediente o empresa..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-certia-green"
        />
        <select
          value={estado}
          onChange={e => setParams({ estado: e.target.value, page: '1' })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green"
        >
          {ESTADOS.map(e => <option key={e} value={e}>{e || 'Todos los estados'}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : (
          <>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Expediente</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data?.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Sin resultados</td></tr>
                )}
                {data?.data?.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/solicitudes/${s.id}`} className="text-certia-green font-semibold hover:underline">
                        {s.nExpediente}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{s.cliente?.nombreEmpresa}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                      {s.tipoCert?.codigo} — {s.tipoCert?.nombre}
                    </td>
                    <td className="px-4 py-3"><EstadoBadge estado={s.estadoActual} /></td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{formatFecha(s.creadoEn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Paginación */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>Total: {data?.total || 0}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setParams({ estado, page: String(page - 1) })}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >← Anterior</button>
                <button
                  disabled={!data?.data?.length || data.data.length < 20}
                  onClick={() => setParams({ estado, page: String(page + 1) })}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >Siguiente →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
