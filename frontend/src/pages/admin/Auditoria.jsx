import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

function formatFecha(d) {
  return d ? new Date(d).toLocaleString('es-UY') : '—';
}

export default function Auditoria() {
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({ adminId: '', accion: '', desde: '', hasta: '' });
  const [filtrosAplicados, setFiltrosAplicados] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['auditoria', page, filtrosAplicados],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit: 30, ...filtrosAplicados });
      return api.get(`/auditoria?${params}`).then(r => r.data);
    },
  });

  function aplicarFiltros() {
    setPage(1);
    const f = {};
    if (filtros.adminId) f.adminId = filtros.adminId;
    if (filtros.accion) f.accion = filtros.accion;
    if (filtros.desde) f.desde = filtros.desde;
    if (filtros.hasta) f.hasta = filtros.hasta;
    setFiltrosAplicados(f);
  }

  function limpiarFiltros() {
    setFiltros({ adminId: '', accion: '', desde: '', hasta: '' });
    setFiltrosAplicados({});
    setPage(1);
  }

  const registros = data?.data || [];
  const total = data?.total || 0;
  const totalPaginas = Math.ceil(total / 30);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Admin ID</label>
            <input
              type="text"
              value={filtros.adminId}
              onChange={e => setFiltros(f => ({ ...f, adminId: e.target.value }))}
              placeholder="ID del administrador"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Acción</label>
            <input
              type="text"
              value={filtros.accion}
              onChange={e => setFiltros(f => ({ ...f, accion: e.target.value }))}
              placeholder="Ej: CAMBIO_ESTADO"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.desde}
              onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.hasta}
              onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={aplicarFiltros} className="bg-certia-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark transition">
            Filtrar
          </button>
          <button onClick={limpiarFiltros} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Admin</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Acción</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Entidad</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">IP</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registros.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">Sin registros.</td></tr>
                  )}
                  {registros.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{formatFecha(r.creadoEn)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{r.admin?.nombre || '—'}</p>
                        <p className="text-xs text-gray-400">{r.admin?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {r.accion}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">
                        {r.entidad && <span>{r.entidad}</span>}
                        {r.entidadId && <span className="ml-1 text-gray-400">#{r.entidadId.slice(0, 8)}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell font-mono">{r.ip || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs max-w-xs">
                        {r.detalle ? (
                          <details className="cursor-pointer">
                            <summary className="text-certia-green hover:underline">Ver detalle</summary>
                            <pre className="mt-1 text-xs bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                              {JSON.stringify(r.detalle, null, 2)}
                            </pre>
                          </details>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">{total} registros · Página {page} de {totalPaginas}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    ← Anterior
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPaginas, p + 1))} disabled={page === totalPaginas}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
