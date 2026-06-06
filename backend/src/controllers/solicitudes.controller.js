const { PrismaClient } = require('@prisma/client');
const { generarNExpediente } = require('../utils/expediente');
const { generarQrToken } = require('../utils/qr');
const pdfService = require('../services/pdf.service');
const cloudinaryService = require('../services/cloudinary.service');
const emailService = require('../services/email.service');
const webhookService = require('../services/webhook.service');
const { emitirAlAdmin, emitirAlCliente } = require('../services/socket.service');
const { uploadComprobante, uploadPdfFirmado } = require('../middleware/upload.middleware');

const prisma = new PrismaClient();

// Estados terminales y reglas de transición
const ESTADOS_TERMINALES = ['FINALIZADO', 'RECHAZADO'];
const REQUIERE_MOTIVO = ['OBSERVADO', 'RECHAZADO'];

// Transiciones válidas por estado actual
const TRANSICIONES = {
  PENDIENTE: ['EN_REVISION', 'RECHAZADO'],
  EN_REVISION: ['OBSERVADO', 'PAGO_VALIDADO', 'RECHAZADO'],
  OBSERVADO: ['EN_REVISION', 'RECHAZADO'],
  PAGO_VALIDADO: ['EN_ELABORACION', 'RECHAZADO'],
  EN_ELABORACION: ['REVISION_PDF'],
  REVISION_PDF: ['PENDIENTE_FIRMA', 'EN_ELABORACION'],
  PENDIENTE_FIRMA: ['FINALIZADO', 'RECHAZADO'],
  FINALIZADO: [],
  RECHAZADO: [],
  VENCIDO: [],
};

async function notificarCambioEstado(solicitud, estadoAnterior, estadoNuevo, motivo, io) {
  const cliente = solicitud.cliente;
  const tipoCert = solicitud.tipoCert;

  // Email y WS al cliente (excepto REVISION_PDF que solo va al admin)
  const estadosSinEmailCliente = ['REVISION_PDF'];
  if (!estadosSinEmailCliente.includes(estadoNuevo)) {
    await emailService.enviarCambioEstado(
      cliente.email,
      cliente.nombreEmpresa,
      solicitud.nExpediente,
      estadoNuevo,
      REQUIERE_MOTIVO.includes(estadoNuevo) ? motivo : null
    );
    emitirAlCliente(solicitud.clienteId, 'solicitud:estado_cambiado', {
      solicitudId: solicitud.id,
      nExpediente: solicitud.nExpediente,
      estadoAnterior,
      estadoNuevo,
      motivo: REQUIERE_MOTIVO.includes(estadoNuevo) ? motivo : null,
    });

    if (estadoNuevo === 'OBSERVADO') {
      emitirAlCliente(solicitud.clienteId, 'solicitud:observada', {
        nExpediente: solicitud.nExpediente,
        motivo,
      });
    }
  }

  // Email y WS al admin según estado
  if (estadoNuevo === 'REVISION_PDF') {
    const admins = await prisma.admin.findMany({ where: { activo: true } });
    for (const admin of admins) {
      await emailService.enviarBorradorListoAdmin(admin.email, solicitud.nExpediente, cliente.nombreEmpresa);
    }
    emitirAlAdmin('pdf:borrador_listo', { solicitudId: solicitud.id, nExpediente: solicitud.nExpediente });
  }

  if (estadoNuevo === 'PENDIENTE_FIRMA') {
    const admins = await prisma.admin.findMany({ where: { activo: true } });
    for (const admin of admins) {
      await emailService.enviarPdfParaFirmarAdmin(admin.email, solicitud.nExpediente, cliente.nombreEmpresa);
    }
    emitirAlAdmin('solicitud:pendiente_firma', { solicitudId: solicitud.id, nExpediente: solicitud.nExpediente });
  }
}

