const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

function generarQrToken() {
  return uuidv4().replace(/-/g, '');
}

async function generarQrDataUrl(token) {
  const url = `${process.env.APP_URL || 'http://localhost:3000'}/verify/${token}`;
  return QRCode.toDataURL(url, { width: 200, margin: 1 });
}

module.exports = { generarQrToken, generarQrDataUrl };
