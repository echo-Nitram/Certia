const router = require('express').Router();
const ctrl = require('../controllers/solicitudes.controller');
const comentCtrl = require('../controllers/comentarios.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { uploadComprobante, uploadPdfFirmado } = require('../middleware/upload.middleware');

router.use(authMiddleware);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);

// Crear solicitud — cliente o admin
router.post(
  '/',
  uploadComprobante.single('comprobante'),
  ctrl.crear
);

// Cambiar estado — solo admin
router.patch('/:id/estado', roleMiddleware('admin'), ctrl.cambiarEstado);

// Editar datos en OBSERVADO — solo cliente propietario
router.patch('/:id/datos', roleMiddleware('cliente'), ctrl.editarDatos);

// PDF sin firma (para descargar antes de firmar)
router.post('/:id/pdf-sin-firma', roleMiddleware('admin'), ctrl.generarPdfSinFirma);

// Subir PDF firmado — solo admin
router.post(
  '/:id/pdf-firmado',
  roleMiddleware('admin'),
  uploadPdfFirmado.single('pdf'),
  ctrl.subirPdfFirmado
);

// Comentarios
router.get('/:id/comentarios', comentCtrl.listar);
router.post('/:id/comentarios', roleMiddleware('admin'), comentCtrl.crear);

module.exports = router;