// ── GET /api/solicitudes ──────────────────────────────────────────────────────
async function listar(req, res) {
  const { estado, tipoCertId, clienteId, desde, hasta, busqueda, page = 1, limit = 20 } = req.query;

  const where = {};

  if (req.user.rol === 'cliente') {
    where.clienteId = req.user.id;
  } else {
    if (clienteId) where.clienteId = clienteId;
  }

  if (estado) where.estadoActual = estado;
  if (tipoCertId) where.tipoCertId = tipoCertId;
  if (desde || hasta) {
    where.creadoEn = {};
    if (desde) where.creadoEn.gte = new Date(desde);
    if (hasta) where.creadoEn.lte = new Date(hasta);
  }
  if (busqueda) {
    where.OR = [
      { nExpediente: { contains: busqueda, mode: 'insensitive' } },
      { cliente: { nombreEmpresa: { contains: busqueda, mode: 'insensitive' } } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [total, solicitudes] = await Promise.all([
    prisma.solicitud.count({ where }),
    prisma.solicitud.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombreEmpresa: true, email: true } },
        tipoCert: { select: { id: true, codigo: true, nombre: true } },
        _count: { select: { historialEstados: true, comentarios: true } },
      },
      orderBy: { creadoEn: 'desc' },
      skip,
      take: parseInt(limit),
    }),
  ]);

  // Corrección retroactiva para datos guardados como string
  const dataArreglada = solicitudes.map(s => {
    if (typeof s.datosFormulario === 'string') {
      try { s.datosFormulario = JSON.parse(s.datosFormulario); } catch (e) {}
    }
    return s;
  });

  return res.json({ total, page: parseInt(page), limit: parseInt(limit), data: dataArreglada });
}

// ── GET /api/solicitudes/:id ──────────────────────────────────────────────────
async function obtener(req, res) {
  const { id } = req.params;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    include: {
      cliente: true,
      tipoCert: true,
      historialEstados: { orderBy: { fecha: 'asc' }, include: { admin: { select: { nombre: true } } } },
      adjuntos: true,
      solicitudOrigen: { select: { id: true, nExpediente: true } },
      renovaciones: { select: { id: true, nExpediente: true, estadoActual: true } },
    },
  });

  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' });

  // Cliente solo puede ver sus propias solicitudes
  if (req.user.rol === 'cliente' && solicitud.clienteId !== req.user.id) {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }

  // Filtrar historial: cliente no ve motivoInterno
  if (req.user.rol === 'cliente') {
    solicitud.historialEstados = solicitud.historialEstados.map(h => ({
      ...h,
      motivoInterno: undefined,
    }));
  }

  // Corrección retroactiva para datos guardados como string
  if (typeof solicitud.datosFormulario === 'string') {
    try { solicitud.datosFormulario = JSON.parse(solicitud.datosFormulario); } catch(e) {}
  }

  return res.json(solicitud);
}

