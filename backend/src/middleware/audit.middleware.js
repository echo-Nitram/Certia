const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function auditMiddleware(entidad, accion) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      if (res.statusCode < 400 && req.user?.rol === 'admin') {
        prisma.auditoria.create({
          data: {
            adminId: req.user.id,
            entidad,
            accion,
            datosNuevos: body,
            ipOrigen: req.ip || req.headers['x-forwarded-for'] || null,
          },
        }).catch(err => console.error('[Auditoria]', err));
      }
      return originalJson(body);
    };

    next();
  };
}

module.exports = auditMiddleware;
