const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function listar(req, res) {
  const { activo, busqueda, page = 1, limit = 20 } = req.query;
  const where = {};
  if (activo !== undefined) where.activo = activo === 'true';
  if (busqueda) {
    where.OR = [
      { nombreEmpresa: { contains: busqueda, mode: 'insensitive' } },
      { email: { contains: busqueda, mode: 'insensitive' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [total, clientes] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where,
      include: {
        tiposHabilitados: { include: { tipoCert: { select: { codigo: true, nombre: true } } } },
        _count: { select: { solicitudes: true } },
      },
      orderBy: { creadoEn: 'desc' },
      skip,
      take: parseInt(limit),
    }),
  ]);

  return res.json({ total, page: parseInt(page), limit: parseInt(limit), data: clientes });
}

async function obtener(req, res) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: req.params.id },
    include: {
      tiposHabilitados: { include: { tipoCert: true } },
      creadoPor: { select: { nombre: true, email: true } },
    },
  });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
  return res.json(cliente);
}

async function crear(req, res) {
  const { nombreEmpresa, email, password, tiposHabilitados = [] } = req.body;
  if (!nombreEmpresa || !email || !password) {
    return res.status(400).json({ error: 'nombreEmpresa, email y password son requeridos.' });
  }

  const existe = await prisma.cliente.findUnique({ where: { email } });
  if (existe) return res.status(409).json({ error: 'Ya existe un cliente con ese email.' });

  const passwordHash = await bcrypt.hash(password, 12);

  const cliente = await prisma.cliente.create({
    data: {
      nombreEmpresa,
      email,
      passwordHash,
      creadoPorId: req.user.id,
      tiposHabilitados: {
        create: tiposHabilitados.map(tipoCertId => ({
          tipoCertId,
          habilitadoPor: req.user.id,
        })),
      },
    },
    include: { tiposHabilitados: { include: { tipoCert: true } } },
  });

  return res.status(201).json(cliente);
}

async function actualizar(req, res) {
  const { nombreEmpresa, email, password, activo } = req.body;

  const data = {};
  if (nombreEmpresa !== undefined) data.nombreEmpresa = nombreEmpresa;
  if (email !== undefined) data.email = email;
  if (activo !== undefined) data.activo = activo;
  if (password) data.passwordHash = await bcrypt.hash(password, 12);

  const cliente = await prisma.cliente.update({
    where: { id: req.params.id },
    data,
  });
  return res.json(cliente);
}

async function toggleTipoCert(req, res) {
  const { id } = req.params;
  const { tipoCertId, habilitar } = req.body;

  if (!tipoCertId || habilitar === undefined) {
    return res.status(400).json({ error: 'tipoCertId y habilitar (boolean) requeridos.' });
  }

  if (habilitar) {
    await prisma.clienteTipoCert.upsert({
      where: { clienteId_tipoCertId: { clienteId: id, tipoCertId } },
      update: { habilitadoPor: req.user.id, habilitadoEn: new Date() },
      create: { clienteId: id, tipoCertId, habilitadoPor: req.user.id },
    });
  } else {
    await prisma.clienteTipoCert.deleteMany({ where: { clienteId: id, tipoCertId } });
  }

  return res.json({ ok: true, tipoCertId, habilitado: habilitar });
}

async function eliminar(req, res) {
  await prisma.cliente.update({ where: { id: req.params.id }, data: { activo: false } });
  return res.json({ ok: true });
}

module.exports = { listar, obtener, crear, actualizar, toggleTipoCert, eliminar };
