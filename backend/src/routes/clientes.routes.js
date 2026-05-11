const router = require('express').Router();
const ctrl = require('../controllers/clientes.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const auditMiddleware = require('../middleware/audit.middleware');

router.use(authMiddleware, roleMiddleware('admin'));

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', auditMiddleware('Cliente', 'crear'), ctrl.crear);
router.put('/:id', auditMiddleware('Cliente', 'actualizar'), ctrl.actualizar);
router.patch('/:id/tipos', ctrl.toggleTipoCert);
router.delete('/:id', auditMiddleware('Cliente', 'desactivar'), ctrl.eliminar);

module.exports = router;
