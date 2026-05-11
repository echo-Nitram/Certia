const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const crypto = require('crypto');

const prisma = new PrismaClient();

const EVENTOS_VALIDOS = [
  'solicitud.creada',
  'solicitud.estado_cambiado',
  'certificado.finalizado',
  'certificado.vencido',
  'cliente.creado',
];

async function listar(req, res) {
  const webhooks = await prisma.webhook.findMany({
    include: {
      creadoPor: { select: { nombre: true } },
      _count: { select: { entregas: true } },
    },
    orderBy: { creadoEn: 'desc' },
  });
  return res.json(webhooks);
}

async function obtener(req, res) {
  const wh = await prisma.webhook.findUnique({
    where: { id: req.params.id },
    include: {
      entregas: { orderBy: { disparadoEn: 'desc' }, take: 50 },
    },
  });
  if (!wh) return res.status(404).json({ error: 'Webhook no encontrado.' });
  return res.json(wh);
}

async function crear(req, res) {
  const { url, eventos, secretToken, activo = true } = req.body;
  if (!url || !eventos?.length) {
    return res.status(400).json({ error: 'url y eventos requeridos.' });
  }

  const eventosInvalidos = eventos.filter(e => !EVENTOS_VALIDOS.includes(e));
  if (eventosInvalidos.length) {
    return res.status(400).json({ error: `Eventos inválidos: ${eventosInvalidos.join(', ')}` });
  }

  const wh = await prisma.webhook.create({
    data: { url, eventos, secretToken: secretToken || null, activo, creadoPorId: req.user.id },
  });
  return res.status(201).json(wh);
}

async function actualizar(req, res) {
  const { url, eventos, secretToken, activo } = req.body;
  const data = {};
  if (url !== undefined) data.url = url;
  if (eventos !== undefined) data.eventos = eventos;
  if (secretToken !== undefined) data.secretToken = secretToken;
  if (activo !== undefined) data.activo = activo;

  const wh = await prisma.webhook.update({ where: { id: req.params.id }, data });
  return res.json(wh);
}

async function eliminar(req, res) {
  await prisma.webhook.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
}

async function probar(req, res) {
  const wh = await prisma.webhook.findUnique({ where: { id: req.params.id } });
  if (!wh) return res.status(404).json({ error: 'Webhook no encontrado.' });

  const payload = {
    evento: 'test',
    timestamp: new Date().toISOString(),
    certia_version: '3.0',
    datos: { mensaje: 'Payload de prueba desde CERTIA v3.' },
  };

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (wh.secretToken) {
      const firma = crypto.createHmac('sha256', wh.secretToken).update(JSON.stringify(payload)).digest('hex');
      headers['X-CERTIA-Signature'] = firma;
    }

    const res2 = await axios.post(wh.url, payload, { headers, timeout: 10000 });
    return res.json({ ok: true, httpStatus: res2.status });
  } catch (err) {
    return res.json({ ok: false, error: err.message, httpStatus: err.response?.status || null });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, probar };
