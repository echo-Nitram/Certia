import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import EstadoBadge from '../../components/EstadoBadge';
import SolicitudTimeline from '../../components/SolicitudTimeline';

function formatFecha(d) {
  return d ? new Date(d).toLocaleDateString('es-UY') : '—';
}

export default function SolicitudDetalleCliente() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [datosEditados, setDatosEditados] = useState(null);

  const { data: solicitud, isLoading } = useQuery({
    queryKey: ['mi-solicitud', id],
    queryFn: () => api.get(`/solicitudes/${id}`).then(r => r.data),
    onSuccess: (data) => {
      if (data.estadoActual === 'OBSERVADO' && datosEditados === null) {
        setDatosEditados({ ...data.datosFormulario });
      }
    },
  });

  const { data: comentarios = [] } = useQuery({
    queryKey: ['comentarios-cliente', id],
    queryFn: () => api.get(`/solicitudes/${id}/comentarios`).then(r => r.data),
  });

  const mutReenviar = useMutation({
    mutationFn: (datos) => api.patch(`/solicitudes/${id}/datos`, datos),
    onSuccess: () => {
      toast.success('Solicitud corregida y reenviada.');
      qc.invalidateQueries(['mi-solicitud', id]);
      setDatosEditados(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al reenviar.'),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>;
  if (!solicitud) return <div className="text-center py-12 text-red-500">Solicitud no encontrada.</div>;

  const comentariosVisibles = comentarios.filter(c => c.tipo === 'VISIBLE');

  // Obtener el motivo del último historial en OBSERVADO (motivoCliente es el campo público)
  const historialObservado = (solicitud.historialEstados || [])
    .filter(h => h.estadoNuevo === 'OBSERVADO')
    .slice(-1)[0];
  const motivoObservacion = historialObservado?.motivoCliente;

  const historialRechazo = (solicitud.historialEstados || [])
    .filter(h => h.estadoNuevo === 'RECHAZADO')
    .slice(-1)[0];
  const motivoRechazo = historialRechazo?.motivoCliente;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Encabezado */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link to="/cliente/solicitudes" className="text-sm text-certia-green hover:underline">← Mis solicitudes</Link>
          <h1 className="page-title mt-1"><span className="c-exp">{solicitud.nExpediente}</span></h1>
          <p className="page-sub">{solicitud.tipoCert?.codigo} — {solicitud.tipoCert?.nombre}</p>
        </div>
        <EstadoBadge estado={solicitud.estadoActual} className="text-sm px-3 py-1" />
      </div>

      {/* Solicitud rechazada (RECHAZADO) */}
      {solicitud.estadoActual === 'RECHAZADO' && (
        <div className="c-alert c-alert--error">
          <p className="font-semibold">✕ Solicitud rechazada</p>
          {motivoRechazo ? (
            <p className="text-sm mt-1">{motivoRechazo}</p>
          ) : (
            <p className="text-sm mt-1">Contactá al Centro Islámico para más información.</p>
          )}
        </div>
      )}

      {/* Corrección requerida (OBSERVADO) */}
      {solicitud.estadoActual === 'OBSERVADO' && (
        <div className="c-alert c-alert--warning space-y-4">
          <div>
            <p className="font-semibold">⚠️ Corrección requerida</p>
            {motivoObservacion && (
              <p className="text-sm mt-1">{motivoObservacion}</p>
            )}
            <p className="text-xs mt-1">
              Revisá los datos, corregí lo que sea necesario y reenvía la solicitud.
            </p>
          </div>

          {/* Formulario editable */}
          {datosEditados && (
            <div className="space-y-3">
              {(solicitud.tipoCert?.camposFormulario || []).map(campo => (
                <div key={campo.nombre} className="c-field">
                  <label className="c-label">
                    {campo.label}
                    {campo.requerido && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {campo.tipo === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={datosEditados[campo.nombre] || ''}
                      onChange={e => setDatosEditados(d => ({ ...d, [campo.nombre]: e.target.value }))}
                      className="c-textarea"
                    />
                  ) : campo.tipo === 'select' ? (
                    <select
                      value={datosEditados[campo.nombre] || ''}
                      onChange={e => setDatosEditados(d => ({ ...d, [campo.nombre]: e.target.value }))}
                      className="c-select"
                    >
                      <option value="">— Seleccionar —</option>
                      {(campo.opciones || []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={campo.tipo || 'text'}
                      value={datosEditados[campo.nombre] || ''}
                      onChange={e => setDatosEditados(d => ({ ...d, [campo.nombre]: e.target.value }))}
                      className="c-input"
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setDatosEditados({ ...solicitud.datosFormulario })}
                  className="c-btn c-btn--secondary c-btn--sm"
                >
                  Restaurar original
                </button>
                <button
                  onClick={() => mutReenviar.mutate(datosEditados)}
                  disabled={mutReenviar.isPending}
                  className="c-btn c-btn--gold disabled:opacity-60"
                >
                  {mutReenviar.isPending ? 'Reenviando...' : 'Corregir y reenviar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Datos (solo lectura cuando no está en OBSERVADO) */}
      {solicitud.estadoActual !== 'OBSERVADO' && (
        <div className="c-card">
          <div className="c-card__head">
            <span className="c-section-title">Datos de la solicitud</span>
          </div>
          <div className="c-card__body">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(solicitud.datosFormulario || {}).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{k.replace(/_/g, ' ')}</dt>
                  <dd className="text-sm text-gray-800 mt-0.5">{String(v)}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Creada</dt>
                <dd className="text-sm text-gray-800 mt-0.5">{formatFecha(solicitud.creadoEn)}</dd>
              </div>
              {solicitud.fechaVencimiento && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vencimiento</dt>
                  <dd className="text-sm text-gray-800 mt-0.5">{formatFecha(solicitud.fechaVencimiento)}</dd>
                </div>
              )}
            </dl>
            {solicitud.solicitudOrigen && (
              <p className="mt-4 text-xs text-blue-600 bg-blue-50 rounded px-3 py-2">
                Renovación de: <Link to={`/cliente/solicitudes/${solicitud.solicitudOrigen.id}`}
                  className="font-medium underline">{solicitud.solicitudOrigen.nExpediente}</Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* PDF certificado finalizado */}
      {solicitud.estadoActual === 'FINALIZADO' && solicitud.pdfFirmadoUrl && (
        <div className="c-card">
          <div className="c-card__head">
            <span className="c-section-title">Certificado emitido</span>
          </div>
          <div className="c-card__body space-y-3">
            <p className="text-sm text-gray-600">Tu certificado Halal fue emitido y firmado digitalmente.</p>
            <a href={solicitud.pdfFirmadoUrl} target="_blank" rel="noopener noreferrer"
              className="c-btn c-btn--primary inline-flex items-center gap-2">
              <span>⬇</span> Descargar certificado
            </a>
            {solicitud.qrToken && (
              <div>
                <a href={`/verify/${solicitud.qrToken}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-certia-green hover:underline">
                  🔍 Ver verificación pública
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adjuntos del cliente */}
      {solicitud.adjuntos?.length > 0 && (
        <div className="c-card">
          <div className="c-card__head">
            <span className="c-section-title">Documentos adjuntos</span>
          </div>
          <div className="c-card__body">
            {solicitud.adjuntos.map(a => (
              <a key={a.id} href={a.archivoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-certia-green hover:underline mb-2">
                <span>📎</span> {a.tipo}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="c-card">
        <div className="c-card__head">
          <span className="c-section-title">Estado de la solicitud</span>
        </div>
        <div className="c-card__body">
          <SolicitudTimeline historial={solicitud.historialEstados || []} esAdmin={false} />
        </div>
      </div>

      {/* Mensajes del operador */}
      {comentariosVisibles.length > 0 && (
        <div className="c-card">
          <div className="c-card__head">
            <span className="c-section-title">Mensajes del operador</span>
          </div>
          <div className="c-card__body space-y-3">
            {comentariosVisibles.map(c => (
              <div key={c.id} className="c-alert c-alert--success">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700 text-sm">Centro Islámico del Uruguay</span>
                  <span className="text-xs text-gray-400">{new Date(c.creadoEn).toLocaleString('es-UY')}</span>
                </div>
                <p className="text-sm text-gray-700">{c.texto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Renovar certificado */}
      {['FINALIZADO', 'VENCIDO'].includes(solicitud.estadoActual) && (() => {
        const puedeRenovar = solicitud.estadoActual === 'VENCIDO' || (() => {
          if (!solicitud.fechaVencimiento) return true;
          const diasRestantes = Math.ceil((new Date(solicitud.fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24));
          return diasRestantes <= 60;
        })();
        if (!puedeRenovar) return null;
        return (
        <div className="c-card text-center">
          <div className="c-card__body">
            <p className="text-sm text-gray-600 mb-3">
              {solicitud.estadoActual === 'VENCIDO' ? '¿Necesitás renovar este certificado?' : '¿Querés renovar anticipadamente?'}
            </p>
            <Link
              to={`/cliente/solicitudes/nueva?renovacionDe=${id}`}
              className="c-btn c-btn--primary"
            >
              Solicitar renovación
            </Link>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
