let _io;

function setIo(io) {
  _io = io;
}

function getIo() {
  return _io;
}

function emitirAlAdmin(evento, datos) {
  if (!_io) return;
  _io.to('admins').emit(evento, datos);
}

function emitirAlCliente(clienteId, evento, datos) {
  if (!_io) return;
  _io.to(`user:${clienteId}`).emit(evento, datos);
}

module.exports = { setIo, getIo, emitirAlAdmin, emitirAlCliente };
