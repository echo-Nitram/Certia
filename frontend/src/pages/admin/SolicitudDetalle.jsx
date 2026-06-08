import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import EstadoBadge from '../../components/EstadoBadge';
import SolicitudTimeline from '../../components/SolicitudTimeline';

const TRANSICIONES = {
  PENDIENTE: ['EN_REVISION', 'RECHAZADO'],
  EN_REVISION: ['OBSERVADO', 'PAGO_VALIDADO', 'RECHAZADO'],
  OBSERVADO: ['EN_REVISION', 'RECHAZADO'],
  PAGO_VALIDADO: ['EN_ELABORACION', 'RECHAZADO'],
  EN_ELABORACION: [],
  REVISION_PDF: ['PENDIENTE_FIRMA', 'EN_ELABORACION'],
  PENDIENTE_FIRMA: ['FINALIZADO', 'RECHAZADO'],
  FINALIZADO: [],
  RECHAZADO: [],
  VENCIDO: [],
};
const REQUIERE_MOTIVO = ['OBSERVADO', 'RECHAZADO'];

function formatFecha(d) {
  return d ? new Date(d).toLocaleDateString('es-UY') : '—';
}

export default function SolicitudDetalle() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [estadoNuevo, setEstadoNuevo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [comentario, setComentario] = useState('');
  const [tipoComentario, setTipoComentario] = useState('INTERNO');
  const [archivoPdf, setArchivoPdf] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const { data: solicitud, isLoading } = useQuery({
    queryKey: ['solicitud', id],
    queryFn: () => api.get(`/solicitudes/${id}`).then(r => r.data),
  });

  const { data: comentarios = [] } = useQuery({
    queryKey: ['comentarios', id],
    queryFn: () => api.get(`/solicitudes/${id}/comentarios`).then(r => r.data),
  });

  const mutCambiarEstado = useMutation({
    mutationFn: (body) => api.patch(`/solicitudes/${id}/estado`, body),
    onSuccess: () => {
      toast.success('Estado actualizado.');
      qc.invalidateQueries(['solicitud', id]);
      setEstadoNuevo(''); setMotivo('');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al cambiar estado.'),
  });

  const mutComentario = useMutation({
    mutationFn: (body) => api.post(`/solicitudes/${id}/comentarios`, body),
    onSuccess: () => {
      toast.success('Comentario guardado.');
      qc.invalidateQueries(['comentarios', id]);
      setComentario('');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al guardar comentario.'),
  });

  async function cambiarEstado() {
    if (!estadoNuevo) return;
    if (REQUIERE_MOTIVO.includes(estadoNuevo) && !motivo.trim()) {
      return toast.error('El motivo es obligatorio para este estado.');
    }
    mutCambiarEstado.mutate({ estadoNuevo, motivo });
  }

  async function generarPdfSinFirma() {
    try {
      const { data } = await api.post(`/solicitudes/${id}/pdf-sin-firma`);
      window.open(data.url, '_blank');
    } catch { toast.error('Error al generar PDF.'); }
  }

  async function subirPdfFirmado() {
    if (!archivoPdf) return toast.error('Seleccioná un archivo PDF.');
    setSubiendo(true);
    const form = new FormData();
    form.append('pdf', archivoPdf);
    try {
      await api.post(`/solicitudes/${id}/pdf-firmado`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('PDF firmado validado. Certificado emitido.');
      qc.invalidateQueries(['solicitud', id]);
      setArchivoPdf(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error de validación del PDF.');
    } finally { setSubiendo(false); }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>;
  if (!solicitud) return <div className="text-center py-12 text-red-500">Solicitud no encontrada.</div>;

  const transicionesValidas = TRANSICIONES[solicitud.estadoActual] || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Encabezado */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link to="/admin/solicitudes" className="text-sm text-certia-green hover:underline inline-flex items-center gap-1 mb-1">
            ← Solicitudes
          </Link>
          <h1 className="page-title">{solicitud.nExpediente}</h1>
          <p className="page-sub">
            {solicitud.tipoCert?.codigo} — {solicitud.tipoCert?.nombre} · {solicitud.cliente?.nombreEmpresa}
          </p>
        </div>
        <EstadoBadge estado={solicitud.estadoActual} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Fechas de emisión/vencimiento — solo cuando existen */}
          {(solicitud.fechaEmision || solicitud.fechaVencimiento) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="c-card" style={{ borderLeftWidth: 3, borderLeftColor: 'var(--green-700)', padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--green-700)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Fecha de emisión</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--green-700)' }}>{formatFecha(solicitud.fechaEmision)}</div>
              </div>
              <div
                className="c-card"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: solicitud.fechaVencimiento && new Date(solicitud.fechaVencimiento) < new Date() ? 'var(--c-danger, #dc2626)' : '#d97706',
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, color: solicitud.fechaVencimiento && new Date(solicitud.fechaVencimiento) < new Date() ? 'var(--c-danger, #dc2626)' : '#d97706' }}>Fecha de vencimiento</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: solicitud.fechaVencimiento && new Date(solicitud.fechaVencimiento) < new Date() ? 'var(--c-danger, #dc2626)' : '#92400e' }}>{formatFecha(solicitud.fechaVencimiento)}</div>
              </div>
            </div>
          )}

          {/* Datos del formulario */}
          <div className="c-card">
            <div className="c-card__head">
              <span className="c-section-title">Datos de la solicitud</span>
            </div>
            <div className="c-card__body">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(solicitud.datosFormulario || {}).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{k}</dt>
                    <dd className="text-sm text-gray-800 mt-0.5">{String(v)}</dd>
                  </div>
                ))}
              </dl>

              {solicitud.solicitudOrigen && (
                <p className="mt-4 c-alert c-alert--info" style={{ fontSize: 12 }}>
                  Renovación de: <a href={`/admin/solicitudes/${solicitud.solicitudOrigen.id}`} className="font-medium underline">{solicitud.solicitudOrigen.nExpediente}</a>
                </p>
              )}
              {solicitud.renovaciones?.length > 0 && (
                <div className="mt-4 c-alert c-alert--info" style={{ fontSize: 12 }}>
                  <p className="font-medium mb-1">Renovaciones de este certificado:</p>
                  {solicitud.renovaciones.map(r => (
                    <a key={r.id} href={`/admin/solicitudes/${r.id}`} className="block hover:underline">{r.nExpediente}</a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PDFs */}
          {['REVISION_PDF', 'PENDIENTE_FIRMA', 'FINALIZADO'].includes(solicitud.estadoActual) && (
            <div className="c-card">
              <div className="c-card__head">
                <span className="c-section-title">PDFs</span>
              </div>
              <div className="c-card__body space-y-3">
                {solicitud.pdfBorradorUrl && solicitud.estadoActual === 'REVISION_PDF' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Vista previa del borrador:</p>
                    <iframe
                      src={`${solicitud.pdfBorradorUrl}#toolbar=0`}
                      className="w-full border border-gray-200 rounded-lg shadow-sm"
                      style={{ height: 700 }}
                      title="PDF Borrador"
                    />
                    <div className="flex gap-3">
                      <button onClick={() => setEstadoNuevo('PENDIENTE_FIRMA')} className="c-btn c-btn--primary c-btn--sm">
                        Aprobar — pasar a firma
                      </button>
                      <button onClick={() => setEstadoNuevo('EN_ELABORACION')} className="c-btn c-btn--secondary c-btn--sm">
                        Devolver para corrección
                      </button>
                    </div>
                  </div>
                )}
                {solicitud.estadoActual === 'PENDIENTE_FIRMA' && (
                  <button onClick={generarPdfSinFirma} className="c-btn c-btn--gold c-btn--sm">
                    Descargar PDF sin firma
                  </button>
                )}
                {solicitud.pdfFirmadoUrl && (
                  <a href={solicitud.pdfFirmadoUrl} target="_blank" rel="noopener noreferrer" className="c-btn c-btn--primary c-btn--sm">
                    Descargar PDF firmado
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Subir PDF firmado */}
          {solicitud.estadoActual === 'PENDIENTE_FIRMA' && (
            <div className="c-card">
              <div className="c-card__head">
                <span className="c-section-title">Subir PDF firmado</span>
              </div>
              <div className="c-card__body space-y-3">
                <p className="text-sm text-gray-500">Descargá el PDF, firmalo en firma.gub.uy y subilo aquí.</p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => setArchivoPdf(e.target.files[0])}
                  className="c-input"
                />
                {archivoPdf && (
                  <button onClick={subirPdfFirmado} disabled={subiendo} className="c-btn c-btn--primary c-btn--sm">
                    {subiendo ? 'Validando...' : 'Subir y validar firma'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="c-card">
            <div className="c-card__head">
              <span className="c-section-title">Historial de estados</span>
            </div>
            <div className="c-card__body">
              <SolicitudTimeline historial={solicitud.historialEstados || []} esAdmin={true} />
            </div>
          </div>

          {/* Comentarios */}
          <div className="c-card">
            <div className="c-card__head">
              <span className="c-section-title">Comentarios internos</span>
            </div>
            <div className="c-card__body space-y-4">
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comentarios.length === 0 && <p className="text-sm text-gray-400">Sin comentarios aún.</p>}
                {comentarios.map(c => (
                  <div key={c.id} className={`p-3 rounded-lg text-sm ${c.tipo === 'INTERNO' ? 'bg-gray-50 border border-gray-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700">{c.admin?.nombre}</span>
                      <span className="text-xs text-gray-400">{new Date(c.creadoEn).toLocaleString('es-UY')}</span>
                    </div>
                    <p className="text-gray-700">{c.texto}</p>
                    <span className="text-xs mt-1 inline-block text-gray-500">{c.tipo === 'INTERNO' ? 'Interno' : 'Visible al cliente'}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={tipoComentario}
                  onChange={e => setTipoComentario(e.target.value)}
                  className="c-select"
                >
                  <option value="INTERNO">Interno</option>
                  <option value="VISIBLE">Visible al cliente</option>
                </select>
                <input
                  type="text"
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  placeholder="Escribir comentario..."
                  className="c-input flex-1"
                />
                <button
                  onClick={() => mutComentario.mutate({ texto: comentario, tipo: tipoComentario })}
                  disabled={!comentario.trim() || mutComentario.isPending}
                  className="c-btn c-btn--primary c-btn--sm"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral: cambio de estado */}
        <div className="space-y-4">
          {transicionesValidas.length > 0 && (
            <div className="c-card">
              <div className="c-card__head">
                <span className="c-section-title">Cambiar estado</span>
              </div>
              <div className="c-card__body space-y-3">
                <select
                  value={estadoNuevo}
                  onChange={e => setEstadoNuevo(e.target.value)}
                  className="c-select"
                  style={{ width: '100%' }}
                >
                  <option value="">— Seleccionar —</option>
                  {transicionesValidas.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                {(estadoNuevo === 'OBSERVADO' || estadoNuevo === 'RECHAZADO') && (
                  <textarea
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    placeholder="Motivo obligatorio..."
                    rows={3}
                    className="c-textarea"
                    style={{ width: '100%', resize: 'none' }}
                  />
                )}
                <button
                  onClick={cambiarEstado}
                  disabled={!estadoNuevo || mutCambiarEstado.isPending}
                  className="c-btn c-btn--primary c-btn--full"
                >
                  {mutCambiarEstado.isPending ? 'Guardando...' : 'Confirmar cambio'}
                </button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="c-card">
            <div className="c-card__head">
              <span className="c-section-title">Información</span>
            </div>
            <div className="c-card__body text-sm space-y-2">
              <div><span className="text-gray-500">Cliente:</span> <span className="font-medium">{solicitud.cliente?.nombreEmpresa}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="text-gray-700">{solicitud.cliente?.email}</span></div>
              <div><span className="text-gray-500">Tipo:</span> <span className="text-gray-700">{solicitud.tipoCert?.codigo}</span></div>
              <div><span className="text-gray-500">Creada:</span> <span className="text-gray-700">{formatFecha(solicitud.creadoEn)}</span></div>
              {solicitud.qrToken && (
                <div>
                  <span className="text-gray-500">QR:</span>
                  <a href={`/verify/${solicitud.qrToken}`} target="_blank" rel="noopener noreferrer" className="text-certia-green underline ml-1 text-xs">
                    Ver verificación pública
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Adjuntos */}
          {solicitud.adjuntos?.length > 0 && (
            <div className="c-card">
              <div className="c-card__head">
                <span className="c-section-title">Documentos adjuntos</span>
              </div>
              <div className="c-card__body space-y-3">
                {solicitud.adjuntos.map(a => {
                  const isImage = a.mimeType?.startsWith('image/') || a.archivoUrl.match(/\.(jpg|jpeg|png|gif)$/i);
                  const isComprobante = a.tipo === 'comprobante_pago';

                  return (
                    <div key={a.id} className={`p-3 border rounded-lg flex items-center justify-between ${isComprobante ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{isComprobante ? '💳' : isImage ? '🖼️' : '📄'}</div>
                        <div>
                          <p className="font-medium text-sm text-gray-800">
                            {isComprobante ? 'Comprobante de pago' : a.tipo}
                          </p>
                          <p className="text-xs text-gray-500">{a.nombreOriginal || 'Archivo adjunto'}</p>
                        </div>
                      </div>
                      <a
                        href={a.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={isComprobante ? 'c-btn c-btn--primary c-btn--sm' : 'c-btn c-btn--ghost c-btn--sm'}
                      >
                        Ver archivo
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
