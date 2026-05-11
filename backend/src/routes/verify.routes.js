const router = require('express').Router();
const { verificar } = require('../controllers/verify.controller');

// Ruta pública — sin autenticación
router.get('/:token', verificar);

module.exports = router;
