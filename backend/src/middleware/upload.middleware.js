const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const MIME_PERMITIDOS = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

const storage = multer.memoryStorage();

function filtroArchivos(req, file, cb) {
  if (MIME_PERMITIDOS[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan PDF, JPG y PNG.`));
  }
}

const uploadComprobante = multer({
  storage,
  fileFilter: filtroArchivos,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadPdfFirmado = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos PDF.'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const uploadPdfReferencia = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos PDF.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { uploadComprobante, uploadPdfFirmado, uploadPdfReferencia };
