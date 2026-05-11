const router = require('express').Router();
const ctrl = require('../controllers/ia.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { uploadPdfReferencia } = require('../middleware/upload.middleware');

router.use(authMiddleware, roleMiddleware('admin'));

router.post('/generar-plantilla', uploadPdfReferencia.single('pdf'), ctrl.generarPlantilla);

module.exports = router;
