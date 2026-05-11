import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const PASOS = ['Tipo', 'Datos', 'Confirmar'];

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const renovacionDeId = searchParams.get('renovacionDe');

  const [paso, setPaso] = useState(renovacionDeId ? 1 : 0);
  const [tipoCertId, setTipoCertId] = useState('');
  const [tipoCert, setTipoCert] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState({});
  const [archivoComprobante, setArchivoComprobante] = useState(null);

  const { data: tipos = [], isLoading: cargandoTipos } = useQuery({
    queryKey: ['mis-tipos'],
    queryFn: () => api.get('/tipos').then(r => r.data),
  });

  // Pre-llenar datos de la solicitud origen si es renovación
  useEffect(() => {
    if (!renovacionDeId || tipos.length === 0) return;

    api.get(`/solicitudes/${renovacionDeId}`).then(({ data: origen }) => {
      const tipoOrigen = tipos.find(t => t.id === origen.tipoCertId);
      if (tipoOrigen) {
        setTipoCertId(tipoOrigen.id);
        setTipoCert(tipoOrigen);
        setDatosFormulario({ ...origen.datosFormulario });
      }
    }).catch(() => toast.error('No se pudo cargar la solicitud original.'));
  }, [renovacionDeId, tipos]);

  function seleccionarTipo(t) {
    setTipoCertId(t.id);
    setTipoCert(t);
    const inicial = {};
    (t.camposFormulario || []).forEach(c => { inicial[c.nombre] = ''; });
    setDatosFormulario(inicial);
    setPaso(1);
  }

  function validarPaso1() {
    if (!tipoCert) return false;
    const requeridos = (tipoCert.camposFormulario || []).filter(c => c.requerido);
    return requeridos.every(c => datosFormulario[c.nombre]?.toString().trim());
  }

  const mutCrear = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('tipoCertId', tipoCertId);
      form.append('datosFormulario', JSON.stringify(datosFormulario));
      if (renovacionDeId) form.append('solicitudOrigenId', renovacionDeId);
      if (archivoComprobante) form.append('comprobante', archivoComprobante);
      const { data } = await api.post('/solicitudes', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(renovacionDeId ? 'Renovación enviada correctamente.' : 'Solicitud enviada correctamente.');
      navigate(`/cliente/solicitudes/${data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al enviar la solicitud.'),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">
        {renovacionDeId ? 'Renovar certificado' : 'Nueva solicitud'}
      </h1>

      {/* Banner de renovación */}
      {renovacionDeId && tipoCert && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
          <span className="font-medium">⟳ Renovación en curso.</span> Los datos fueron pre-llenados desde el certificado anterior. Revisalos antes de continuar.
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center">
        {PASOS.map((p, i) => (
          <div key={p} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition ${i < paso ? 'bg-certia-green text-white' : i === paso ? 'bg-certia-green text-white ring-4 ring-certia-green/20' : 'bg-gray-200 text-gray-500'}`}>
              {i < paso ? '✓' : i + 1}
            </div>
            <span className={`ml-2 text-sm hidden sm:inline ${i === paso ? 'font-medium text-certia-green' : 'text-gray-400'}`}>{p}</span>
            {i < PASOS.length - 1 && <div className={`mx-3 flex-1 h-0.5 w-8 ${i < paso ? 'bg-certia-green' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Paso 0: Elegir tipo */}
      {paso === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Seleccioná el tipo de certificado Halal que necesitás:</p>
          {cargandoTipos ? (
            <div className="text-center py-8 text-gray-400">Cargando tipos...</div>
          ) : tipos.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Tu empresa no tiene tipos habilitados. Contactá al Centro Islámico del Uruguay.</p>
          ) : (
            tipos.map(t => (
              <button key={t.id} onClick={() => seleccionarTipo(t)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-certia-green hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <span className="font-bold text-certia-green text-sm bg-certia-green/10 px-2 py-0.5 rounded">{t.codigo}</span>
                  <div>
                    <p className="font-medium text-gray-800">{t.nombre}</p>
                    {t.descripcion && <p className="text-xs text-gray-500 mt-0.5">{t.descripcion}</p>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Paso 1: Datos del formulario */}
      {paso === 1 && tipoCert && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-certia-green text-sm bg-certia-green/10 px-2 py-0.5 rounded">{tipoCert.codigo}</span>
            <span className="font-medium text-gray-800">{tipoCert.nombre}</span>
          </div>

          {/* Comprobante de pago en mismo paso */}
          <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Comprobante de pago <span className="text-gray-400 font-normal">(opcional, PDF/JPG/PNG, máx. 5 MB)</span></p>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={e => setArchivoComprobante(e.target.files[0])}
              className="text-sm text-gray-600"
            />
            {archivoComprobante && (
              <p className="text-xs text-certia-green font-medium">📎 {archivoComprobante.name}</p>
            )}
          </div>

          {(tipoCert.camposFormulario || []).map(campo => (
            <div key={campo.nombre}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {campo.label}
                {campo.requerido && <span className="text-red-500 ml-1">*</span>}
              </label>
              {campo.tipo === 'textarea' ? (
                <textarea
                  rows={3}
                  value={datosFormulario[campo.nombre] || ''}
                  onChange={e => setDatosFormulario(d => ({ ...d, [campo.nombre]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green resize-none"
                  placeholder={campo.placeholder || ''}
                />
              ) : campo.tipo === 'select' ? (
                <select
                  value={datosFormulario[campo.nombre] || ''}
                  onChange={e => setDatosFormulario(d => ({ ...d, [campo.nombre]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green"
                >
                  <option value="">— Seleccionar —</option>
                  {(campo.opciones || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={campo.tipo || 'text'}
                  value={datosFormulario[campo.nombre] || ''}
                  onChange={e => setDatosFormulario(d => ({ ...d, [campo.nombre]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green"
                  placeholder={campo.placeholder || ''}
                />
              )}
            </div>
          ))}
          <div className="flex gap-3 justify-end pt-2">
            {!renovacionDeId && (
              <button onClick={() => setPaso(0)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">← Volver</button>
            )}
            <button
              onClick={() => { if (validarPaso1()) setPaso(2); else toast.error('Completá los campos obligatorios.'); }}
              className="px-4 py-2 text-sm bg-certia-green text-white rounded-lg hover:bg-certia-green-dark"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Paso 2: Confirmación */}
      {paso === 2 && tipoCert && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Confirmar solicitud</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-32 shrink-0">Tipo:</span>
              <span className="font-medium text-gray-800">{tipoCert.codigo} — {tipoCert.nombre}</span>
            </div>
            {renovacionDeId && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Tipo:</span>
                <span className="text-blue-600 font-medium">Renovación</span>
              </div>
            )}
            {Object.entries(datosFormulario).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0 capitalize">{k.replace(/_/g, ' ')}:</span>
                <span className="text-gray-800">{String(v)}</span>
              </div>
            ))}
            {archivoComprobante && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Comprobante:</span>
                <span className="text-certia-green">📎 {archivoComprobante.name}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Al enviar, un operador del Centro Islámico del Uruguay revisará la solicitud y te notificará por email.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setPaso(1)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">← Volver</button>
            <button
              onClick={() => mutCrear.mutate()}
              disabled={mutCrear.isPending}
              className="px-6 py-2 text-sm bg-certia-green text-white font-medium rounded-lg hover:bg-certia-green-dark disabled:opacity-60"
            >
              {mutCrear.isPending ? 'Enviando...' : renovacionDeId ? 'Enviar renovación' : 'Enviar solicitud'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
