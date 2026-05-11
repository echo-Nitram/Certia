const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
}

async function subirBuffer(buffer, { carpeta = 'certia', mimeType = 'application/pdf', nombreOriginal } = {}) {
  const extension = mimeType === 'application/pdf' ? 'pdf'
    : mimeType === 'image/jpeg' ? 'jpg'
    : mimeType === 'image/png' ? 'png'
    : 'bin';

  const publicId = `${carpeta}/${uuidv4()}.${extension}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: 'raw', use_filename: false },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function subirArchivo(rutaLocal, { carpeta = 'certia' } = {}) {
  const publicId = `${carpeta}/${uuidv4()}`;
  const result = await cloudinary.uploader.upload(rutaLocal, {
    public_id: publicId,
    resource_type: 'raw',
    use_filename: false,
  });
  return result.secure_url;
}

async function eliminar(url) {
  // Extrae el public_id de la URL de Cloudinary
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (match) {
    const publicId = match[1].replace(/\.[^/.]+$/, '');
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  }
}

module.exports = { subirBuffer, subirArchivo, eliminar };
