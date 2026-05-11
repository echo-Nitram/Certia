import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const EVENTOS = ['solicitud.creada','solicitud.estado_cambiado','certificado.finalizado','certificado.vencido','cliente.creado','renovacion.iniciada'];

export default function Webhooks() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ url: '', eventos: [], secretToken: '', activo: true });

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.get('/webhooks').then(r => r.data),
  });

  const mutCrear = useMutation({
    mutationFn: (body) => api.post('/webhooks', body),
    onSuccess: () => { toast.success('Webhook creado.'); qc.invalidateQueries(['webhooks']); setModal(false); },
    onError: (err) => toast.error(err.response?.data?.error || 'Error.'),
  });

  const mutToggle = useMutation({
    mutationFn: ({ id, activo }) => api.put(`/webhooks/${id}`, { activo }),
    onSuccess: () => qc.invalidateQueries(['webhooks']),
  });

  const mutEliminar = useMutation({
    mutationFn: (id) => api.delete(`/webhooks/${id}`),
    onSuccess: () => { toast.success('Webhook eliminado.'); qc.invalidateQueries(['webhooks']); },
  });

  const mutProbar = useMutation({
    mutationFn: (id) => api.post(`/webhooks/${id}/probar`),
    onSuccess: (r) => toast[r.data.ok ? 'success' : 'error'](r.data.ok ? `Prueba exitosa (${r.data.httpStatus})` : `Prueba fallida: ${r.data.error}`),
  });

  function toggleEvento(ev) {
    setForm(f => ({ ...f, eventos: f.eventos.includes(ev) ? f.eventos.filter(e => e !== ev) : [...f.eventos, ev] }));
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
        <button onClick={() => setModal(true)} className="bg-certia-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark transition">
          + Nuevo webhook
        </button>
      </div>

      {isLoading ? <div className="text-center py-8 text-gray-400">Cargando...</div> : (
        <div className="space-y-3">
          {webhooks.length === 0 && <p className="text-center py-8 text-gray-400">Sin webhooks configurados.</p>}
          {webhooks.map(wh => (
            <div key={wh.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{wh.url}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(wh.eventos || []).map(e => <span key={e} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{e}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${wh.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {wh.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <button onClick={() => mutProbar.mutate(wh.id)} className="text-xs text-blue-600 hover:underline">Probar</button>
                  <button onClick={() => mutToggle.mutate({ id: wh.id, activo: !wh.activo })} className="text-xs text-gray-500 hover:text-gray-700">
                    {wh.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => { if (confirm('¿Eliminar?')) mutEliminar.mutate(wh.id); }} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Nuevo webhook</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL endpoint (POST)</label>
              <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://mi-sistema.com/webhook"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Eventos</label>
              <div className="space-y-2">
                {EVENTOS.map(ev => (
                  <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.eventos.includes(ev)} onChange={() => toggleEvento(ev)} className="accent-certia-green" />
                    <span className="text-gray-700">{ev}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secret token (opcional)</label>
              <input type="text" value={form.secretToken} onChange={e => setForm(f => ({ ...f, secretToken: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-certia-green" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={() => mutCrear.mutate(form)} disabled={!form.url || !form.eventos.length || mutCrear.isPending}
                className="px-4 py-2 text-sm bg-certia-green text-white rounded-lg hover:bg-certia-green-dark disabled:opacity-60">
                {mutCrear.isPending ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
