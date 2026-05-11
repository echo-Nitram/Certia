const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listar(req, res) {
  const { entidad, accion, adminId, desde, hasta, page = 1, limit = 50 } = req.query;

  const where = {};
  if (entidad) where.entidad = entidad;
  if (accion) where.accion = { contains: accion, mode: 'insensitive' };
  if (adminId) where.adminId = adminId;
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, registros] = await Promise.all([
    prisma.auditoria.count({ where }),
    prisma.auditoria.findMany({
      where,
      include: { admin: { select: { nombre: true, email: true } } },
      orderBy: { fecha: 'desc' },
      skip,
      take: parseInt(limit),
    }),
  ]);

  return res.json({ total, page: parseInt(page), limit: parseInt(limit), data: registros });
}

module.exports = { listar };
