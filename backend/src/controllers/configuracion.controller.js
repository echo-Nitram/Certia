const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listar(req, res) {
  const configs = await prisma.configuracion.findMany({ orderBy: { clave: 'asc' } });
  return res.json(configs);
}

async function actualizar(req, res) {
  const { clave } = req.params;
  const { valor } = req.body;
  if (valor === undefined) return res.status(400).json({ error: 'valor requerido.' });

  const config = await prisma.configuracion.upsert({
    where: { clave },
    update: { valor, actualizadoPorId: req.user.id },
    create: { clave, valor, actualizadoPorId: req.user.id },
  });

  await prisma.auditoria.create({
    data: {
      adminId: req.user.id,
      entidad: 'Configuracion',
      accion: 'actualizar',
      datosNuevos: { clave, valor },
      ipOrigen: req.ip,
    },
  });

  return res.json(config);
}

async function actualizarMultiple(req, res) {
  const { configs } = req.body;
  if (!Array.isArray(configs)) return res.status(400).json({ error: 'configs debe ser un array.' });

  const resultados = [];
  for (const { clave, valor } of configs) {
    if (!clave || valor === undefined) continue;
    const c = await prisma.configuracion.upsert({
      where: { clave },
      update: { valor, actualizadoPorId: req.user.id },
      create: { clave, valor, actualizadoPorId: req.user.id },
    });
    resultados.push(c);
  }

  return res.json(resultados);
}

module.exports = { listar, actualizar, actualizarMultiple };
