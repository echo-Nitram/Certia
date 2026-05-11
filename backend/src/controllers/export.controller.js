const ExcelJS = require('exceljs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function formatFecha(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-UY');
}

function agregarMetadata(wb, adminNombre, filtros) {
  const hoja = wb.addWorksheet('Metadatos');
  hoja.addRow(['Generado por', adminNombre]);
  hoja.addRow(['Fecha de generación', new Date().toLocaleString('es-UY')]);
  hoja.addRow(['Filtros aplicados', JSON.stringify(filtros)]);
  hoja.addRow(['Sistema', 'CERTIA v3.0 — Centro Islámico del Uruguay']);
}

// GET /api/export/solicitudes
async function exportSolicitudes(req, res) {
  const { estado, tipoCertId, clienteId, desde, hasta } = req.query;

  const where = {};
  if (estado) where.estadoActual = estado;
  if (tipoCertId) where.tipoCertId = tipoCertId;
  if (clienteId) where.clienteId = clienteId;
  if (desde || hasta) {
    where.creadoEn = {};
    if (desde) where.creadoEn.gte = new Date(desde);
    if (hasta) where.creadoEn.lte = new Date(hasta);
  }

  const solicitudes = await prisma.solicitud.findMany({
    where,
    include: {
      cliente: { select: { nombreEmpresa: true, email: true } },
      tipoCert: { select: { codigo: true, nombre: true } },
      historialEstados: { orderBy: { fecha: 'asc' } },
    },
    orderBy: { creadoEn: 'desc' },
  });

  const wb = new ExcelJS.Workbook();
  const hoja = wb.addWorksheet('Solicitudes');

  hoja.columns = [
    { header: 'N° Expediente', key: 'expediente', width: 20 },
    { header: 'Cliente', key: 'cliente', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Tipo Cert.', key: 'tipo', width: 25 },
    { header: 'Estado Actual', key: 'estado', width: 20 },
    { header: 'Fecha Creación', key: 'creacion', width: 16 },
    { header: 'Fecha Emisión', key: 'emision', width: 16 },
    { header: 'Fecha Vencimiento', key: 'vencimiento', width: 18 },
  ];

  hoja.getRow(1).font = { bold: true };

  for (const s of solicitudes) {
    hoja.addRow({
      expediente: s.nExpediente,
      cliente: s.cliente.nombreEmpresa,
      email: s.cliente.email,
      tipo: `${s.tipoCert.codigo} — ${s.tipoCert.nombre}`,
      estado: s.estadoActual,
      creacion: formatFecha(s.creadoEn),
      emision: formatFecha(s.fechaEmision),
      vencimiento: formatFecha(s.fechaVencimiento),
    });
  }

  agregarMetadata(wb, req.user.nombre, { estado, tipoCertId, clienteId, desde, hasta });

  await prisma.auditoria.create({
    data: { adminId: req.user.id, entidad: 'Export', accion: 'export_solicitudes', ipOrigen: req.ip },
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=solicitudes_${Date.now()}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
}

// GET /api/export/certificados
async function exportCertificados(req, res) {
  const { desde, hasta, vigente } = req.query;

  const where = { estadoActual: { in: ['FINALIZADO', 'VENCIDO'] } };
  if (desde || hasta) {
    where.fechaEmision = {};
    if (desde) where.fechaEmision.gte = new Date(desde);
    if (hasta) where.fechaEmision.lte = new Date(hasta);
  }
  if (vigente === 'true') where.estadoActual = 'FINALIZADO';
  if (vigente === 'false') where.estadoActual = 'VENCIDO';

  const certs = await prisma.solicitud.findMany({
    where,
    include: {
      cliente: { select: { nombreEmpresa: true, email: true } },
      tipoCert: { select: { codigo: true, nombre: true } },
    },
    orderBy: { fechaEmision: 'desc' },
  });

  const wb = new ExcelJS.Workbook();
  const hoja = wb.addWorksheet('Certificados');

  hoja.columns = [
    { header: 'N° Expediente', key: 'expediente', width: 20 },
    { header: 'Titular', key: 'titular', width: 30 },
    { header: 'Tipo', key: 'tipo', width: 25 },
    { header: 'Fecha Emisión', key: 'emision', width: 16 },
    { header: 'Fecha Vencimiento', key: 'vencimiento', width: 18 },
    { header: 'Estado Vigencia', key: 'vigencia', width: 16 },
    { header: 'QR Token', key: 'qr', width: 35 },
  ];
  hoja.getRow(1).font = { bold: true };

  for (const c of certs) {
    hoja.addRow({
      expediente: c.nExpediente,
      titular: c.cliente.nombreEmpresa,
      tipo: `${c.tipoCert.codigo} — ${c.tipoCert.nombre}`,
      emision: formatFecha(c.fechaEmision),
      vencimiento: formatFecha(c.fechaVencimiento),
      vigencia: c.estadoActual === 'FINALIZADO' ? 'Vigente' : 'Vencido',
      qr: c.qrToken || '',
    });
  }

  agregarMetadata(wb, req.user.nombre, { desde, hasta, vigente });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=certificados_${Date.now()}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
}

// GET /api/export/auditoria
async function exportAuditoria(req, res) {
  const { accion, adminId, desde, hasta } = req.query;

  const where = {};
  if (accion) where.accion = { contains: accion, mode: 'insensitive' };
  if (adminId) where.adminId = adminId;
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta);
  }

  const registros = await prisma.auditoria.findMany({
    where,
    include: { admin: { select: { nombre: true, email: true } } },
    orderBy: { fecha: 'desc' },
  });

  const wb = new ExcelJS.Workbook();
  const hoja = wb.addWorksheet('Auditoría');

  hoja.columns = [
    { header: 'Fecha', key: 'fecha', width: 20 },
    { header: 'Admin', key: 'admin', width: 25 },
    { header: 'Email Admin', key: 'email', width: 30 },
    { header: 'Entidad', key: 'entidad', width: 20 },
    { header: 'Acción', key: 'accion', width: 25 },
    { header: 'IP', key: 'ip', width: 18 },
  ];
  hoja.getRow(1).font = { bold: true };

  for (const r of registros) {
    hoja.addRow({
      fecha: new Date(r.fecha).toLocaleString('es-UY'),
      admin: r.admin?.nombre || '—',
      email: r.admin?.email || '—',
      entidad: r.entidad,
      accion: r.accion,
      ip: r.ipOrigen || '',
    });
  }

  agregarMetadata(wb, req.user.nombre, { accion, adminId, desde, hasta });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=auditoria_${Date.now()}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
}

module.exports = { exportSolicitudes, exportCertificados, exportAuditoria };
