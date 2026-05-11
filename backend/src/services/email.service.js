const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const FROM = process.env.EMAIL_FROM || 'CERTIA <certia@centroislamico.uy>';

function baseTemplate(contenido) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #1A6B3C; color: #fff; padding: 24px 32px; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }
        .body { padding: 32px; color: #333; line-height: 1.6; }
        .footer { background: #f9f9f9; padding: 16px 32px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
        .badge-green { background: #d4edda; color: #155724; }
        .badge-yellow { background: #fff3cd; color: #856404; }
        .badge-red { background: #f8d7da; color: #721c24; }
        .btn { display: inline-block; margin-top: 16px; padding: 10px 24px; background: #1A6B3C; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; }
        .highlight { background: #f0f8f0; border-left: 4px solid #1A6B3C; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CERTIA</h1>
          <p>Centro Islámico del Uruguay — Gestión de Certificados Halal</p>
        </div>
        <div class="body">${contenido}</div>
        <div class="footer">CERTIA v3.0 — Centro Islámico del Uruguay · Este es un email automático, no responder.</div>
      </div>
    </body>
    </html>
  `;
}

async function enviar({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[EMAIL] Simulado a ${to}: ${subject}`);
    return;
  }
  await getTransporter().sendMail({ from: FROM, to, subject, html });
}

// ── Plantillas de email por evento ───────────────────────────────────────────

async function enviarOtp(email, nombre, codigo) {
  await enviar({
    to: email,
    subject: 'Código de verificación CERTIA',
    html: baseTemplate(`
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu código de verificación para acceder al panel de administración es:</p>
      <div class="highlight" style="font-size: 32px; letter-spacing: 8px; text-align: center; font-weight: bold; color: #1A6B3C;">
        ${codigo}
      </div>
      <p>Este código es válido por <strong>10 minutos</strong> y solo puede usarse una vez.</p>
      <p style="color: #999; font-size: 12px;">Si no solicitaste este código, ignorá este mensaje. No compartas este código con nadie.</p>
    `),
  });
}

async function enviarConfirmacionSolicitud(email, nombreEmpresa, nExpediente, tipoCert) {
  await enviar({
    to: email,
    subject: `Solicitud recibida — ${nExpediente}`,
    html: baseTemplate(`
      <p>Hola <strong>${nombreEmpresa}</strong>,</p>
      <p>Tu solicitud de certificado Halal ha sido recibida exitosamente.</p>
      <div class="highlight">
        <strong>Expediente:</strong> ${nExpediente}<br>
        <strong>Tipo:</strong> ${tipoCert}<br>
        <strong>Estado:</strong> <span class="badge badge-yellow">PENDIENTE DE REVISIÓN</span>
      </div>
      <p>Recibirás notificaciones por email ante cada cambio de estado. El tiempo estimado de procesamiento es de 3 a 5 días hábiles.</p>
    `),
  });
}

async function enviarAlertaNuevaSolicitud(emailAdmin, nExpediente, nombreEmpresa, tipoCert) {
  await enviar({
    to: emailAdmin,
    subject: `[CERTIA] Nueva solicitud — ${nExpediente}`,
    html: baseTemplate(`
      <p>Nueva solicitud recibida en CERTIA.</p>
      <div class="highlight">
        <strong>Expediente:</strong> ${nExpediente}<br>
        <strong>Cliente:</strong> ${nombreEmpresa}<br>
        <strong>Tipo:</strong> ${tipoCert}
      </div>
      <a href="${process.env.FRONTEND_URL}/admin/solicitudes" class="btn">Ver en el panel</a>
    `),
  });
}

async function enviarCambioEstado(email, nombreEmpresa, nExpediente, estadoNuevo, motivo) {
  const mensajes = {
    EN_REVISION: { texto: 'Tu solicitud está siendo revisada por nuestro equipo.', badge: 'badge-yellow', label: 'EN REVISIÓN' },
    OBSERVADO: { texto: `Tu solicitud requiere correcciones antes de continuar.`, badge: 'badge-yellow', label: 'OBSERVADO' },
    PAGO_VALIDADO: { texto: 'Tu comprobante de pago fue confirmado. El proceso continúa.', badge: 'badge-green', label: 'PAGO VALIDADO' },
    EN_ELABORACION: { texto: 'Estamos preparando tu certificado Halal.', badge: 'badge-green', label: 'EN ELABORACIÓN' },
    PENDIENTE_FIRMA: { texto: 'Tu certificado está siendo procesado para firma digital oficial.', badge: 'badge-yellow', label: 'PENDIENTE DE FIRMA' },
    FINALIZADO: { texto: 'Tu certificado Halal fue emitido y está disponible para descargar.', badge: 'badge-green', label: 'FINALIZADO' },
    RECHAZADO: { texto: 'Tu solicitud fue rechazada.', badge: 'badge-red', label: 'RECHAZADO' },
    VENCIDO: { texto: 'Tu certificado ha vencido. Podés iniciar una renovación desde tu portal.', badge: 'badge-red', label: 'VENCIDO' },
  };

  const info = mensajes[estadoNuevo] || { texto: `Estado actualizado a ${estadoNuevo}.`, badge: 'badge-yellow', label: estadoNuevo };

  const motivoHtml = motivo
    ? `<div class="highlight" style="border-color: #856404;"><strong>Motivo:</strong> ${motivo}</div>`
    : '';

  await enviar({
    to: email,
    subject: `Actualización solicitud ${nExpediente} — ${info.label}`,
    html: baseTemplate(`
      <p>Hola <strong>${nombreEmpresa}</strong>,</p>
      <p>${info.texto}</p>
      <div class="highlight">
        <strong>Expediente:</strong> ${nExpediente}<br>
        <strong>Estado:</strong> <span class="badge ${info.badge}">${info.label}</span>
      </div>
      ${motivoHtml}
      <a href="${process.env.FRONTEND_URL}/cliente/solicitudes" class="btn">Ver en mi portal</a>
    `),
  });
}

async function enviarBorradorListoAdmin(emailAdmin, nExpediente, nombreEmpresa) {
  await enviar({
    to: emailAdmin,
    subject: `[CERTIA] Borrador PDF listo — ${nExpediente}`,
    html: baseTemplate(`
      <p>El PDF borrador del certificado está listo para revisión.</p>
      <div class="highlight">
        <strong>Expediente:</strong> ${nExpediente}<br>
        <strong>Cliente:</strong> ${nombreEmpresa}
      </div>
      <a href="${process.env.FRONTEND_URL}/admin/solicitudes/${nExpediente}" class="btn">Revisar PDF borrador</a>
    `),
  });
}

async function enviarPdfParaFirmarAdmin(emailAdmin, nExpediente, nombreEmpresa) {
  await enviar({
    to: emailAdmin,
    subject: `[CERTIA] PDF listo para firmar — ${nExpediente}`,
    html: baseTemplate(`
      <p>El PDF sin firma está disponible para descargar y firmar en <strong>firma.gub.uy</strong>.</p>
      <div class="highlight">
        <strong>Expediente:</strong> ${nExpediente}<br>
        <strong>Cliente:</strong> ${nombreEmpresa}
      </div>
      <p><strong>Pasos:</strong></p>
      <ol>
        <li>Descargar el PDF sin firma desde el panel de CERTIA.</li>
        <li>Ingresar a firma.gub.uy y firmar el documento.</li>
        <li>Volver al panel y subir el PDF firmado.</li>
      </ol>
      <a href="${process.env.FRONTEND_URL}/admin/solicitudes/${nExpediente}" class="btn">Ir al panel</a>
    `),
  });
}

async function enviarFirmaInvalidaAdmin(emailAdmin, nExpediente, errorDetalle) {
  await enviar({
    to: emailAdmin,
    subject: `[CERTIA] Error en validación de firma — ${nExpediente}`,
    html: baseTemplate(`
      <p>La validación del PDF firmado falló para el expediente <strong>${nExpediente}</strong>.</p>
      <div class="highlight" style="border-color: #721c24;">
        <strong>Error:</strong> ${errorDetalle}
      </div>
      <p>El estado permanece en <strong>PENDIENTE DE FIRMA</strong>. Por favor revisá el proceso en firma.gub.uy y volvé a intentar.</p>
      <a href="${process.env.FRONTEND_URL}/admin/solicitudes/${nExpediente}" class="btn">Ver solicitud</a>
    `),
  });
}

async function enviarCertificadoFinalizado(email, nombreEmpresa, nExpediente, urlDescarga, qrToken) {
  const urlVerificacion = `${process.env.APP_URL}/verify/${qrToken}`;
  await enviar({
    to: email,
    subject: `¡Certificado Halal emitido! — ${nExpediente}`,
    html: baseTemplate(`
      <p>Hola <strong>${nombreEmpresa}</strong>,</p>
      <p>Tu certificado Halal fue emitido con <strong>firma digital oficial</strong>.</p>
      <div class="highlight">
        <strong>Expediente:</strong> ${nExpediente}<br>
        <strong>Estado:</strong> <span class="badge badge-green">FINALIZADO</span>
      </div>
      <p><a href="${urlDescarga}" class="btn">Descargar certificado PDF</a></p>
      <p style="margin-top: 16px; font-size: 13px;">URL de verificación pública: <a href="${urlVerificacion}">${urlVerificacion}</a></p>
    `),
  });
}

async function enviarAvisoVencimiento(email, nombreEmpresa, nExpediente, diasRestantes, fechaVencimiento) {
  const urgente = diasRestantes <= 7;
  await enviar({
    to: email,
    subject: `${urgente ? '⚠️ URGENTE: ' : ''}Tu certificado vence en ${diasRestantes} días — ${nExpediente}`,
    html: baseTemplate(`
      <p>Hola <strong>${nombreEmpresa}</strong>,</p>
      <p>${urgente ? '<strong>⚠️ Aviso urgente:</strong>' : ''} Tu certificado Halal <strong>${nExpediente}</strong> vence en <strong>${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}</strong>.</p>
      <div class="highlight" style="border-color: ${urgente ? '#721c24' : '#856404'};">
        <strong>Fecha de vencimiento:</strong> ${new Date(fechaVencimiento).toLocaleDateString('es-UY')}
      </div>
      <p>Podés iniciar la renovación desde tu portal para mantener tu certificación vigente.</p>
      <a href="${process.env.FRONTEND_URL}/cliente/solicitudes" class="btn">Renovar certificado</a>
    `),
  });
}

async function enviarResumenVencidosAdmin(emailAdmin, vencidos) {
  const filas = vencidos.map(v =>
    `<tr><td>${v.nExpediente}</td><td>${v.cliente?.nombreEmpresa}</td><td>${v.tipoCert?.nombre}</td></tr>`
  ).join('');

  await enviar({
    to: emailAdmin,
    subject: `[CERTIA] Resumen de certificados vencidos hoy`,
    html: baseTemplate(`
      <p>Los siguientes certificados vencieron hoy:</p>
      <table style="width:100%; border-collapse: collapse; font-size: 13px;">
        <thead><tr style="background:#1A6B3C; color:#fff;">
          <th style="padding:8px; text-align:left;">Expediente</th>
          <th style="padding:8px; text-align:left;">Cliente</th>
          <th style="padding:8px; text-align:left;">Tipo</th>
        </tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <a href="${process.env.FRONTEND_URL}/admin/solicitudes?estado=VENCIDO" class="btn" style="margin-top:16px;">Ver en el panel</a>
    `),
  });
}

module.exports = {
  enviarOtp,
  enviarConfirmacionSolicitud,
  enviarAlertaNuevaSolicitud,
  enviarCambioEstado,
  enviarBorradorListoAdmin,
  enviarPdfParaFirmarAdmin,
  enviarFirmaInvalidaAdmin,
  enviarCertificadoFinalizado,
  enviarAvisoVencimiento,
  enviarResumenVencidosAdmin,
};
