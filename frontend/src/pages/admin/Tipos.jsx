import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

function formatFecha(d) {
  return d ? new Date(d).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

export default function Tipos() {
  const qc = useQueryClient();
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [plantillaEdit, setPlantillaEdit] = useState('');
  const [showHistorial, setShowHistorial] = useState(false);
  const [wizardIA, setWizardIA] = useState(false);
  const [archivoIA, setArchivoIA] = useState(null);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [analizandoIA, setAnalizandoIA] = useState(false);

  const { data: tipos = [], isLoading } = useQuery({
    queryKey: ['tipos-admin'],
    queryFn: () => api.get('/tipos').then(r => r.data),
  });

  const { data: tipoDetalle } = useQuery({
    queryKey: ['tipo-detalle', seleccionadoId],
    queryFn: () => api.get(`/tipos/${seleccionadoId}`).then(r => r.data),
    enabled: !!seleccionadoId,
    onSuccess: (data) => setPlantillaEdit(data.plantillaHtml || ''),
  });

  const mutToggle = useMutation({
    mutationFn: ({ id, activo }) => api.put(`/tipos/${id}`, { activo }),
    onSuccess: () => qc.invalidateQueries(['tipos-admin']),
    onError: (err) => toast.error(err.response?.data?.error || 'Error.'),
  });

  const mutGuardarPlantilla = useMutation({
    mutationFn: ({ id, plantillaHtml }) => api.put(`/tipos/${id}`, { plantillaHtml }),
    onSuccess: () => {
      toast.success('Plantilla guardada.');
      qc.invalidateQueries(['tipos-admin']);
      qc.invalidateQueries(['tipo-detalle', seleccionadoId]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al guardar.'),
  });

  const mutCrearDesdeIA = useMutation({
    mutationFn: (body) => api.post('/tipos', body),
    onSuccess: () => {
      toast.success('Tipo creado desde IA.');
      qc.invalidateQueries(['tipos-admin']);
      setWizardIA(false);
      setResultadoIA(null);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error.'),
  });

  function seleccionar(t) {
    setSeleccionadoId(t.id);
    setPlantillaEdit(t.plantillaHtml || '');
    setShowHistorial(false);
  }

  function restaurarVersion(v) {
    setPlantillaEdit(v.html);
    toast('Versión cargada en el editor. Guardá para confirmar.', { icon: '↺' });
  }

  async function analizarConIA() {
    if (!archivoIA) return toast.error('Seleccioná un PDF.');
    setAnalizandoIA(true);
    const form = new FormData();
    form.append('pdf', archivoIA);
    try {
      const { data } = await api.post('/ia/generar-plantilla', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResultadoIA(data);
      toast.success('Análisis completado.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al analizar el PDF.');
    } finally { setAnalizandoIA(false); }
  }

  const versiones = tipoDetalle?.versiones || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Tipos de certificado</h1>
        <button onClick={() => setWizardIA(true)} className="bg-certia-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-gold-dark transition">
          🤖 Generar con IA
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de tipos */}
        <div className="lg:col-span-1 space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Cargando...</div>
          ) : tipos.map(t => (
            <div key={t.id}
              onClick={() => seleccionar(t)}
              className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition ${seleccionadoId === t.id ? 'border-certia-green ring-2 ring-certia-green/20' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <span className="font-bold text-certia-green text-sm">{t.codigo}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="font-medium text-gray-800 text-sm">{t.nombre}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); mutToggle.mutate({ id: t.id, activo: !t.activo }); }}
                    className="text-xs text-gray-500 border border-gray-300 px-2 py-0.5 rounded hover:border-certia-green hover:text-certia-green transition"
                  >
                    {t.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
              {t.descripcion && <p className="text-xs text-gray-500 mt-1 truncate">{t.descripcion}</p>}
            </div>
          ))}
        </div>

        {/* Editor + Preview */}
        {seleccionadoId && tipoDetalle && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800">{tipoDetalle.codigo} — Editor de plantilla</h2>
                <span className="text-xs text-gray-400">v{tipoDetalle.versionActual}</span>
              </div>

              {/* Editor + Preview en split */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">HTML</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: 480 }}>
                    <Editor
                      language="html"
                      value={plantillaEdit}
                      onChange={v => setPlantillaEdit(v || '')}
                      options={{ minimap: { enabled: false }, fontSize: 12, wordWrap: 'on', scrollBeyondLastLine: false }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Preview</p>
                  <iframe
                    srcDoc={plantillaEdit}
                    className="w-full border border-gray-200 rounded-lg bg-white"
                    style={{ height: 480 }}
                    sandbox="allow-same-origin"
                    title="Preview plantilla"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => mutGuardarPlantilla.mutate({ id: seleccionadoId, plantillaHtml: plantillaEdit })}
                  disabled={mutGuardarPlantilla.isPending || plantillaEdit === tipoDetalle.plantillaHtml}
                  className="bg-certia-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark transition disabled:opacity-60"
                >
                  {mutGuardarPlantilla.isPending ? 'Guardando...' : 'Guardar plantilla'}
                </button>
                {plantillaEdit !== tipoDetalle.plantillaHtml && (
                  <button
                    onClick={() => setPlantillaEdit(tipoDetalle.plantillaHtml)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Descartar cambios
                  </button>
                )}
              </div>
            </div>

            {/* Historial de versiones */}
            {versiones.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setShowHistorial(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <span>Historial de versiones ({versiones.length})</span>
                  <span className="text-gray-400">{showHistorial ? '▲' : '▼'}</span>
                </button>
                {showHistorial && (
                  <div className="overflow-x-auto border-t border-gray-100">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium text-gray-500 text-xs">Versión</th>
                          <th className="px-4 py-2.5 text-left font-medium text-gray-500 text-xs">Fecha</th>
                          <th className="px-4 py-2.5 text-left font-medium text-gray-500 text-xs">Admin</th>
                          <th className="px-4 py-2.5 text-left font-medium text-gray-500 text-xs">Nota</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {versiones.map(v => (
                          <tr key={v.id} className={`hover:bg-gray-50 ${v.version === tipoDetalle.versionActual ? 'bg-certia-green/5' : ''}`}>
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-xs font-medium text-certia-green">v{v.version}</span>
                              {v.version === tipoDetalle.versionActual && (
                                <span className="ml-2 text-xs bg-certia-green/10 text-certia-green px-1.5 py-0.5 rounded">actual</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{formatFecha(v.creadoEn)}</td>
                            <td className="px-4 py-2.5 text-gray-700 text-xs">{v.creadoPor?.nombre || '—'}</td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">{v.nota || '—'}</td>
                            <td className="px-4 py-2.5 text-right">
                              {v.version !== tipoDetalle.versionActual && (
                                <button
                                  onClick={() => restaurarVersion(v)}
                                  className="text-xs text-certia-green hover:underline"
                                >
                                  Restaurar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wizard IA */}
      {wizardIA && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">🤖 Wizard IA — Generar plantilla</h2>
              <button onClick={() => { setWizardIA(false); setResultadoIA(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {!resultadoIA ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Subí un PDF de referencia y Claude analizará su diseño para generar la plantilla HTML y los campos automáticamente.</p>
                <input type="file" accept="application/pdf" onChange={e => setArchivoIA(e.target.files[0])} className="text-sm" />
                <button onClick={analizarConIA} disabled={!archivoIA || analizandoIA}
                  className="bg-certia-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-gold-dark disabled:opacity-60 transition">
                  {analizandoIA ? 'Analizando...' : 'Analizar con IA'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Nombre sugerido</label>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{resultadoIA.nombre}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Descripción</label>
                    <p className="text-sm text-gray-600 mt-0.5">{resultadoIA.descripcion}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Campos detectados ({resultadoIA.campos?.length})</label>
                  <div className="flex flex-wrap gap-1">
                    {resultadoIA.campos?.map(c => (
                      <span key={c.nombre} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {c.label} {c.requerido ? '*' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setResultadoIA(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">← Volver</button>
                  <button
                    onClick={() => mutCrearDesdeIA.mutate({
                      codigo: `HC-IA-${Date.now().toString(36).toUpperCase()}`,
                      nombre: resultadoIA.nombre,
                      descripcion: resultadoIA.descripcion,
                      camposFormulario: resultadoIA.campos,
                      plantillaHtml: resultadoIA.html,
                      variablesMapeadas: resultadoIA.variablesMapeadas || {},
                    })}
                    disabled={mutCrearDesdeIA.isPending}
                    className="bg-certia-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark disabled:opacity-60"
                  >
                    {mutCrearDesdeIA.isPending ? 'Creando...' : 'Crear tipo de certificado'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
