const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/email.service');
const { emitirAlCliente, emitirAlAdmin } = require('../services/socket.service');

const prisma = new PrismaClient();

async function vencimientoJob() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const notifyDays = (process.env.NOTIFY_DAYS_BEFORE || '30,15,7')
    .split(',')
    .map(d => parseInt(d.trim()));

  // ── 1. Marcar como VENCIDO los que vencieron hoy ──────────────────────────
  const vencidosHoy = await prisma.solicitud.findMany({
    where: {
      estadoActual: 'FINALIZADO',
      fechaVencimiento: {
        gte: hoy,
        lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    include: { cliente: true, tipoCert: true },
  });

  for (const sol of vencidosHoy) {
    await prisma.solicitud.update({
      where: { id: sol.id },
      data: { estadoActual: 'VENCIDO' },
    });
    await prisma.historialEstado.create({
      data: {
        solicitudId: sol.id,
        estadoAnterior: 'FINALIZADO',
        estadoNuevo: 'VENCIDO',
        motivoInterno: 'Vencimiento automático por cron job',
      },
    });
  }

  if (vencidosHoy.length > 0) {
    const admins = await prisma.admin.findMany({ where: { activo: true } });
    for (const admin of admins) {
      await emailService.enviarResumenVencidosAdmin(admin.email, vencidosHoy);
    }
    emitirAlAdmin('cert:vencimiento_resumen', { cantidad: vencidosHoy.length });
  }

  // ── 2. Avisos anticipados ──────────────────────────────────────────────────
  for (const dias of notifyDays) {
    const fechaObjetivo = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000);
    const fechaFin = new Date(fechaObjetivo.getTime() + 24 * 60 * 60 * 1000);

    const proximos = await prisma.solicitud.findMany({
      where: {
        estadoActual: 'FINALIZADO',
        fechaVencimiento: { gte: fechaObjetivo, lt: fechaFin },
      },
      include: { cliente: true },
    });

    for (const sol of proximos) {
      await emailService.enviarAvisoVencimiento(
        sol.cliente.email,
        sol.cliente.nombreEmpresa,
        sol.nExpediente,
        dias,
        sol.fechaVencimiento
      );

      emitirAlCliente(sol.clienteId, 'certificado:vencimiento', {
        nExpediente: sol.nExpediente,
        diasRestantes: dias,
        fechaVencimiento: sol.fechaVencimiento,
      });

      // A 7 días también notificar al admin
      if (dias <= 7) {
        emitirAlAdmin('cert:vencimiento_urgente', {
          nExpediente: sol.nExpediente,
          cliente: sol.cliente.nombreEmpresa,
          diasRestantes: dias,
        });
      }
    }
  }

  console.log(`[CRON] Vencimientos procesados. Vencidos hoy: ${vencidosHoy.length}`);
}

module.exports = vencimientoJob;
