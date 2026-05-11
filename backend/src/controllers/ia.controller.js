const iaService = require('../services/ia.service');

async function generarPlantilla(req, res) {
  if (!req.file) return res.status(400).json({ error: 'PDF de referencia requerido.' });

  try {
    const resultado = await iaService.analizarPdfConIA(req.file.buffer);
    return res.json(resultado);
  } catch (err) {
    console.error('[IA]', err);
    return res.status(500).json({ error: err.message || 'Error al procesar el PDF con IA.' });
  }
}

module.exports = { generarPlantilla };
