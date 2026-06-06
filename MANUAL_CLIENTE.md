# CERTIA — Manual de Usuario
### Centro Islámico del Uruguay · Sistema de Gestión de Certificados Halal

---

## Índice

1. [¿Qué es CERTIA?](#1-qué-es-certia)
2. [Acceso al sistema](#2-acceso-al-sistema)
3. [Panel de Administrador](#3-panel-de-administrador)
   - 3.1 Dashboard
   - 3.2 Solicitudes
   - 3.3 Detalle de solicitud y flujo completo
   - 3.4 Clientes
   - 3.5 Tipos de Certificado
   - 3.6 Wizard IA
   - 3.7 Webhooks
   - 3.8 Auditoría
   - 3.9 Configuración
4. [Panel de Cliente](#4-panel-de-cliente)
   - 4.1 Dashboard del cliente
   - 4.2 Nueva solicitud paso a paso
   - 4.3 Seguimiento de solicitud
   - 4.4 Corrección de datos (estado OBSERVADO)
   - 4.5 Descarga del certificado
   - 4.6 Renovación
5. [Flujo completo de una solicitud](#5-flujo-completo-de-una-solicitud)
6. [Generación y firma de PDFs](#6-generación-y-firma-de-pdfs)
7. [Verificación pública por QR](#7-verificación-pública-por-qr)
8. [Notificaciones y alertas](#8-notificaciones-y-alertas)
9. [Credenciales de prueba](#9-credenciales-de-prueba)
10. [URLs del sistema](#10-urls-del-sistema)
11. [Preguntas frecuentes](#11-preguntas-frecuentes)

---

## 1. ¿Qué es CERTIA?

CERTIA es el sistema de gestión de certificados Halal del Centro Islámico del Uruguay. Permite a empresas exportadoras e industriales solicitar, gestionar y descargar certificados Halal de forma digital, con trazabilidad completa, firma digital y verificación por código QR.

**Actores del sistema:**

| Rol | Descripción |
|-----|-------------|
| **Administrador** | Personal del Centro Islámico. Gestiona solicitudes, genera PDFs, sube certificados firmados, crea clientes y configura el sistema. |
| **Cliente** | Empresa solicitante. Crea solicitudes, adjunta comprobante de pago, corrige observaciones y descarga certificados finalizados. |
| **Público general** | Puede verificar la autenticidad de un certificado escaneando el código QR. Sin registro requerido. |

---

## 2. Acceso al sistema

### URLs

| Entorno | URL |
|---------|-----|
| **Producción — Frontend** | https://certia-ten.vercel.app |
| **Producción — API** | https://certia-production-14da.up.railway.app |
| **Login Administrador** | https://certia-ten.vercel.app/admin/login |
| **Login Cliente** | https://certia-ten.vercel.app/cliente/login |
| **Verificación pública** | https://certia-ten.vercel.app/verify/{token} |

### Inicio de sesión

Ambos roles ingresan con **email + contraseña**. La sesión se mantiene activa 24 horas; el token se renueva automáticamente sin necesidad de volver a ingresar.

> **Seguridad:** El sistema bloquea el acceso por 15 minutos luego de 5 intentos fallidos consecutivos.

---

## 3. Panel de Administrador

### 3.1 Dashboard

Al ingresar, el administrador ve un resumen en tiempo real actualizado cada 30 segundos:

- **Solicitudes pendientes de atención** (estado PENDIENTE sin mover en más de 72 h)
- **Pendientes de firma** (certificados listos para firmar y subir)
- **Certificados por vencer en 30 días**
- **Distribución por estado** de todas las solicitudes activas

### 3.2 Solicitudes

Lista completa de todas las solicitudes del sistema. Filtros disponibles:

| Filtro | Descripción |
|--------|-------------|
| Estado | Cualquiera de los 10 estados del flujo |
| Tipo de certificado | HC01 a HC07 |
| Cliente | Buscar por nombre de empresa |
| Rango de fechas | Desde / hasta fecha de creación |
| Búsqueda libre | Por número de expediente |

Cada fila muestra: número de expediente, empresa, tipo, estado actual (badge de color), fecha de creación.

Haciendo clic en una fila se accede al **Detalle de solicitud**.

### 3.3 Detalle de solicitud y flujo completo

Esta es la pantalla central del trabajo administrativo. Contiene:

#### Cabecera
- Número de expediente (`CERT-YYYYMM-XXXX`)
- Tipo de certificado y nombre del cliente
- Badge del estado actual con colores:

| Estado | Color | Significado |
|--------|-------|-------------|
| Pendiente | Amarillo | Recibida, sin revisar |
| En Revisión | Azul | Admin revisando |
| Observado | Naranja | Requiere corrección del cliente |
| Pago Validado | Verde claro | Pago confirmado |
| En Elaboración | Violeta | Generando PDF borrador |
| Revisión PDF | Celeste | Borrador listo para revisar |
| Pendiente Firma | Amarillo | PDF descargado, esperando firma |
| Finalizado | Verde | Certificado emitido |
| Rechazado | Rojo | Solicitud rechazada |
| Vencido | Gris | Certificado expirado |

#### Panel izquierdo — Datos del formulario
Todos los campos completados por el cliente. En el caso de HC07 incluye datos de exportación: exportador, matadero, supervisor, importador, peso neto/bruto, transporte, puertos, fechas de faena/producción/expiración, descripción de cantidad.

#### Panel derecho — Información y acciones
- Datos del cliente (nombre, email)
- **Cambio de estado:** menú desplegable con las transiciones válidas desde el estado actual
- Campo de motivo (obligatorio al observar o rechazar)
- Adjuntos: comprobante de pago y otros archivos subidos por el cliente

#### Historial de estados
Línea de tiempo cronológica con cada transición: estado anterior → nuevo, quién lo realizó y cuándo.

#### Comentarios internos
- **Interno:** solo visible para administradores
- **Visible:** también lo ve el cliente en su panel

#### Acciones específicas por estado

| Estado actual | Acciones disponibles |
|--------------|----------------------|
| EN_ELABORACION | El sistema genera el PDF borrador automáticamente |
| REVISION_PDF | Vista previa del borrador · Aprobar (→ PENDIENTE_FIRMA) · Volver a elaborar |
| PENDIENTE_FIRMA | Descargar PDF sin firma · Subir PDF firmado |
| FINALIZADO | Descargar certificado final firmado |

### 3.4 Clientes

Gestión completa de empresas clientes:

**Crear cliente:**
1. Clic en **Nuevo cliente**
2. Completar: Nombre de empresa, Email, Contraseña
3. Seleccionar qué tipos de certificado puede solicitar
4. Guardar

**Editar cliente:**
- Cambiar nombre, email o contraseña
- Habilitar / deshabilitar tipos de certificado individualmente

**Desactivar cliente:**
- La empresa no puede ingresar al sistema, pero sus solicitudes e historial se conservan

### 3.5 Tipos de Certificado

Gestión de las plantillas HTML que se usan para generar los PDFs.

**Tipos precargados:**

| Código | Nombre |
|--------|--------|
| HC01 | Producto Alimenticio |
| HC02 | Materia Prima |
| HC03 | Establecimiento |
| HC04 | Logística y Transporte |
| HC05 | Cosméticos |
| HC06 | Restauración |
| HC07 | Faena Halal — Exportación (Arabia) |

**Editor de plantilla:**
- Editor Monaco (misma tecnología que VS Code) con resaltado HTML
- Vista previa en tiempo real al lado del editor
- Guardar crea una nueva versión automáticamente (versionado completo)

**Historial de versiones:**
- Lista de todas las versiones con fecha, administrador y nota
- Botón **Restaurar** para volver a cualquier versión anterior

**Activar / desactivar tipo:**
- Solo los tipos activos son visibles para los clientes
- No elimina el tipo; puede reactivarse en cualquier momento

### 3.6 Wizard IA

Herramienta para generar nuevas plantillas a partir de un PDF de referencia.

**Pasos:**
1. Clic en **🤖 Generar con IA**
2. Subir un PDF del certificado de referencia
3. El sistema convierte las páginas a imágenes y las envía a Claude (IA de Anthropic)
4. En segundos se obtiene:
   - Nombre y descripción sugeridos
   - Lista de campos detectados con sus tipos (texto, fecha, número, lista, etc.)
   - Plantilla HTML completa con placeholders `{{campo}}`
5. Revisar el resultado en el modal
6. Clic en **Crear tipo de certificado**

> **Requisito:** Tener configurada la clave de API de Anthropic en **Configuración → Integraciones**.

### 3.7 Webhooks

Permite integrar CERTIA con sistemas externos (ERP, CRM, etc.) mediante notificaciones HTTP automáticas.

**Eventos disponibles:**

| Evento | Cuándo se dispara |
|--------|-------------------|
| `solicitud.creada` | Cliente envía nueva solicitud |
| `solicitud.estado_cambiado` | Admin cambia el estado |
| `certificado.finalizado` | Certificado emitido y firmado |
| `certificado.vencido` | Certificado expirado |
| `cliente.creado` | Nuevo cliente registrado |
| `renovacion.iniciada` | Cliente inicia renovación |

**Configurar un webhook:**
1. Ir a **Webhooks → Nuevo**
2. Ingresar URL del endpoint receptor
3. Seleccionar los eventos a suscribir
4. Opcionalmente agregar un token secreto (HMAC-SHA256 para validar autenticidad)
5. Usar **Probar** para verificar que el endpoint responde correctamente

**Reintentos:** En caso de fallo, el sistema reintenta automáticamente a los 1, 5 y 15 minutos.

### 3.8 Auditoría

Log completo de todas las acciones administrativas:

- Creación / modificación de clientes
- Cambios de estado en solicitudes
- Inicios de sesión
- Cambios de configuración

Filtros: administrador, tipo de acción, rango de fechas.
Exportable a **Excel** para auditorías externas.

### 3.9 Configuración

| Clave | Descripción | Valor por defecto |
|-------|-------------|-------------------|
| `anthropic_api_key` | API Key de Anthropic para el Wizard IA | — |
| `nombre_institucion` | Nombre en los emails y certificados | Centro Islámico del Uruguay |
| `cert_expiry_days` | Días de validez de un certificado | 365 |
| `notify_days_before` | Días antes del vencimiento para avisar al cliente | 30, 15, 7 |
| `renewal_enable_days` | Días antes del vencimiento en que el cliente puede renovar | 60 |
| `otp_expiry_minutes` | Minutos de validez de un OTP | 10 |
| `login_max_intentos` | Intentos antes de bloquear login | 5 |
| `login_bloqueo_minutos` | Duración del bloqueo en minutos | 15 |

---

## 4. Panel de Cliente

### 4.1 Dashboard del cliente

Vista resumida de las solicitudes propias:
- Contadores por estado
- Lista de solicitudes recientes con links directos
- Botón **Nueva solicitud**

### 4.2 Nueva solicitud paso a paso

**Paso 0 — Tipo de certificado**
- Se muestran únicamente los tipos habilitados por el administrador para esta empresa
- Seleccionar el tipo correspondiente

**Paso 1 — Completar datos**
Los campos varían según el tipo de certificado. Ejemplo para HC07 (Faena Halal):

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| Exportador | Sí | Nombre de la empresa exportadora |
| ProductorCo | Sí | Productor / frigorífico |
| Matadero | Sí | Establecimiento de faena |
| Supervisor | No | Supervisor Halal |
| Importador | No | Empresa importadora en destino |
| BL / Fecha de embarque | Sí | Número de Bill of Lading y fecha |
| Marcas de envío | No | Identificación del embarque |
| Peso Neto | Sí | En kg |
| Peso Bruto | Sí | En kg |
| Transporte | No | Medio de transporte |
| Puerto de embarque | Sí | Puerto de origen |
| Puerto de destino | Sí | Puerto de llegada |
| Fecha de faena | Sí | Fecha de la faena |
| Fecha de producción | No | |
| Fecha de expiración | No | |
| Descripción y cantidad | Sí | Detalle de los productos |
| Observaciones | No | Notas adicionales |

**Comprobante de pago (opcional):** PDF, JPG o PNG, máximo 5 MB. Puede adjuntarse en este paso.

**Paso 2 — Confirmación**
Resumen de todos los datos ingresados antes de enviar. Si hay un archivo adjunto, se muestra el nombre del archivo. Clic en **Enviar solicitud** para confirmar.

Al enviar, se recibe un email de confirmación con el número de expediente asignado (formato `CERT-YYYYMM-XXXX`).

### 4.3 Seguimiento de solicitud

En **Mis solicitudes**, cada fila muestra el estado actual con su color. Haciendo clic se accede al detalle donde se puede ver:

- Datos del formulario enviado
- Historial cronológico de estados
- Comentarios visibles del administrador
- Archivos adjuntos

### 4.4 Corrección de datos (estado OBSERVADO)

Cuando el administrador detecta un problema y pasa la solicitud a **OBSERVADO**, el cliente recibe un email de aviso.

En el detalle de la solicitud aparece:
- El motivo de la observación (mensaje del administrador)
- El formulario en modo **editable**

El cliente corrige los datos y hace clic en **Guardar cambios**. La solicitud vuelve automáticamente a revisión.

### 4.5 Descarga del certificado

Cuando la solicitud llega al estado **FINALIZADO**, el cliente puede:
- Ver las fechas de emisión y vencimiento
- Descargar el PDF del certificado firmado digitalmente
- Ver el código QR de verificación

### 4.6 Renovación

Cuando un certificado está dentro de los **60 días antes de su vencimiento**, aparece el botón **Renovar certificado**.

Al hacer clic:
- Se crea una nueva solicitud con los mismos datos del certificado original pre-cargados
- El cliente puede modificar cualquier campo antes de enviar
- La nueva solicitud atraviesa el mismo flujo completo

---

## 5. Flujo completo de una solicitud

```
                    CLIENTE                              ADMINISTRADOR
                       │                                      │
            [Crea solicitud + adjunta                         │
             comprobante de pago]                             │
                       │                                      │
                  PENDIENTE ─────────────────────────> EN_REVISION
                                                              │
                                           ┌──────────────────┼──────────────────┐
                                           ↓                  ↓                  ↓
                                       OBSERVADO         PAGO_VALIDADO       RECHAZADO
                                           │                  │                  │
                             [Cliente        │           EN_ELABORACION          │
                              corrige]       │                │                  │
                                           │           [Auto-genera PDF]         │
                                  EN_REVISION           REVISION_PDF             │
                                           │                  │                  │
                                           │          ┌───────┴──────┐           │
                                           │          ↓              ↓           │
                                           │   PENDIENTE_FIRMA   EN_ELABORACION  │
                                           │          │              │           │
                                           │    [Admin descarga,     │           │
                                           │     firma y sube PDF]   │           │
                                           │          │              │           │
                                           └─>   FINALIZADO     RECHAZADO <──────┘
                                                      │
                                           [Cron diario 08:00 AM]
                                                      │
                                                   VENCIDO
```

### Tabla de estados y responsables

| Estado | Quién actúa | Acción |
|--------|-------------|--------|
| PENDIENTE | Admin | Revisar y avanzar a EN_REVISION |
| EN_REVISION | Admin | Validar pago → PAGO_VALIDADO; observar → OBSERVADO; rechazar |
| OBSERVADO | **Cliente** | Corregir datos del formulario |
| PAGO_VALIDADO | Admin | Avanzar a EN_ELABORACION |
| EN_ELABORACION | **Sistema** | Genera PDF borrador automáticamente |
| REVISION_PDF | Admin | Revisar borrador; aprobar o devolver |
| PENDIENTE_FIRMA | Admin | Descargar, firmar externamente (firma.gub.uy), subir firmado |
| FINALIZADO | — | Terminal. Cliente descarga el certificado |
| RECHAZADO | — | Terminal. Se informa al cliente con el motivo |
| VENCIDO | — | Terminal. Se sugiere renovación |

---

## 6. Generación y firma de PDFs

### Borrador automático

Al pasar a **EN_ELABORACION**, el sistema genera automáticamente un borrador en PDF usando el motor Puppeteer. El borrador:
- Renderiza la plantilla HTML del tipo de certificado
- Reemplaza todos los `{{campos}}` con los datos de la solicitud
- Incluye automáticamente: número de expediente, nombre de empresa, fechas

### PDF sin firma

Desde el estado **REVISION_PDF**, el administrador puede ver el borrador en el panel y aprobarlo.

Al pasar a **PENDIENTE_FIRMA**, se habilita el botón **Descargar PDF sin firma**. Este archivo es el que se lleva a firmar.

### Firma digital

CERTIA se integra con **firma.gub.uy** (servicio oficial del Estado uruguayo) u otro software de firma digital. El proceso es externo al sistema:

1. Descargar el PDF sin firma desde CERTIA
2. Firmar digitalmente usando firma.gub.uy o similar
3. Volver a CERTIA y subir el PDF firmado

### Validación del PDF firmado

Al subir el PDF firmado, el sistema:
- Verifica que el archivo contiene firma digital válida
- Controla que el tamaño sea consistente con el original (máximo 3×)
- Incrusta el **código QR** de verificación en la última página
- Registra la **fecha de emisión** y calcula la **fecha de vencimiento** (365 días por defecto)
- Envía email al cliente con el certificado disponible para descarga

---

## 7. Verificación pública por QR

Cualquier persona puede verificar la autenticidad de un certificado:

1. Escanear el código QR impreso en el certificado
2. Se abre la URL `https://certia-ten.vercel.app/verify/{token}`
3. Se muestra:
   - **VÁLIDO** o **VENCIDO**
   - Número de expediente
   - Empresa
   - Tipo de certificado
   - Fechas de emisión y vencimiento

No requiere login. No muestra información confidencial.

---

## 8. Notificaciones y alertas

### Emails automáticos al cliente

| Evento | Cuándo |
|--------|--------|
| Confirmación de solicitud | Al crear la solicitud |
| Solicitud en revisión | Al pasar a EN_REVISION |
| Observación | Al pasar a OBSERVADO (incluye el motivo) |
| Pago validado | Al pasar a PAGO_VALIDADO |
| Certificado listo | Al pasar a FINALIZADO |
| Solicitud rechazada | Al pasar a RECHAZADO (incluye el motivo) |
| Aviso de vencimiento | A los 30, 15 y 7 días antes del vencimiento |

### Emails automáticos al administrador

| Evento | Cuándo |
|--------|--------|
| Borrador listo | Al generarse un PDF borrador (REVISION_PDF) |
| PDF para firmar | Al aprobar borrador (PENDIENTE_FIRMA) |
| Resumen de vencimientos | Todos los días a las 08:00 AM |

### Notificaciones en tiempo real

El panel actualiza automáticamente el estado de las solicitudes sin necesidad de recargar la página.

---

## 9. Credenciales de prueba

> **Atención:** Estas credenciales son solo para entorno de prueba. Cambiar las contraseñas en producción.

### Administrador

| Campo | Valor |
|-------|-------|
| URL | https://certia-ten.vercel.app/admin/login |
| Email | `admin@certia.uy` |
| Contraseña | `Admin1234!` |

### Cliente de prueba

| Campo | Valor |
|-------|-------|
| URL | https://certia-ten.vercel.app/cliente/login |
| Email | `cliente@certia.uy` |
| Contraseña | `Cliente1234!` |

> El cliente de prueba tiene habilitado el tipo **HC07 — Faena Halal (Arabia)**.

### Para crear un cliente de prueba adicional

1. Ingresar como administrador
2. Ir a **Clientes → Nuevo cliente**
3. Completar nombre, email y contraseña
4. Habilitar el o los tipos de certificado deseados
5. El cliente puede ingresar de inmediato

---

## 10. URLs del sistema

| Recurso | URL |
|---------|-----|
| Frontend (producción) | https://certia-ten.vercel.app |
| API REST (producción) | https://certia-production-14da.up.railway.app/api |
| Health check API | https://certia-production-14da.up.railway.app/health |
| Login admin | https://certia-ten.vercel.app/admin/login |
| Login cliente | https://certia-ten.vercel.app/cliente/login |
| Verificación QR | https://certia-ten.vercel.app/verify/{token} |

### Variables de entorno necesarias en producción

**Backend (Railway):**

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión PostgreSQL |
| `JWT_SECRET` | Clave para tokens de acceso |
| `JWT_REFRESH_SECRET` | Clave para tokens de refresco |
| `CLOUDINARY_URL` | Almacenamiento de PDFs |
| `FRONTEND_URL` | URL del frontend (para CORS y links en emails) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Servidor de email |
| `ANTHROPIC_API_KEY` | Opcional; puede configurarse desde el panel |

**Frontend (Vercel):**

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base del backend |

---

## 11. Preguntas frecuentes

**¿Cómo habilito un nuevo tipo de certificado para un cliente?**
Ir a **Clientes**, seleccionar el cliente, y en la sección de tipos habilitados activar los que correspondan.

**¿El cliente puede subir el comprobante de pago después de enviar la solicitud?**
No directamente; el comprobante solo puede adjuntarse al crear la solicitud. Si el cliente olvidó adjuntarlo, puede enviarlo por otro canal y el administrador valida el pago manualmente al pasar la solicitud a PAGO_VALIDADO.

**¿Qué pasa si la firma digital no es reconocida?**
El sistema rechaza archivos PDF sin firma digital detectada (no contienen los marcadores `/ByteRange`, `/Sig` o `/AcroForm`). Asegurarse de usar un software de firma certificado como firma.gub.uy.

**¿Puedo editar los datos de una solicitud ya enviada?**
Solo cuando está en estado **OBSERVADO**. En ese caso el cliente puede modificar cualquier campo del formulario.

**¿Cuánto tiempo es válido un certificado?**
365 días desde la fecha de emisión (configurable en **Configuración → cert_expiry_days**).

**¿Cómo sé cuándo vence un certificado?**
El sistema envía emails automáticos al cliente a los 30, 15 y 7 días antes del vencimiento. También se muestra en el dashboard del administrador.

**¿Qué es el Wizard IA?**
Una herramienta que analiza un PDF de certificado existente y genera automáticamente la plantilla HTML y el listado de campos para un nuevo tipo de certificado. Requiere tener configurada la API Key de Anthropic.

**¿Se puede cancelar una solicitud ya enviada?**
El administrador puede rechazarla en cualquier estado (excepto FINALIZADO y VENCIDO). El cliente no puede cancelar por sí solo.

**¿Cómo funciona la renovación?**
Cuando un certificado está a 60 días de vencer (o ya venció), el cliente ve el botón **Renovar certificado**. Al hacer clic, se abre el formulario pre-cargado con los datos originales para revisarlos y enviar. La nueva solicitud atraviesa el flujo completo desde cero.

**¿Los webhooks son en tiempo real?**
Sí, se disparan inmediatamente al ocurrir el evento. En caso de fallo del endpoint receptor, el sistema reintenta automáticamente a los 1, 5 y 15 minutos.

---

*Manual generado para CERTIA v1.0 — Centro Islámico del Uruguay*
*Última actualización: junio 2026*
