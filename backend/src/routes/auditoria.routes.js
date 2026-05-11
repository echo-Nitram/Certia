const router = require('express').Router();
const ctrl = require('../controllers/auditoria.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware, roleMiddleware('admin'));

router.get('/', ctrl.listar);

module.exports = router;
