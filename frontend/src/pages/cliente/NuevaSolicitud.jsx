import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const PASOS = ['Tipo', 'Datos', 'Adjunto', 'Confirmar'];

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(0);
  const [tipoCertId, setTipoCertId] = useState('');
  const [tipoCert, setTipoCert] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState({});
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const { data: tipos = [], isLoading: cargandoTipos } = useQuery({
    queryKey: ['mis-tipos'],
    queryFn: () => api.get('/tipos').then(r => r.data),
  });

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
    return requeridos.every(c => datosFormulario[c.nombre]?.trim());
  }

  const mutCrear = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('tipoCertId', tipoCertId);
      form.append('datosFormulario', JSON.stringify(datosFormulario));
      if (archivoComprobante) form.append('comprobante', archivoComprobante);
      const { data } = await api.post('/solicitudes', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success('Solicitud enviada correctamente.');
      navigate(`/cliente/solicitudes/${data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al enviar la solicitud.'),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Nueva solicitud</h1>

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
            <p className="text-center py-8 text-gray-500">Tu empresa no tiene tipos habilitados aún. Contactá al Centro Islámico del Uruguay.</p>
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
            <button onClick={() => setPaso(0)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">← Volver</button>
            <button
              onClick={() => { if (validarPaso1()) setPaso(2); else toast.error('Completá los campos obligatorios.'); }}
              className="px-4 py-2 text-sm bg-certia-green text-white rounded-lg hover:bg-certia-green-dark"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Paso 2: Comprobante de pago */}
      {paso === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Comprobante de pago</h2>
          <p className="text-sm text-gray-500">
            Adjuntá el comprobante de pago del arancel correspondiente (PDF, JPG o PNG, máx. 5 MB).
            Este paso es opcional — podés adjuntarlo luego.
          </p>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={e => setArchivoComprobante(e.target.files[0])}
              className="text-sm text-gray-600"
            />
            {archivoComprobante && (
              <p className="mt-2 text-sm text-certia-green font-medium">{archivoComprobante.name}</p>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setPaso(1)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">← Volver</button>
            <button onClick={() => setPaso(3)} className="px-4 py-2 text-sm bg-certia-green text-white rounded-lg hover:bg-certia-green-dark">
              {archivoComprobante ? 'Continuar →' : 'Omitir por ahora →'}
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Confirmación */}
      {paso === 3 && tipoCert && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Confirmar solicitud</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-32 shrink-0">Tipo:</span>
              <span className="font-medium text-gray-800">{tipoCert.codigo} — {tipoCert.nombre}</span>
            </div>
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
            Al enviar la solicitud, un operador del Centro Islámico del Uruguay la revisará y te notificará sobre su estado por email.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setPaso(2)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">← Volver</button>
            <button
              onClick={() => mutCrear.mutate()}
              disabled={mutCrear.isPending || subiendo}
              className="px-6 py-2 text-sm bg-certia-green text-white font-medium rounded-lg hover:bg-certia-green-dark disabled:opacity-60"
            >
              {mutCrear.isPending ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
