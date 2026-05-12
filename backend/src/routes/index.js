const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/solicitudes', require('./solicitudes.routes'));
router.use('/clientes', require('./clientes.routes'));
router.use('/tipos', require('./tipos.routes'));
router.use('/webhooks', require('./webhooks.routes'));
router.use('/export', require('./export.routes'));
router.use('/ia', require('./ia.routes'));
router.use('/configuracion', require('./configuracion.routes'));
router.use('/auditoria', require('./auditoria.routes'));
router.use('/verify', require('./verify.routes'));

module.exports = router;
