const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listar(req, res) {
  const { activo } = req.query;
  const where = {};
  if (activo !== undefined) where.activo = activo === 'true';

  // Si es cliente, solo los habilitados para él
  if (req.user.rol === 'cliente') {
    const habilitados = await prisma.clienteTipoCert.findMany({
      where: { clienteId: req.user.id },
      select: { tipoCertId: true },
    });
    where.id = { in: habilitados.map(h => h.tipoCertId) };
    where.activo = true;
  }

  const tipos = await prisma.tipoCertificado.findMany({
    where,
    orderBy: { codigo: 'asc' },
    include: { _count: { select: { solicitudes: true, versiones: true } } },
  });
  return res.json(tipos);
}

async function obtener(req, res) {
  const tipo = await prisma.tipoCertificado.findUnique({
    where: { id: req.params.id },
    include: {
      versiones: { orderBy: { version: 'desc' }, include: { creadoPor: { select: { nombre: true } } } },
    },
  });
  if (!tipo) return res.status(404).json({ error: 'Tipo no encontrado.' });
  return res.json(tipo);
}

async function crear(req, res) {
  const { codigo, nombre, descripcion, camposFormulario, plantillaHtml, variablesMapeadas } = req.body;
  if (!codigo || !nombre || !camposFormulario || !plantillaHtml) {
    return res.status(400).json({ error: 'codigo, nombre, camposFormulario y plantillaHtml son requeridos.' });
  }

  const tipo = await prisma.tipoCertificado.create({
    data: {
      codigo,
      nombre,
      descripcion,
      camposFormulario,
      plantillaHtml,
      variablesMapeadas: variablesMapeadas || {},
      activo: false,
      versionActual: 1,
      versiones: {
        create: {
          html: plantillaHtml,
          version: 1,
          nota: 'Versión inicial',
          creadoPorId: req.user.id,
        },
      },
    },
  });
  return res.status(201).json(tipo);
}

async function actualizar(req, res) {
  const { id } = req.params;
  const { nombre, descripcion, camposFormulario, plantillaHtml, variablesMapeadas, activo } = req.body;

  const tipoActual = await prisma.tipoCertificado.findUnique({ where: { id } });
  if (!tipoActual) return res.status(404).json({ error: 'Tipo no encontrado.' });

  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (descripcion !== undefined) data.descripcion = descripcion;
  if (camposFormulario !== undefined) data.camposFormulario = camposFormulario;
  if (variablesMapeadas !== undefined) data.variablesMapeadas = variablesMapeadas;
  if (activo !== undefined) data.activo = activo;

  // Si cambia la plantilla, crear nueva versión
  if (plantillaHtml && plantillaHtml !== tipoActual.plantillaHtml) {
    const nuevaVersion = tipoActual.versionActual + 1;
    data.plantillaHtml = plantillaHtml;
    data.versionActual = nuevaVersion;

    await prisma.versionPlantilla.create({
      data: {
        tipoCertId: id,
        html: plantillaHtml,
        version: nuevaVersion,
        nota: req.body.notaVersion || null,
        creadoPorId: req.user.id,
      },
    });
  }

  const tipo = await prisma.tipoCertificado.update({ where: { id }, data });
  return res.json(tipo);
}

async function eliminar(req, res) {
  await prisma.tipoCertificado.update({ where: { id: req.params.id }, data: { activo: false } });
  return res.json({ ok: true });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
