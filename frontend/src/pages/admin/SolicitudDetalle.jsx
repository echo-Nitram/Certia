import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
          <h1 className="text-2xl font-bold text-gray-900">{solicitud.nExpediente}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {solicitud.tipoCert?.codigo} — {solicitud.tipoCert?.nombre} · {solicitud.cliente?.nombreEmpresa}
          </p>
        </div>
        <EstadoBadge estado={solicitud.estadoActual} className="text-sm px-3 py-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Fechas de emisión/vencimiento — solo cuando existen */}
          {(solicitud.fechaEmision || solicitud.fechaVencimiento) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Fecha de emisión</p>
                <p className="text-base font-semibold text-green-900">{formatFecha(solicitud.fechaEmision)}</p>
              </div>
              <div className={`rounded-xl p-4 border ${
                solicitud.fechaVencimiento && new Date(solicitud.fechaVencimiento) < new Date()
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${
                  solicitud.fechaVencimiento && new Date(solicitud.fechaVencimiento) < new Date()
                    ? 'text-red-700' : 'text-amber-700'
                }`}>Fecha de vencimiento</p>
                <p className={`text-base font-semibold ${
                  solicitud.fechaVencimiento && new Date(solicitud.fechaVencimiento) < new Date()
                    ? 'text-red-900' : 'text-amber-900'
                }`}>{formatFecha(solicitud.fechaVencimiento)}</p>
              </div>
            </div>
          )}

          {/* Datos del formulario */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Datos de la solicitud</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(solicitud.datosFormulario || {}).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{k}</dt>
                  <dd className="text-sm text-gray-800 mt-0.5">{String(v)}</dd>
                </div>
              ))}
            </dl>

            {solicitud.solicitudOrigen && (
              <p className="mt-4 text-xs text-blue-600 bg-blue-50 rounded px-3 py-2">
                Renovación de: <a href={`/admin/solicitudes/${solicitud.solicitudOrigen.id}`} className="font-medium underline">{solicitud.solicitudOrigen.nExpediente}</a>
              </p>
            )}
            {solicitud.renovaciones?.length > 0 && (
              <div className="mt-4 text-xs bg-purple-50 border border-purple-200 rounded px-3 py-2 space-y-1">
                <p className="font-medium text-purple-700">Renovaciones de este certificado:</p>
                {solicitud.renovaciones.map(r => (
                  <a key={r.id} href={`/admin/solicitudes/${r.id}`}
                    className="block text-purple-600 hover:underline">{r.nExpediente}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* PDFs */}
          {['REVISION_PDF', 'PENDIENTE_FIRMA', 'FINALIZADO'].includes(solicitud.estadoActual) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-800">PDFs</h2>
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
                    <button
                      onClick={() => setEstadoNuevo('PENDIENTE_FIRMA')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                    >
                      ✓ Aprobar — pasar a firma
                    </button>
                    <button
                      onClick={() => setEstadoNuevo('EN_ELABORACION')}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                    >
                      ↩ Devolver para corrección
                    </button>
                  </div>
                </div>
              )}
              {solicitud.estadoActual === 'PENDIENTE_FIRMA' && (
                <button onClick={generarPdfSinFirma} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition">
                  ⬇ Descargar PDF sin firma
                </button>
              )}
              {solicitud.pdfFirmadoUrl && (
                <a href={solicitud.pdfFirmadoUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-certia-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark transition">
                  ⬇ Descargar PDF firmado
                </a>
              )}
            </div>
          )}

          {/* Subir PDF firmado */}
          {solicitud.estadoActual === 'PENDIENTE_FIRMA' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-800">Subir PDF firmado</h2>
              <p className="text-sm text-gray-500">Descargá el PDF, firmalo en firma.gub.uy y subilo aquí.</p>
              <input
                type="file"
                accept="application/pdf"
                onChange={e => setArchivoPdf(e.target.files[0])}
                className="text-sm text-gray-600"
              />
              {archivoPdf && (
                <button
                  onClick={subirPdfFirmado}
                  disabled={subiendo}
                  className="bg-certia-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark transition disabled:opacity-60"
                >
                  {subiendo ? 'Validando...' : 'Subir y validar firma'}
                </button>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Historial de estados</h2>
            <SolicitudTimeline historial={solicitud.historialEstados || []} esAdmin={true} />
          </div>

          {/* Comentarios */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Comentarios internos</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comentarios.length === 0 && <p className="text-sm text-gray-400">Sin comentarios aún.</p>}
              {comentarios.map(c => (
                <div key={c.id} className={`p-3 rounded-lg text-sm ${c.tipo === 'INTERNO' ? 'bg-gray-50 border border-gray-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700">{c.admin?.nombre}</span>
                    <span className="text-xs text-gray-400">{new Date(c.creadoEn).toLocaleString('es-UY')}</span>
                  </div>
                  <p className="text-gray-700">{c.texto}</p>
                  <span className="text-xs mt-1 inline-block text-gray-500">{c.tipo === 'INTERNO' ? '🔒 Interno' : '👁 Visible al cliente'}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={tipoComentario}
                onChange={e => setTipoComentario(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
              >
                <option value="INTERNO">🔒 Interno</option>
                <option value="VISIBLE">👁 Visible al cliente</option>
              </select>
              <input
                type="text"
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Escribir comentario..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green"
              />
              <button
                onClick={() => mutComentario.mutate({ texto: comentario, tipo: tipoComentario })}
                disabled={!comentario.trim() || mutComentario.isPending}
                className="bg-certia-green text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>

        {/* Panel lateral: cambio de estado */}
        <div className="space-y-4">
          {transicionesValidas.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="font-semibold text-gray-800">Cambiar estado</h2>
              <select
                value={estadoNuevo}
                onChange={e => setEstadoNuevo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green resize-none"
                />
              )}
              <button
                onClick={cambiarEstado}
                disabled={!estadoNuevo || mutCambiarEstado.isPending}
                className="w-full bg-certia-green text-white font-medium py-2 rounded-lg text-sm hover:bg-certia-green-dark transition disabled:opacity-50"
              >
                {mutCambiarEstado.isPending ? 'Guardando...' : 'Confirmar cambio'}
              </button>
            </div>
          )}

          {/* Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm space-y-2">
            <h2 className="font-semibold text-gray-800 mb-2">Información</h2>
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

          {/* Adjuntos */}
          {solicitud.adjuntos?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Adjuntos</h2>
              <div className="space-y-2">
                {solicitud.adjuntos.map(a => {
                  const esComprobante = a.tipo === 'comprobante_pago';
                  return (
                    <a key={a.id} href={a.archivoUrl} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border transition hover:shadow-sm ${
                        esComprobante
                          ? 'bg-green-50 border-green-200 text-green-800 font-medium'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}>
                      <span>{esComprobante ? '💳' : '📎'}</span>
                      <span className="flex-1">{esComprobante ? 'Comprobante de pago' : a.tipo}</span>
                      {a.nombreOriginal && <span className="text-xs text-gray-400 truncate max-w-[120px]">{a.nombreOriginal}</span>}
                      <span className="text-xs opacity-60">↗</span>
                    </a>
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
