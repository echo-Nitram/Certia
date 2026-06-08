const puppeteer = require('puppeteer-core');
const { PDFDocument } = require('pdf-lib');
const forge = require('node-forge');
const { generarQrDataUrl } = require('../utils/qr');
const fs = require('fs');

// Detecta automáticamente el ejecutable de Chromium disponible
function detectarChromium() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidatos = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/nix/store',  // nixpacks instala aquí, se busca dinámicamente
  ];
  // Buscar en /nix/store si existe
  if (fs.existsSync('/nix/store')) {
    try {
      const { execSync } = require('child_process');
      const path = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null || true', { encoding: 'utf8' }).trim();
      if (path) return path;
    } catch (_) {}
  }
  for (const p of candidatos) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function reemplazarVariables(html, datos) {
  let resultado = html;
  for (const [clave, valor] of Object.entries(datos)) {
    const regex = new RegExp(`\\{\\{${clave}\\}\\}`, 'g');
    resultado = resultado.replace(regex, escapeHtml(valor ?? ''));
  }
  return resultado;
}

async function generarPdfBorrador(plantillaHtml, datosFormulario, solicitud, cliente, tipoCert) {
  const fechaEmision = solicitud.fechaEmision
    ? new Date(solicitud.fechaEmision).toLocaleDateString('es-UY')
    : new Date().toLocaleDateString('es-UY');

  const fechaVencimiento = solicitud.fechaVencimiento
    ? new Date(solicitud.fechaVencimiento).toLocaleDateString('es-UY')
    : 'Por definir';

  const variables = {
    ...datosFormulario,
    nExpediente: solicitud.nExpediente,
    nombreEmpresa: cliente.nombreEmpresa,
    fechaEmision,
    fechaVencimiento,
    tipoCertificado: tipoCert.nombre,
    codigoTipo: tipoCert.codigo,
  };

  const htmlFinal = reemplazarVariables(plantillaHtml, variables);

  const executablePath = detectarChromium();
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlFinal, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

async function agregarMarcaDeAgua(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  const { rgb, StandardFonts } = require('pdf-lib');
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const page of pages) {
    const { width } = page.getSize();
    page.drawText('Verificado vía CERTIA — certia.uy', {
      x: 20,
      y: 12,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

async function agregarQrAlPdf(pdfBuffer, qrToken) {
  const { PDFDocument: PD, rgb } = require('pdf-lib');
  const pdfDoc = await PD.load(pdfBuffer);
  const qrDataUrl = await generarQrDataUrl(qrToken);
  const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
  const qrBytes = Buffer.from(base64, 'base64');
  const qrImage = await pdfDoc.embedPng(qrBytes);

  const pages = pdfDoc.getPages();
  const ultimaPagina = pages[pages.length - 1];
  const { width, height } = ultimaPagina.getSize();

  ultimaPagina.drawImage(qrImage, {
    x: width - 80,
    y: 20,
    width: 60,
    height: 60,
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

async function validarFirmaDigital(pdfBuffer, pdfOriginalBuffer) {
  if (pdfBuffer.subarray(0, 4).toString() !== '%PDF') {
    return { valido: false, error: 'El archivo no es un PDF válido.' };
  }

  try {
    await PDFDocument.load(pdfBuffer);
  } catch {
    return { valido: false, error: 'El archivo no es un PDF válido.' };
  }

  const contenido = pdfBuffer.toString('binary');
  // /ByteRange + /Contents es la firma real según ISO 32000 (ambos campos requeridos)
  const tieneFirma = (contenido.includes('/ByteRange') && contenido.includes('/Contents'))
    || contenido.includes('/AcroForm');
  if (!tieneFirma) {
    return { valido: false, error: 'El PDF no contiene una firma digital detectada. Repetí el proceso en firma.gub.uy.' };
  }

  const MAX_FACTOR = 3;
  if (pdfOriginalBuffer && pdfBuffer.length > pdfOriginalBuffer.length * MAX_FACTOR) {
    return { valido: false, error: 'El tamaño del PDF firmado es inconsistente con el original. Verificá que firmaste el documento correcto.' };
  }

  if (pdfBuffer.length > 20 * 1024 * 1024) {
    return { valido: false, error: 'El archivo supera el límite de 20MB. Contactá soporte técnico.' };
  }

  return { valido: true };
}

module.exports = { generarPdfBorrador, agregarMarcaDeAgua, agregarQrAlPdf, validarFirmaDigital };
