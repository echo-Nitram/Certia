require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const { initSocket } = require('./sockets/events');
const { initJobs } = require('./jobs');

const app = express();
const server = http.createServer(app);

// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});
initSocket(io);
app.set('io', io);

// ── Middleware global ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting general
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intente más tarde.' },
}));

// Rate limiting específico para login
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login. Intente más tarde.' },
}));

// Rate limiting para solicitudes de OTP (5 por email/hora)
app.use('/api/auth/admin/login', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body?.email ?? req.ip,
  message: { error: 'Demasiadas solicitudes de código OTP. Intentá nuevamente en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// Verificación pública sin /api
app.use('/verify', require('./routes/verify.routes'));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '3.0.0' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
});

// ── Cron jobs ─────────────────────────────────────────────────────────────────
initJobs();

// ── Servidor ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 CERTIA v3 backend corriendo en puerto ${PORT}`);
  console.log(`📡 Socket.IO activo`);
});

module.exports = { app, server };
