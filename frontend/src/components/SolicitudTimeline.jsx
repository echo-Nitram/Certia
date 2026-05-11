import EstadoBadge from './EstadoBadge';

function formatFecha(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SolicitudTimeline({ historial = [], esAdmin = false }) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {historial.map((h, i) => (
          <li key={h.id}>
            <div className="relative pb-8">
              {i < historial.length - 1 && (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              )}
              <div className="relative flex space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-certia-green ring-8 ring-white">
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {h.estadoAnterior && (
                        <>
                          <EstadoBadge estado={h.estadoAnterior} />
                          <span className="text-gray-400">→</span>
                        </>
                      )}
                      <EstadoBadge estado={h.estadoNuevo} />
                    </div>
                    {h.admin && (
                      <p className="text-xs text-gray-500 mt-1">Por: {h.admin.nombre}</p>
                    )}
                    {h.motivoCliente && (
                      <p className="mt-1 text-sm text-gray-700 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                        <span className="font-medium">Motivo:</span> {h.motivoCliente}
                      </p>
                    )}
                    {esAdmin && h.motivoInterno && (
                      <p className="mt-1 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 italic">
                        <span className="font-medium text-gray-700">Nota interna:</span> {h.motivoInterno}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-gray-500">
                    {formatFecha(h.fecha)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
