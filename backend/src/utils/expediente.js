const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generarNExpediente() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const prefijo = `CERT-${anio}${mes}-`;

  // Cuenta cuántos expedientes hay este mes para obtener el siguiente número
  const count = await prisma.solicitud.count({
    where: {
      nExpediente: { startsWith: prefijo },
    },
  });

  const numero = String(count + 1).padStart(4, '0');
  return `${prefijo}${numero}`;
}

module.exports = { generarNExpediente };
