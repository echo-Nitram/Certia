const router = require('express').Router();
const ctrl = require('../controllers/export.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware, roleMiddleware('admin'));

router.get('/solicitudes', ctrl.exportSolicitudes);
router.get('/certificados', ctrl.exportCertificados);
router.get('/auditoria', ctrl.exportAuditoria);

module.exports = router;
