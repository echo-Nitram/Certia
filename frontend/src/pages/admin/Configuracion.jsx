import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const GRUPOS = [
  { clave: 'cert_expiry_days', label: 'Días de vigencia de certificados', tipo: 'number' },
  { clave: 'notify_days_before', label: 'Días de aviso previo al vencimiento (separados por coma)', tipo: 'text' },
  { clave: 'renewal_enable_days', label: 'Días antes del vencimiento para habilitar renovación', tipo: 'number' },
  { clave: 'otp_expiry_minutes', label: 'Expiración del OTP (minutos)', tipo: 'number' },
  { clave: 'otp_max_intentos', label: 'Máximo de intentos OTP fallidos', tipo: 'number' },
  { clave: 'nombre_institucion', label: 'Nombre de la institución', tipo: 'text' },
];

export default function Configuracion() {
  const [valores, setValores] = useState({});

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

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Configuración del sistema</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
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
        <button
          onClick={() => mutGuardar.mutate()}
          disabled={mutGuardar.isPending}
          className="bg-certia-green text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark transition disabled:opacity-60"
        >
          {mutGuardar.isPending ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}
