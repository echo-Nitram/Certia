const jwt = require('jsonwebtoken');
const { setIo } = require('../services/socket.service');

function initSocket(io) {
  setIo(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token requerido'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const { id, rol } = socket.user;

    if (rol === 'admin') {
      socket.join('sala:admins');
    } else if (rol === 'cliente') {
      socket.join(`sala:cliente:${id}`);
    }

    socket.on('disconnect', () => {});
  });
}

module.exports = { initSocket };
