# CERTIA v3

Sistema de Gestión de Certificados Halal del Centro Islámico del Uruguay.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express 4, Prisma ORM, PostgreSQL |
| Frontend | React 18, Vite 5, Tailwind CSS 3, TanStack Query 5, Zustand 5 |
| Real-time | Socket.IO 4 |
| Almacenamiento | Cloudinary (archivos, PDFs) |
| Email | Nodemailer (SMTP configurable) |
| PDF | Puppeteer (generación) + pdf-lib (manipulación) |
| IA | Anthropic Claude SDK (análisis de documentos) |
| Deploy | Railway (backend) + Vercel (frontend) |

## Arquitectura

```
certia/
├── backend/           # API REST + WebSocket
│   ├── prisma/        # Schema y migraciones PostgreSQL
│   └── src/
│       ├── controllers/   # Lógica de negocio (11 controllers)
│       ├── routes/        # Definición de endpoints (11 routers)
│       ├── middleware/    # auth, role, audit, upload
│       ├── services/      # email, pdf, cloudinary, socket, webhook, IA
│       ├── jobs/          # Cron: vencimiento de certs + limpieza OTP
│       ├── sockets/       # Eventos Socket.IO
│       └── utils/         # expediente, QR, OTP
└── frontend/          # SPA React
    └── src/
        ├── pages/admin/   # Dashboard, Solicitudes, Clientes, Tipos, Config, Webhooks, Auditoría
        ├── pages/cliente/ # Dashboard, Solicitudes, Nueva solicitud
        ├── pages/         # Verify (verificación pública QR)
        ├── components/    # AdminLayout, ClienteLayout, EstadoBadge, Timeline, Notifications
        ├── hooks/         # useAuth, useSocket, useNotifications, useRestoreSession
        ├── stores/        # auth.store, notification.store (Zustand)
        └── lib/           # api.js (Axios + refresh token interceptor)
```

## Flujo de estados de solicitud

```
PENDIENTE → EN_REVISION → OBSERVADO ⟳
                       → PAGO_VALIDADO → EN_ELABORACION → REVISION_PDF → PENDIENTE_FIRMA → FINALIZADO
                       → RECHAZADO (desde cualquier estado no terminal)
(cron diario) → VENCIDO (cuando fecha_vencimiento < hoy)
```

## Variables de entorno

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:pass@host:5432/certia
JWT_SECRET=<secreto_fuerte>
JWT_REFRESH_SECRET=<secreto_fuerte_diferente>
NODE_ENV=production

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SMTP (opcional — si no se configura, el OTP se imprime en consola)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# Configuración
FRONTEND_URL=https://tu-app.vercel.app
OTP_EXPIRY_MINUTES=10
OTP_MAX_INTENTOS=3
CERT_EXPIRY_DAYS=365
CERT_RENEWAL_DAYS=60

# IA (opcional)
ANTHROPIC_API_KEY=
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=https://tu-backend.railway.app
```

## Desarrollo local

### Backend

```bash
cd backend
cp .env.example .env    # completar variables
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev             # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

El frontend tiene proxy configurado en `vite.config.js`: `/api`, `/verify`, `/socket.io` → `http://localhost:3000`.

## Deploy

### Railway (Backend)

El archivo `railway.toml` configura el build y arranque automáticamente:
- Build: `npm install && npx prisma generate`
- Start: `npx prisma migrate deploy && node prisma/seed.js && node src/app.js`
- Health check: `GET /health`

Variables requeridas en Railway: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`.

### Vercel (Frontend)

El archivo `vercel.json` configura el build y el rewrite SPA:
- Build: `npm run build`
- Output: `dist/`
- Todas las rutas → `/index.html`

Variable requerida en Vercel: `VITE_API_URL`.

## Autenticación

- **Admin**: login con email + contraseña → envío de OTP por email → JWT (access 24h + refresh cookie 30d)
- **Cliente**: login con email + contraseña → JWT (access 24h + refresh cookie 30d)
- El access token se renueva automáticamente vía interceptor Axios en el frontend
- Al recargar la página, se intenta restaurar la sesión usando el refresh token de la cookie

## API — Endpoints principales

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/admin/login` | Público | Paso 1: email + contraseña → envía OTP |
| POST | `/api/auth/admin/verify-otp` | Público | Paso 2: verifica OTP → retorna JWT |
| POST | `/api/auth/cliente/login` | Público | Login de clientes |
| POST | `/api/auth/refresh` | Cookie | Renueva access token |
| GET | `/api/solicitudes` | Auth | Lista solicitudes (filtradas por rol) |
| POST | `/api/solicitudes` | Auth | Crea nueva solicitud |
| PATCH | `/api/solicitudes/:id/estado` | Admin | Cambia estado |
| PATCH | `/api/solicitudes/:id/datos` | Cliente | Edita datos (estado OBSERVADO) |
| POST | `/api/solicitudes/:id/pdf-firmado` | Admin | Sube PDF firmado |
| GET | `/api/verify/:token` | Público | Verifica certificado por QR |
| GET | `/api/clientes` | Admin | Lista clientes |
| GET | `/api/tipos` | Auth | Lista tipos de certificado |
| GET | `/api/export/solicitudes` | Admin | Exporta Excel |
| GET | `/api/auditoria` | Admin | Log de auditoría |

## Datos iniciales (seed)

- 1 admin por defecto: `admin@certia.uy` / `Admin1234!`
- 6 tipos de certificado base (HC01–HC06) en estado inactivo
- 10 configuraciones del sistema precargadas
