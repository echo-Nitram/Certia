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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Clientes</h1>
        <button onClick={() => setModal(true)} className="c-btn c-btn--primary c-btn--sm">
          + Nuevo cliente
        </button>
      </div>

      {isLoading ? (
        <div className="c-card text-center text-gray-400" style={{ padding: 48 }}>Cargando...</div>
      ) : (
        <div className="c-card" style={{ padding: 0 }}>
          <div className="c-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th className="hidden md:table-cell">Email</th>
                  <th>Tipos habilitados</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.data?.map(c => (
                  <tr key={c.id} className={!c.activo ? 'opacity-50' : ''}>
                    <td className="font-medium text-gray-800">{c.nombreEmpresa}</td>
                    <td className="text-gray-500 hidden md:table-cell">{c.email}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {tipos.map(t => {
                          const hab = c.tiposHabilitados?.some(h => h.tipoCertId === t.id);
                          return (
                            <button
                              key={t.id}
                              onClick={() => mutToggleTipo.mutate({ clienteId: c.id, tipoCertId: t.id, habilitar: !hab })}
                              className={hab ? 'c-btn c-btn--primary c-btn--sm' : 'c-btn c-btn--ghost c-btn--sm'}
                              style={{ borderRadius: '9999px', padding: '2px 10px', fontSize: 12 }}
                            >
                              {t.codigo}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <span className={`c-badge ${c.activo ? 'c-badge--FINALIZADO' : 'c-badge--VENCIDO'}`}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {c.activo && (
                        <button
                          onClick={() => { if (confirm('¿Desactivar este cliente?')) mutDesactivar.mutate(c.id); }}
                          className="c-btn c-btn--danger c-btn--sm"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="c-card" style={{ width: '100%', maxWidth: 440 }}>
            <div className="c-card__head">
              <span className="c-section-title">Nuevo cliente</span>
            </div>
            <div className="c-card__body space-y-4">
              {[['nombreEmpresa', 'Nombre de empresa', 'text'], ['email', 'Email', 'email'], ['password', 'Contraseña inicial', 'password']].map(([k, l, t]) => (
                <div key={k} className="c-field">
                  <label className="c-label">{l}</label>
                  <input
                    type={t}
                    value={form[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    className="c-input"
                  />
                </div>
              ))}
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setModal(false)} className="c-btn c-btn--ghost c-btn--sm">Cancelar</button>
                <button
                  onClick={() => mutCrear.mutate(form)}
                  disabled={mutCrear.isPending}
                  className="c-btn c-btn--primary c-btn--sm"
                >
                  {mutCrear.isPending ? 'Creando...' : 'Crear cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
