const router = require('express').Router();
const { loginAdmin, loginCliente, refresh, logout } = require('../controllers/auth.controller');

router.post('/admin/login', loginAdmin);
router.post('/cliente/login', loginCliente);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
