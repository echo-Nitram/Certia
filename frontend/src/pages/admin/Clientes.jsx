import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function Clientes() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombreEmpresa: '', email: '', password: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => api.get('/clientes').then(r => r.data),
  });

  const { data: tipos = [] } = useQuery({
    queryKey: ['tipos'],
    queryFn: () => api.get('/tipos').then(r => r.data),
  });

  const mutCrear = useMutation({
    mutationFn: (body) => api.post('/clientes', body),
    onSuccess: () => { toast.success('Cliente creado.'); qc.invalidateQueries(['clientes']); setModal(false); setForm({ nombreEmpresa: '', email: '', password: '' }); },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al crear cliente.'),
  });

  const mutToggleTipo = useMutation({
    mutationFn: ({ clienteId, tipoCertId, habilitar }) => api.patch(`/clientes/${clienteId}/tipos`, { tipoCertId, habilitar }),
    onSuccess: () => qc.invalidateQueries(['clientes']),
    onError: (err) => toast.error(err.response?.data?.error || 'Error.'),
  });

  const mutDesactivar = useMutation({
    mutationFn: (id) => api.delete(`/clientes/${id}`),
    onSuccess: () => { toast.success('Cliente desactivado.'); qc.invalidateQueries(['clientes']); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button onClick={() => setModal(true)} className="bg-certia-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark transition">
          + Nuevo cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? <div className="text-center py-12 text-gray-400">Cargando...</div> : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Empresa</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tipos habilitados</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data?.map(c => (
                <tr key={c.id} className={`hover:bg-gray-50 ${!c.activo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.nombreEmpresa}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{c.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {tipos.map(t => {
                        const hab = c.tiposHabilitados?.some(h => h.tipoCertId === t.id);
                        return (
                          <button
                            key={t.id}
                            onClick={() => mutToggleTipo.mutate({ clienteId: c.id, tipoCertId: t.id, habilitar: !hab })}
                            className={`px-2 py-0.5 text-xs rounded-full border transition ${hab ? 'bg-certia-green text-white border-certia-green' : 'bg-white text-gray-500 border-gray-300 hover:border-certia-green'}`}
                          >
                            {t.codigo}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.activo && (
                      <button onClick={() => { if (confirm('¿Desactivar este cliente?')) mutDesactivar.mutate(c.id); }}
                        className="text-xs text-red-500 hover:text-red-700">Desactivar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Nuevo cliente</h2>
            {[['nombreEmpresa', 'Nombre de empresa', 'text'], ['email', 'Email', 'email'], ['password', 'Contraseña inicial', 'password']].map(([k, l, t]) => (
              <div key={k}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green" />
              </div>
            ))}
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={() => mutCrear.mutate(form)} disabled={mutCrear.isPending}
                className="px-4 py-2 text-sm bg-certia-green text-white rounded-lg hover:bg-certia-green-dark disabled:opacity-60">
                {mutCrear.isPending ? 'Creando...' : 'Crear cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
