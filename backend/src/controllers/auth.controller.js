const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function generarTokens(payload) {
  const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET no configurado');
  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

// POST /api/auth/admin/login
async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos.' });

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.activo) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const passwordOk = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordOk) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const payload = { id: admin.id, email: admin.email, nombre: admin.nombre, rol: 'admin' };
    const { accessToken, refreshToken } = generarTokens(payload);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTS);

    await prisma.auditoria.create({
      data: { adminId: admin.id, entidad: 'Admin', accion: 'login_exitoso', ipOrigen: req.ip },
    });

    return res.json({ accessToken, usuario: payload });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/cliente/login
async function loginCliente(req, res, next) {
  try {
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
  } catch (err) {
    next(err);
  }
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

module.exports = { loginAdmin, loginCliente, refresh, logout };
