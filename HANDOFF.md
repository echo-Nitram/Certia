# CERTIA v3 — Handoff de Sesión

**Fecha:** 2026-06-06  
**Rama de trabajo:** `claude/upbeat-pasteur-E5lho`  
**Estado general:** Bug crítico de routing identificado y corregido. Pendiente deploy.

---

## Objetivo del proyecto

CERTIA v3 es el sistema de gestión de certificados Halal del Centro Islámico del Uruguay.  
Permite a organizaciones (clientes) solicitar certificados, y a los administradores gestionarlos  
a través de un flujo de estados con generación de PDFs, firma digital y verificación pública por QR.

---

## Estado actual

| Componente | Estado |
|---|---|
| Frontend (Vercel) | ✅ Live — `certia-ten.vercel.app` |
| Backend (Railway) | ✅ Live — `certia-production-14da.up.railway.app` |
| Base de datos | ✅ PostgreSQL en Railway |
| Último deploy producción | `92db31c` — fix PWA/workbox |
| PRs abiertos | ❌ Ninguno |
| Working tree | ✅ Limpio (1 commit nuevo pendiente de push) |

**Bug activo en producción:** todas las secciones del panel admin y cliente se ven en blanco.  
Causa identificada y corregida en esta sesión (ver sección "Qué cambió").

---

## Archivos modificados en esta sesión

| Archivo | Cambio |
|---|---|
| `frontend/src/components/AdminLayout.jsx` | `{children}` → `<Outlet />`, import Outlet |
| `frontend/src/components/ClienteLayout.jsx` | `{children}` → `<Outlet />`, import Outlet |

---

## Qué cambió y por qué

### Bug: contenido en blanco en todas las secciones

**Síntoma:** El sidebar del admin se renderiza correctamente (navegación, usuario, logout),  
pero el área principal (`<main>`) aparece completamente en blanco en Dashboard, Solicitudes,  
Clientes, Tipos, Webhooks, Auditoría y Configuración. Idéntico en el portal cliente.

**Causa raíz:** En React Router v6, cuando un componente de layout se define como  
`element` de una `<Route>` con rutas hijas anidadas, las páginas hijas se montan a través  
de `<Outlet />` — NO como `props.children`. Ambos layouts usaban `{children}` que en este  
contexto siempre es `undefined`.

```jsx
// App.jsx — estructura de rutas
<Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
  <Route index element={<Dashboard />} />   // ← se monta via Outlet, no children
  <Route path="solicitudes" element={<Solicitudes />} />
  ...
</Route>
```

**Fix aplicado:**

```diff
// AdminLayout.jsx y ClienteLayout.jsx
- import { ..., } from 'react-router-dom';
+ import { ..., Outlet } from 'react-router-dom';

- export default function AdminLayout({ children }) {
+ export default function AdminLayout() {

- <main ...>{children}</main>
+ <main ...><Outlet /></main>
```

---

## Qué se intentó antes (sesiones anteriores) y falló

| Intento | Resultado |
|---|---|
| PWA con Workbox | Service Worker cacheaba bundle JS stale → desactivado (commit `92db31c`) |
| `puppeteer` completo en Railway | OOM kill por descarga de ~350MB Chromium → migrado a `puppeteer-core` |
| `npm start` en Railway | Railway recibía SIGTERM, npm reportaba exit 143 → cambiado a `node src/app.js` directo |
| Vercel proxy de WebSockets (`/socket.io`) | Vercel no soporta WS en rewrites → Socket.IO apunta directo a Railway |
| `express-async-errors` | Railway no instaló el paquete correctamente, crash en startup → removido |
| BOM en `vercel.json` y `railway.toml` | Archivos con BOM UTF-8 causaban parse error → removido BOM |
| CORS custom middleware | No manejaba preflight OPTIONS correctamente → reemplazado con paquete `cors` |
| Login admin con OTP/2FA | Flujo complejo causaba bugs de rate limit y JWT → simplificado a email+password directo |
| `JWT_SECRET` vs `JWT_ACCESS_SECRET` | Railway tenía la variable con nombre distinto → agregado fallback en `generarTokens()` |
| `accessToken` solo en memoria (Zustand) | Se perdía al navegar → persistido en localStorage |
| Render antes de hidratación de Zustand | `accessToken` null en primer render → agregado guard de hidratación en `App.jsx` |

---

## Plan a continuación

1. **[ ] Push + PR** de este fix (`Outlet` en layouts) → deploy a Vercel → verificar que el contenido carga
2. **[ ] Smoke test completo** una vez deployado:
   - Login admin → Dashboard muestra métricas
   - Navegar a Solicitudes, Clientes, Tipos, Webhooks, Auditoría, Configuración
   - Login cliente → Dashboard → Nueva Solicitud
3. **[ ] Verificar Railway health** — confirmar que el backend responde a `/health`
4. **[ ] Revisar flujo completo de solicitud** de punta a punta:
   - Cliente crea solicitud → Admin la revisa → estados hasta FINALIZADO → QR de verificación
5. **[ ] Reactivar OTP/2FA** (opcional, según decisión del usuario) — fue removido en PR #13
6. **[ ] Agregar CLAUDE.md** con instrucciones de desarrollo para futuras sesiones

---

## Credenciales de acceso

| Rol | Email | Password |
|---|---|---|
| Admin | `admin@certia.uy` | `Admin1234!` |
| Cliente | (crear desde panel admin) | — |

---

## URLs clave

| Recurso | URL |
|---|---|
| App (admin) | `https://certia-ten.vercel.app/admin/login` |
| App (cliente) | `https://certia-ten.vercel.app/cliente/login` |
| Backend health | `https://certia-production-14da.up.railway.app/health` |
| Repo GitHub | `https://github.com/echo-Nitram/Certia` |
| Vercel dashboard | `https://vercel.com/echo-nitrams-projects/certia` |
