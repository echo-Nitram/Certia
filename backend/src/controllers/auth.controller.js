const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generarOtp, hashOtp, verificarOtp } = require('../utils/otp');
const emailService = require('../services/email.service');

const prisma = new PrismaClient();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function generarTokens(payload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

// POST /api/auth/admin/login
async function loginAdmin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos.' });

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !admin.activo) return res.status(401).json({ error: 'Credenciales inválidas.' });

  const passwordOk = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordOk) return res.status(401).json({ error: 'Credenciales inválidas.' });

  // Generar OTP
  const codigo = generarOtp();
  const codigoHash = await hashOtp(codigo);
  const expiraEn = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000);

  // Invalidar OTPs anteriores
  await prisma.otpCode.deleteMany({ where: { adminId: admin.id } });

  await prisma.otpCode.create({
    data: { adminId: admin.id, codigoHash, expiraEn, usado: false, intentosFallidos: 0 },
  });

  await emailService.enviarOtp(admin.email, admin.nombre, codigo);

  // Auditoría
  await prisma.auditoria.create({
    data: {
      adminId: admin.id,
      entidad: 'Admin',
      accion: 'login_intento',
      ipOrigen: req.ip,
    },
  });

  return res.json({ otpRequerido: true, adminId: admin.id });
}

// POST /api/auth/admin/verify-otp
async function verifyOtp(req, res) {
  const { adminId, codigo } = req.body;
  if (!adminId || !codigo) return res.status(400).json({ error: 'adminId y código requeridos.' });

  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin || !admin.activo) return res.status(401).json({ error: 'Admin no encontrado.' });

  const otpRecord = await prisma.otpCode.findFirst({
    where: { adminId, usado: false, expiraEn: { gt: new Date() } },
    orderBy: { creadoEn: 'desc' },
  });

  if (!otpRecord) return res.status(401).json({ error: 'Código expirado o inexistente. Solicitá uno nuevo.' });

  const maxIntentos = parseInt(process.env.OTP_MAX_INTENTOS || '3');
  if (otpRecord.intentosFallidos >= maxIntentos) {
    await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { usado: true } });
    return res.status(401).json({ error: 'Código invalidado por exceso de intentos fallidos.' });
  }

  const valido = await verificarOtp(codigo, otpRecord.codigoHash);
  if (!valido) {
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { intentosFallidos: { increment: 1 } },
    });
    const restantes = maxIntentos - (otpRecord.intentosFallidos + 1);
    return res.status(401).json({ error: `Código incorrecto. Intentos restantes: ${restantes}.` });
  }

  await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { usado: true } });

  const payload = { id: admin.id, email: admin.email, nombre: admin.nombre, rol: 'admin' };
  const { accessToken, refreshToken } = generarTokens(payload);

  res.cookie('refreshToken', refreshToken, COOKIE_OPTS);

  await prisma.auditoria.create({
    data: { adminId: admin.id, entidad: 'Admin', accion: 'login_exitoso', ipOrigen: req.ip },
  });

  return res.json({ accessToken, usuario: payload });
}

// POST /api/auth/cliente/login
async function loginCliente(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos.' });

  const cliente = await prisma.cliente.findUnique({ where: { email } });
  if (!cliente || !cliente.activo) return res.status(401).json({ error: 'Credenciales inválidas.' });

  const passwordOk = await bcrypt.compare(password, cliente.passwordHash);
  if (!passwordOk) return res.status(401).json({ error: 'Credenciales inválidas.' });

  const payload = { id: cliente.id, email: cliente.email, nombre: cliente.nombreEmpresa, rol: 'cliente' };
  const { accessToken, refreshToken } = generarTokens(payload);

  res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
  return res.json({ accessToken, usuario: payload });
}

// POST /api/auth/refresh
async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token no encontrado.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const { iat, exp, ...userData } = payload;
    const { accessToken } = generarTokens(userData);
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: 'Refresh token inválido o expirado.' });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  res.clearCookie('refreshToken', COOKIE_OPTS);
  return res.json({ ok: true });
}

module.exports = { loginAdmin, verifyOtp, loginCliente, refresh, logout };