// ── POST /api/solicitudes ─────────────────────────────────────────────────────
async function crear(req, res, next) {
  try {
    let { tipoCertId, datosFormulario, solicitudOrigenId } = req.body;

    if (typeof datosFormulario === 'string') {
      try {
        datosFormulario = JSON.parse(datosFormulario);
      } catch (e) {
        return res.status(400).json({ error: 'Formato de datosFormulario inválido.' });
      }
    }

    if (!tipoCertId || !datosFormulario) {
      return res.status(400).json({ error: 'tipoCertId y datosFormulario requeridos.' });
    }

    const clienteId = req.user.rol === 'cliente' ? req.user.id : req.body.clienteId;
    if (!clienteId) return res.status(400).json({ error: 'clienteId requerido.' });

    // Validar solicitudOrigenId si se trata de una renovación
    if (solicitudOrigenId) {
      const origen = await prisma.solicitud.findUnique({ where: { id: solicitudOrigenId } });
      if (!origen) {
        return res.status(404).json({ error: 'Solicitud origen no encontrada.' });
      }
      if (origen.clienteId !== clienteId) {
        return res.status(403).json({ error: 'No tenés permiso para renovar esa solicitud.' });
      }
      if (!['FINALIZADO', 'VENCIDO'].includes(origen.estadoActual)) {
        return res.status(400).json({ error: 'Solo se pueden renovar solicitudes finalizadas o vencidas.' });
      }
    }

    // Verificar que el tipo esté habilitado para este cliente
    const habilitado = await prisma.clienteTipoCert.findUnique({
      where: { clienteId_tipoCertId: { clienteId, tipoCertId } },
    });
    if (!habilitado) return res.status(403).json({ error: 'Tipo de certificado no habilitado para este cliente.' });

    const tipoCert = await prisma.tipoCertificado.findUnique({ where: { id: tipoCertId } });
    if (!tipoCert || !tipoCert.activo) return res.status(404).json({ error: 'Tipo de certificado no disponible.' });

    // Subir comprobante PRIMERO para no dejar registros huérfanos si falla Cloudinary
    let comprobanteUrl = null;
    if (req.file) {
      comprobanteUrl = await cloudinaryService.subirBuffer(req.file.buffer, {
        carpeta: 'certia/comprobantes',
        mimeType: req.file.mimetype,
        nombreOriginal: req.file.originalname,
      });
    }

    let nExpediente = await generarNExpediente();
    let solicitud;
    let intentos = 0;

    while (intentos < 5) {
      try {
        solicitud = await prisma.solicitud.create({
          data: {
            nExpediente,
            clienteId,
            tipoCertId,
            datosFormulario,
            estadoActual: 'PENDIENTE',
            solicitudOrigenId: solicitudOrigenId || null,
            historialEstados: {
              create: {
                estadoAnterior: null,
                estadoNuevo: 'PENDIENTE',
                motivoCliente: 'Solicitud enviada por el cliente',
              }
            },
            ...(comprobanteUrl ? {
              adjuntos: {
                create: {
                  tipo: 'comprobante_pago',
                  archivoUrl: comprobanteUrl,
                  nombreOriginal: req.file.originalname,
                  mimeType: req.file.mimetype,
                }
              }
            } : {})
          },
          include: { cliente: true, tipoCert: true },
        });
        break; // Éxito
      } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('nExpediente')) {
          intentos++;
          nExpediente = await generarNExpediente();
        } else {
          throw error;
        }
      }
    }

    if (!solicitud) {
      return res.status(500).json({ error: 'No se pudo generar un número de expediente único tras varios intentos.' });
    }

    // Notificaciones
    await emailService.enviarConfirmacionSolicitud(
      solicitud.cliente.email,
      solicitud.cliente.nombreEmpresa,
      nExpediente,
      tipoCert.nombre
    ).catch(e => console.error('[Notif] Error enviando email cliente:', e));

    const admins = await prisma.admin.findMany({ where: { activo: true } });
    for (const admin of admins) {
      await emailService.enviarAlertaNuevaSolicitud(admin.email, nExpediente, solicitud.cliente.nombreEmpresa, tipoCert.nombre).catch(e => {});
    }

    emitirAlAdmin('solicitud:nueva', {
      solicitudId: solicitud.id,
      nExpediente,
      cliente: solicitud.cliente.nombreEmpresa,
      tipoCert: tipoCert.nombre,
    });

    // Webhook solicitud creada
    await webhookService.disparar('solicitud.creada', {
      expediente: nExpediente,
      cliente: { nombre: solicitud.cliente.nombreEmpresa, email: solicitud.cliente.email },
      tipo_certificado: { codigo: tipoCert.codigo, nombre: tipoCert.nombre },
    }).catch(e => console.error('[Webhook] Error:', e));

    // Webhook renovación si aplica
    if (solicitudOrigenId) {
      const origen = await prisma.solicitud.findUnique({ where: { id: solicitudOrigenId }, select: { nExpediente: true } });
      if (origen) {
        await webhookService.disparar('renovacion.iniciada', {
          expediente_nuevo: nExpediente,
          expediente_origen: origen.nExpediente,
          cliente: { nombre: solicitud.cliente.nombreEmpresa, email: solicitud.cliente.email },
          tipo_certificado: { codigo: tipoCert.codigo, nombre: tipoCert.nombre },
        }).catch(e => {});
      }
    }

    return res.status(201).json(solicitud);
  } catch (err) {
    if (next) return next(err);
    console.error('[Solicitudes.crear]', err);
    return res.status(500).json({ error: 'Error interno al crear la solicitud.' });
  }
}

