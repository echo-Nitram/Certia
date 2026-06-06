import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const GRUPOS = [
  { clave: 'nombre_institucion', label: 'Nombre de la institución', tipo: 'text' },
  { clave: 'cert_expiry_days', label: 'Días de vigencia de certificados', tipo: 'number' },
  { clave: 'notify_days_before', label: 'Días de aviso previo al vencimiento (separados por coma)', tipo: 'text' },
  { clave: 'renewal_enable_days', label: 'Días antes del vencimiento para habilitar renovación', tipo: 'number' },
  { clave: 'otp_expiry_minutes', label: 'Expiración del OTP (minutos)', tipo: 'number' },
  { clave: 'otp_max_intentos', label: 'Máximo de intentos OTP fallidos', tipo: 'number' },
];

const CLAVES_SECRETAS = ['anthropic_api_key'];

export default function Configuracion() {
  const [valores, setValores] = useState({});
  const [mostrarSecreto, setMostrarSecreto] = useState({});

  const { data: configs = [] } = useQuery({
    queryKey: ['configuracion'],
    queryFn: () => api.get('/configuracion').then(r => r.data),
  });

  useEffect(() => {
    const map = {};
    for (const c of configs) map[c.clave] = c.valor;
    setValores(map);
  }, [configs]);

  const mutGuardar = useMutation({
    mutationFn: () => api.put('/configuracion/bulk', {
      configs: Object.entries(valores).map(([clave, valor]) => ({ clave, valor })),
    }),
    onSuccess: () => toast.success('Configuración guardada.'),
    onError: (err) => toast.error(err.response?.data?.error || 'Error al guardar.'),
  });

  function CampoSecreto({ clave, label, placeholder }) {
    const visible = mostrarSecreto[clave];
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
          <input
            type={visible ? 'text' : 'password'}
            value={valores[clave] || ''}
            onChange={e => setValores(v => ({ ...v, [clave]: e.target.value }))}
            placeholder={placeholder}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green font-mono"
          />
          <button
            type="button"
            onClick={() => setMostrarSecreto(s => ({ ...s, [clave]: !s[clave] }))}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
          >
            {visible ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Configuración del sistema</h1>

      {/* Integraciones IA */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">Integraciones</h2>
        <CampoSecreto
          clave="anthropic_api_key"
          label="Anthropic API Key (para Wizard IA de plantillas)"
          placeholder="sk-ant-api03-..."
        />
      </div>

      {/* Configuración general */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">General</h2>
        {GRUPOS.map(({ clave, label, tipo }) => (
          <div key={clave}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={tipo}
              value={valores[clave] || ''}
              onChange={e => setValores(v => ({ ...v, [clave]: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => mutGuardar.mutate()}
        disabled={mutGuardar.isPending}
        className="bg-certia-green text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark transition disabled:opacity-60"
      >
        {mutGuardar.isPending ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </div>
  );
}
