import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import EstadoBadge from '../../components/EstadoBadge';

const ESTADOS = ['', 'PENDIENTE', 'EN_REVISION', 'OBSERVADO', 'PAGO_VALIDADO', 'EN_ELABORACION',
  'REVISION_PDF', 'PENDIENTE_FIRMA', 'FINALIZADO', 'RECHAZADO', 'VENCIDO'];

function formatFecha(d) {
  return d ? new Date(d).toLocaleDateString('es-UY') : '—';
}

export default function Solicitudes() {
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['mis-solicitudes', estado, page],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit: 15 });
      if (estado) params.set('estado', estado);
      return api.get(`/solicitudes?${params}`).then(r => r.data);
    },
  });

  const solicitudes = data?.data || [];
  const total = data?.total || 0;
  const totalPaginas = Math.ceil(total / 15);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Mis solicitudes</h1>
        <Link to="/cliente/solicitudes/nueva"
          className="bg-certia-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark transition">
          + Nueva solicitud
        </Link>
      </div>

      {/* Filtro estado */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => { setEstado(e); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition ${estado === e ? 'bg-certia-green text-white border-certia-green' : 'bg-white text-gray-600 border-gray-300 hover:border-certia-green'}`}
            >
              {e || 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : solicitudes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Sin solicitudes{estado ? ` con estado ${estado}` : ''}.</div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {solicitudes.map(s => (
                <Link key={s.id} to={`/cliente/solicitudes/${s.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-800 text-sm">{s.nExpediente}</p>
                      {s.solicitudOrigen && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Renovación</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.tipoCert?.codigo} — {s.tipoCert?.nombre} · {formatFecha(s.creadoEn)}
                    </p>
                    {s.estadoActual === 'FINALIZADO' && s.fechaVencimiento && (
                      <p className="text-xs text-gray-400 mt-0.5">Vence: {formatFecha(s.fechaVencimiento)}</p>
                    )}
                  </div>
                  <EstadoBadge estado={s.estadoActual} />
                </Link>
              ))}
            </div>
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">{total} solicitudes</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    ←
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPaginas}</span>
                  <button onClick={() => setPage(p => Math.min(totalPaginas, p + 1))} disabled={page === totalPaginas}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    →
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