// ── PATCH /api/solicitudes/:id/estado ─────────────────────────────────────────
async function cambiarEstado(req, res) {
  const { id } = req.params;
  const { estadoNuevo, motivo } = req.body;

  if (!estadoNuevo) return res.status(400).json({ error: 'estadoNuevo requerido.' });

  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    include: { cliente: true, tipoCert: true },
  });
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' });

  const estadoActual = solicitud.estadoActual;

  // Bloquear estados terminales
  if (ESTADOS_TERMINALES.includes(estadoActual)) {
    return res.status(400).json({ error: `La solicitud está en estado terminal (${estadoActual}) y no puede modificarse.` });
  }

  // Validar transición
  const transicionesValidas = TRANSICIONES[estadoActual] || [];
  if (!transicionesValidas.includes(estadoNuevo)) {
    return res.status(400).json({
      error: `Transición inválida: ${estadoActual} → ${estadoNuevo}. Transiciones permitidas: ${transicionesValidas.join(', ')}.`,
    });
  }

  // Motivo obligatorio
  if (REQUIERE_MOTIVO.includes(estadoNuevo) && !motivo?.trim()) {
    return res.status(400).json({ error: `El motivo es obligatorio para el estado ${estadoNuevo}.` });
  }

  const adminId = req.user.rol === 'admin' ? req.user.id : null;

  const [, historial] = await prisma.$transaction([
    prisma.solicitud.update({
      where: { id },
      data: { estadoActual: estadoNuevo, actualizadoEn: new Date() },
    }),
    prisma.historialEstado.create({
      data: {
        solicitudId: id,
        estadoAnterior: estadoActual,
        estadoNuevo,
        adminId,
        motivoInterno: req.user.rol === 'admin' ? motivo : null,
        motivoCliente: REQUIERE_MOTIVO.includes(estadoNuevo) ? motivo : null,
      },
    }),
  ]);

  const solicitudActualizada = { ...solicitud, estadoActual: estadoNuevo };

  // Notificar
  await notificarCambioEstado(solicitudActualizada, estadoActual, estadoNuevo, motivo);

  // Trigger automático: EN_ELABORACION → generar PDF borrador → REVISION_PDF
  if (estadoNuevo === 'EN_ELABORACION') {
    await generarYSubirBorrador(solicitudActualizada);
  }

  // Webhook en cambio de estado
  await webhookService.disparar('solicitud.estado_cambiado', {
    expediente: solicitud.nExpediente,
    estado_anterior: estadoActual,
    estado_nuevo: estadoNuevo,
    cliente: { nombre: solicitud.cliente.nombreEmpresa, email: solicitud.cliente.email },
  });

  return res.json({ ok: true, estadoNuevo, historialId: historial.id });
}

