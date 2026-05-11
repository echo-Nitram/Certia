const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /verify/:token — pública, sin autenticación
async function verificar(req, res) {
  const { token } = req.params;

  const solicitud = await prisma.solicitud.findUnique({
    where: { qrToken: token },
    select: {
      nExpediente: true,
      estadoActual: true,
      fechaEmision: true,
      fechaVencimiento: true,
      pdfFirmadoUrl: true,
      qrToken: true,
      cliente: { select: { nombreEmpresa: true } },
      tipoCert: { select: { codigo: true, nombre: true } },
    },
  });

  if (!solicitud) {
    return res.status(404).json({ error: 'Certificado no encontrado. Código QR inválido.' });
  }

  const vigente = solicitud.estadoActual === 'FINALIZADO';

  return res.json({
    nExpediente: solicitud.nExpediente,
    titular: solicitud.cliente.nombreEmpresa,
    tipoCertificado: { codigo: solicitud.tipoCert.codigo, nombre: solicitud.tipoCert.nombre },
    fechaEmision: solicitud.fechaEmision,
    fechaVencimiento: solicitud.fechaVencimiento,
    estado: vigente ? 'Vigente' : solicitud.estadoActual === 'VENCIDO' ? 'Vencido' : solicitud.estadoActual,
    urlDescarga: solicitud.pdfFirmadoUrl,
  });
}

module.exports = { verificar };
