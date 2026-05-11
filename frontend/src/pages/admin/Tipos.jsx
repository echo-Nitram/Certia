import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function Tipos() {
  const qc = useQueryClient();
  const [seleccionado, setSeleccionado] = useState(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [wizardIA, setWizardIA] = useState(false);
  const [archivoIA, setArchivoIA] = useState(null);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [analizandoIA, setAnalizandoIA] = useState(false);

  const { data: tipos = [], isLoading } = useQuery({
    queryKey: ['tipos-admin'],
    queryFn: () => api.get('/tipos').then(r => r.data),
  });

  const mutToggle = useMutation({
    mutationFn: ({ id, activo }) => api.put(`/tipos/${id}`, { activo }),
    onSuccess: () => qc.invalidateQueries(['tipos-admin']),
    onError: (err) => toast.error(err.response?.data?.error || 'Error.'),
  });

  const mutGuardarPlantilla = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/tipos/${id}`, body),
    onSuccess: () => { toast.success('Plantilla guardada.'); qc.invalidateQueries(['tipos-admin']); },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al guardar.'),
  });

  const mutCrearDesdeIA = useMutation({
    mutationFn: (body) => api.post('/tipos', body),
    onSuccess: () => { toast.success('Tipo creado desde IA.'); qc.invalidateQueries(['tipos-admin']); setWizardIA(false); setResultadoIA(null); },
    onError: (err) => toast.error(err.response?.data?.error || 'Error.'),
  });

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Tipos de certificado</h1>
        <div className="flex gap-2">
          <button onClick={() => setWizardIA(true)} className="bg-certia-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-gold-dark transition">
            🤖 Generar con IA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista */}
        <div className="space-y-2">
          {isLoading ? <div className="text-center py-8 text-gray-400">Cargando...</div> : tipos.map(t => (
            <div key={t.id}
              onClick={() => setSeleccionado(t)}
              className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition ${seleccionado?.id === t.id ? 'border-certia-green ring-2 ring-certia-green/20' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-certia-green text-sm">{t.codigo}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="font-medium text-gray-800">{t.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
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
              {t.descripcion && <p className="text-xs text-gray-500 mt-1">{t.descripcion}</p>}
            </div>
          ))}
        </div>

        {/* Editor */}
        {seleccionado && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">{seleccionado.codigo} — Editor de plantilla</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: 400 }}>
              <Editor
                language="html"
                value={seleccionado.plantillaHtml}
                onChange={v => setSeleccionado(s => ({ ...s, plantillaHtml: v }))}
                options={{ minimap: { enabled: false }, fontSize: 12, wordWrap: 'on' }}
              />
            </div>
            <button
              onClick={() => mutGuardarPlantilla.mutate({ id: seleccionado.id, plantillaHtml: seleccionado.plantillaHtml })}
              disabled={mutGuardarPlantilla.isPending}
              className="bg-certia-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-certia-green-dark transition disabled:opacity-60"
            >
              {mutGuardarPlantilla.isPending ? 'Guardando...' : 'Guardar plantilla'}
            </button>
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