async function generarYSubirBorrador(solicitud) {
  try {
    const solCompleta = await prisma.solicitud.findUnique({
      where: { id: solicitud.id },
      include: { cliente: true, tipoCert: true },
    });

    const pdfBuffer = await pdfService.generarPdfBorrador(
      solCompleta.tipoCert.plantillaHtml,
      solCompleta.datosFormulario,
      solCompleta,
      solCompleta.cliente,
      solCompleta.tipoCert
    );

    const url = await cloudinaryService.subirBuffer(pdfBuffer, {
      carpeta: 'certia/borradores',
      mimeType: 'application/pdf',
    });

    await prisma.solicitud.update({
      where: { id: solicitud.id },
      data: { pdfBorradorUrl: url, estadoActual: 'REVISION_PDF', actualizadoEn: new Date() },
    });

    await prisma.historialEstado.create({
      data: {
        solicitudId: solicitud.id,
        estadoAnterior: 'EN_ELABORACION',
        estadoNuevo: 'REVISION_PDF',
        motivoInterno: 'PDF borrador generado automáticamente',
      },
    });

    // Notificar al admin
    const admins = await prisma.admin.findMany({ where: { activo: true } });
    for (const admin of admins) {
      await emailService.enviarBorradorListoAdmin(admin.email, solCompleta.nExpediente, solCompleta.cliente.nombreEmpresa);
    }
    emitirAlAdmin('pdf:borrador_listo', { solicitudId: solicitud.id, nExpediente: solCompleta.nExpediente });
  } catch (err) {
    console.error('[PDF] Error generando borrador:', err);
    // Registrar el error en el historial para que sea visible en el panel
    try {
      await prisma.historialEstado.create({
        data: {
          solicitudId: solicitud.id,
          estadoAnterior: 'EN_ELABORACION',
          estadoNuevo: 'EN_ELABORACION',
          motivoInterno: `Error al generar PDF: ${err.message}`,
        },
      });
      // Notificar a los admins del fallo
      const admins = await prisma.admin.findMany({ where: { activo: true } });
      for (const admin of admins) {
        await emailService.enviar({
          to: admin.email,
          subject: `[CERTIA] Error generando PDF — ${solicitud.nExpediente}`,
          html: `<p>No se pudo generar el borrador PDF para la solicitud <strong>${solicitud.nExpediente}</strong>.</p><p>Error: ${err.message}</p><p>La solicitud quedó en estado EN_ELABORACION. Ingresá al panel para revisarla manualmente.</p>`,
        });
      }
    } catch (e2) {
      console.error('[PDF] Error al registrar fallo de generación:', e2);
    }
  }
}

// ── POST /api/solicitudes/:id/pdf-firmado ─────────────────────────────────────
async function subirPdfFirmado(req, res) {
  const { id } = req.params;

  if (!req.file) return res.status(400).json({ error: 'Archivo PDF requerido.' });

  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    include: { cliente: true, tipoCert: true },
  });
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' });
  if (solicitud.estadoActual !== 'PENDIENTE_FIRMA') {
    return res.status(400).json({ error: 'La solicitud no está en estado PENDIENTE_FIRMA.' });
  }

  // Descargar PDF original para comparación de tamaño
  let pdfOriginalBuffer = null;
  if (solicitud.pdfSinFirmaUrl) {
    try {
      const axios = require('axios');
      const resp = await axios.get(solicitud.pdfSinFirmaUrl, { responseType: 'arraybuffer' });
      pdfOriginalBuffer = Buffer.from(resp.data);
    } catch {}
  }

  const validacion = await pdfService.validarFirmaDigital(req.file.buffer, pdfOriginalBuffer);
  if (!validacion.valido) {
    await emailService.enviarFirmaInvalidaAdmin(
      req.user.email,
      solicitud.nExpediente,
      validacion.error
    );
    emitirAlAdmin('firma:validacion_fallida', { solicitudId: id, error: validacion.error });
    return res.status(422).json({ error: validacion.error });
  }

  // Agregar marca de agua + QR
  const pdfConMarcaAgua = await pdfService.agregarMarcaDeAgua(req.file.buffer);
  const qrToken = generarQrToken();
  const pdfFinal = await pdfService.agregarQrAlPdf(pdfConMarcaAgua, qrToken);

  // Subir a Cloudinary
  const urlFirmado = await cloudinaryService.subirBuffer(pdfFinal, {
    carpeta: 'certia/firmados',
    mimeType: 'application/pdf',
  });

  // Calcular vencimiento
  const expiryDays = parseInt(process.env.CERT_EXPIRY_DAYS || '365');
  const fechaEmision = new Date();
  const fechaVencimiento = new Date(fechaEmision.getTime() + expiryDays * 24 * 60 * 60 * 1000);

  await prisma.solicitud.update({
    where: { id },
    data: {
      pdfFirmadoUrl: urlFirmado,
      qrToken,
      estadoActual: 'FINALIZADO',
      fechaEmision,
      fechaVencimiento,
      actualizadoEn: new Date(),
    },
  });

  await prisma.historialEstado.create({
    data: {
      solicitudId: id,
      estadoAnterior: 'PENDIENTE_FIRMA',
      estadoNuevo: 'FINALIZADO',
      adminId: req.user.id,
      motivoInterno: 'PDF firmado validado y certificado emitido',
    },
  });

  // Notificaciones finales
  await emailService.enviarCertificadoFinalizado(
    solicitud.cliente.email,
    solicitud.cliente.nombreEmpresa,
    solicitud.nExpediente,
    urlFirmado,
    qrToken
  );
  emitirAlCliente(solicitud.clienteId, 'certificado:emitido', {
    nExpediente: solicitud.nExpediente,
    urlDescarga: urlFirmado,
    qrToken,
  });
  emitirAlAdmin('firma:validacion_exitosa', { solicitudId: id, nExpediente: solicitud.nExpediente });

  // Webhook
  await webhookService.disparar('certificado.finalizado', {
    expediente: solicitud.nExpediente,
    cliente: { nombre: solicitud.cliente.nombreEmpresa, email: solicitud.cliente.email },
    tipo_certificado: { codigo: solicitud.tipoCert.codigo, nombre: solicitud.tipoCert.nombre },
    fecha_emision: fechaEmision.toISOString().split('T')[0],
    fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
    url_verificacion: `${process.env.APP_URL}/verify/${qrToken}`,
  });

  return res.json({ ok: true, qrToken, urlDescarga: urlFirmado });
}

