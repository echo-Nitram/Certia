const router = require('express').Router();
const ctrl = require('../controllers/tipos.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);

// Clientes y admins pueden listar tipos (filtrado internamente)
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);

// Solo admins pueden modificar
router.post('/', roleMiddleware('admin'), ctrl.crear);
router.put('/:id', roleMiddleware('admin'), ctrl.actualizar);
router.delete('/:id', roleMiddleware('admin'), ctrl.eliminar);

module.exports = router;
