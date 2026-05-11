const crypto = require('crypto');
const bcrypt = require('bcrypt');

function generarOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

async function hashOtp(codigo) {
  return bcrypt.hash(codigo, 10);
}

async function verificarOtp(codigo, hash) {
  return bcrypt.compare(codigo, hash);
}

module.exports = { generarOtp, hashOtp, verificarOtp };
