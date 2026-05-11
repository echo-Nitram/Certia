const router = require('express').Router();
const ctrl = require('../controllers/configuracion.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware, roleMiddleware('admin'));

router.get('/', ctrl.listar);
router.put('/bulk', ctrl.actualizarMultiple);
router.put('/:clave', ctrl.actualizar);

module.exports = router;
