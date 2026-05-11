require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const { initSocket } = require('./sockets/events');
const { initJobs } = require('./jobs');

const app = express();
const server = http.createServer(app);

// ── CORS ──────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://certia-ten.vercel.app',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : []),
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`[REQ] ${req.method} ${req.path} origin=${origin}`);
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
});
initSocket(io);
app.set('io', io);

// ── Middleware global ─────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
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

// Rate limiting específico para OTP (5 por hora por email)
app.use('/api/auth/admin/login', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body?.email ?? req.ip,
  message: { error: 'Demasiadas solicitudes de código OTP. Intentá nuevamente en 1 hora.' },
}));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 CERTIA v3 backend corriendo en puerto ${PORT}`);
  console.log('📡 Socket.IO activo');
  initJobs();
});

module.exports = app;
