const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/email.service');
const { emitirAlCliente } = require('../services/socket.service');

const prisma = new PrismaClient();

// GET /api/solicitudes/:id/comentarios
async function listar(req, res) {
  const { id } = req.params;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    select: { clienteId: true },
  });
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' });

  // Cliente solo puede ver sus propias solicitudes y solo comentarios VISIBLE
  if (req.user.rol === 'cliente') {
    if (solicitud.clienteId !== req.user.id) return res.status(403).json({ error: 'Acceso denegado.' });

    const comentarios = await prisma.comentario.findMany({
      where: { solicitudId: id, tipo: 'VISIBLE' },
      include: { admin: { select: { nombre: true } } },
      orderBy: { creadoEn: 'asc' },
    });
    return res.json(comentarios);
  }

  // Admin ve todos
  const comentarios = await prisma.comentario.findMany({
    where: { solicitudId: id },
    include: { admin: { select: { nombre: true } } },
    orderBy: { creadoEn: 'asc' },
  });
  return res.json(comentarios);
}

// POST /api/solicitudes/:id/comentarios
async function crear(req, res) {
  const { id } = req.params;
  const { texto, tipo = 'INTERNO' } = req.body;

  if (!texto?.trim()) return res.status(400).json({ error: 'El texto del comentario es requerido.' });
  if (!['INTERNO', 'VISIBLE'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo debe ser INTERNO o VISIBLE.' });
  }

  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    include: { cliente: true },
  });
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' });

  const comentario = await prisma.comentario.create({
    data: {
      solicitudId: id,
      adminId: req.user.id,
      tipo,
      texto: texto.trim(),
    },
    include: { admin: { select: { nombre: true } } },
  });

  // Si es VISIBLE: notificar al cliente por email y WebSocket
  if (tipo === 'VISIBLE') {
    await emailService.enviarCambioEstado(
      solicitud.cliente.email,
      solicitud.cliente.nombreEmpresa,
      solicitud.nExpediente,
      'COMENTARIO',
      texto
    );
    emitirAlCliente(solicitud.clienteId, 'solicitud:comentario_visible', {
      solicitudId: id,
      nExpediente: solicitud.nExpediente,
      texto,
      autor: req.user.nombre,
    });
  }

  return res.status(201).json(comentario);
}

module.exports = { listar, crear };