// ── POST /api/solicitudes/:id/pdf-sin-firma ────────────────────────────────────
async function generarPdfSinFirma(req, res) {
  const { id } = req.params;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    include: { cliente: true, tipoCert: true },
  });
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' });
  if (solicitud.estadoActual !== 'REVISION_PDF' && solicitud.estadoActual !== 'PENDIENTE_FIRMA') {
    return res.status(400).json({ error: 'El PDF sin firma solo está disponible en REVISION_PDF o PENDIENTE_FIRMA.' });
  }

  // Si ya existe, devolver URL
  if (solicitud.pdfSinFirmaUrl) return res.json({ url: solicitud.pdfSinFirmaUrl });

  const pdfBuffer = await pdfService.generarPdfBorrador(
    solicitud.tipoCert.plantillaHtml,
    solicitud.datosFormulario,
    solicitud,
    solicitud.cliente,
    solicitud.tipoCert
  );

  const url = await cloudinaryService.subirBuffer(pdfBuffer, {
    carpeta: 'certia/sin-firma',
    mimeType: 'application/pdf',
  });

  await prisma.solicitud.update({ where: { id }, data: { pdfSinFirmaUrl: url } });

  return res.json({ url });
}

// ── PATCH /api/solicitudes/:id/datos ─────────────────────────────────────────
async function editarDatos(req, res) {
  const { id } = req.params;
  const nuevosDatos = req.body;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    include: { cliente: true, tipoCert: true },
  });
  if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada.' });

  if (solicitud.clienteId !== req.user.id) {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  if (solicitud.estadoActual !== 'OBSERVADO') {
    return res.status(400).json({ error: 'Solo se pueden editar solicitudes en estado OBSERVADO.' });
  }
  if (!nuevosDatos || Object.keys(nuevosDatos).length === 0) {
    return res.status(400).json({ error: 'Los nuevos datos son requeridos.' });
  }

  await prisma.$transaction([
    prisma.solicitud.update({
      where: { id },
      data: { datosFormulario: nuevosDatos, estadoActual: 'EN_REVISION', actualizadoEn: new Date() },
    }),
    prisma.historialEstado.create({
      data: {
        solicitudId: id,
        estadoAnterior: 'OBSERVADO',
        estadoNuevo: 'EN_REVISION',
        motivoCliente: 'Cliente corrigió y reenvió la solicitud',
      },
    }),
  ]);

  const solicitudActualizada = { ...solicitud, estadoActual: 'EN_REVISION' };
  await notificarCambioEstado(solicitudActualizada, 'OBSERVADO', 'EN_REVISION', null);
  emitirAlCliente(solicitud.clienteId, 'solicitud:reenviada', {
    solicitudId: id,
    nExpediente: solicitud.nExpediente,
  });

  return res.json({ ok: true });
}

module.exports = { listar, obtener, crear, cambiarEstado, editarDatos, subirPdfFirmado, generarPdfSinFirma };