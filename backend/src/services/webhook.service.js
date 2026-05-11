const axios = require('axios');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function buildPayload(evento, datos) {
  return {
    evento,
    timestamp: new Date().toISOString(),
    certia_version: '3.0',
    datos,
  };
}

function firmarPayload(payload, secret) {
  const body = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

async function disparar(evento, datos) {
  const webhooks = await prisma.webhook.findMany({
    where: { activo: true },
  });

  for (const wh of webhooks) {
    const eventos = Array.isArray(wh.eventos) ? wh.eventos : [];
    if (!eventos.includes(evento)) continue;

    const payload = buildPayload(evento, datos);
    dispararConReintentos(wh, payload, evento);
  }
}

async function dispararConReintentos(wh, payload, evento, intentoActual = 1) {
  const delays = [0, 5000, 30000, 300000]; // 0s, 5s, 30s, 5min
  const delay = delays[intentoActual - 1] || 0;

  if (delay > 0) await new Promise(r => setTimeout(r, delay));

  let httpStatus = null;
  let error = null;
  let exito = false;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (wh.secretToken) {
      headers['X-CERTIA-Signature'] = firmarPayload(payload, wh.secretToken);
    }

    const res = await axios.post(wh.url, payload, { headers, timeout: 10000 });
    httpStatus = res.status;
    exito = res.status >= 200 && res.status < 300;
  } catch (err) {
    httpStatus = err.response?.status || null;
    error = err.message;
  }

  await prisma.webhookEntrega.create({
    data: {
      webhookId: wh.id,
      evento,
      payload,
      httpStatus,
      exito,
      intentos: intentoActual,
      error,
    },
  });

  if (!exito && intentoActual < 4) {
    dispararConReintentos(wh, payload, evento, intentoActual + 1);
  }
}

module.exports = { disparar };
