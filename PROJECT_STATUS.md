"# Estado del Proyecto — VetCare SaaS Multi-Tenant

Este documento centraliza el avance actual, la arquitectura técnica y el estado del sistema.

---

## 🏗️ Arquitectura del Sistema

1. **Backend**: API REST en **NestJS v11** + **TypeScript** + **Prisma ORM 6**
2. **Base de Datos**: **Supabase** (PostgreSQL 17+) con conexión pooler + directa
3. **Auth**: Propio con **JWT + Refresh Token** (rotación segura, 15min access / 7d refresh)
4. **Multi-Tenant**: Modelo `Clinic` con miembros, invitaciones, suscripciones y planes
5. **Frontend Web (NUEVO)**: **React 19 + Next.js 16** (Turbopack) — Funcional y Completado
6. **Frontend Web (LEGADO)**: SPA Vanilla (`/web`) — Reemplazado por Next.js
7. **Frontend Móvil**: App **Flutter** con arquitectura BLoC

---

## 📦 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Backend** | NestJS + TypeScript | 11.x |
| **Base de Datos** | Supabase (PostgreSQL) | 17.x |
| **ORM** | Prisma | 6.x |
| **Auth** | JWT + Refresh Token (rotación) | Propio |
| **Rate Limiting** | @nestjs/throttler | 3 tiers |
| **Frontend Web** | Next.js + React + Tailwind | 16.x / 19.x |
| **State** | Zustand | 5.x |
| **Data Fetching** | SWR | 2.x |
| **Forms** | React Hook Form + Zod | 7.x / 4.x |
| **Icons** | Lucide React | — |
| **Almacenamiento de Imágenes** | Supabase Storage | — |
| **Mobile** | Flutter | 3.x |

---

## 📈 Estado de Avance — Backend (COMPLETO ✅)

### Base de Datos (Supabase + Prisma)
* Esquema Multi-Tenant: `Clinic`, `ClinicMember`, `ClinicInvitation`, `Subscription`
* Auth propio: `User` con `passwordHash`, `role` + `RefreshToken` con rotación segura
* Conexión dual: `DATABASE_URL` (pooler) + `DIRECT_URL` (directa)
* Schema sincronizado con Supabase via `prisma db push`

### Seed de Datos
* 3 usuarios: VET, OWNER, CLINIC_ADMIN
* 1 clínica: VetCare Central con miembros y suscripción PROFESSIONAL
* 3 mascotas, 2 tratamientos, 3 reglas de medicación, 7 daily logs

### Endpoints Auth
```
POST /api/v1/auth/register  → Registro (accessToken + refreshToken)
POST /api/v1/auth/login     → Login (accessToken + refreshToken)
POST /api/v1/auth/refresh   → Renovar tokens (rotación segura)
POST /api/v1/auth/logout    → Revoca refresh tokens
GET  /api/v1/auth/me        → Verificar sesión / obtener perfil (getProfile implementado)
```

### Seguridad
- JWT Access Token: 15 minutos
- Refresh Token: 7 días, rotación (un solo uso)
- Detección de reuso malicioso → revocar TODOS los tokens del usuario
- Rate Limiting: 3 tiers global + por endpoint
- Audit Service: Logging asíncrono
- Helmet + CORS dinámico + ValidationPipe

---

## 📈 Estado de Avance — Frontend Next.js (COMPLETO ✅)

### Estructura del Proyecto (`/web-next`)

El frontend de Next.js se ha estructurado con un patrón BFF (Backend For Frontend), donde las peticiones externas al API REST pasan mediante rutas de servidor, asegurando que los tokens de seguridad queden protegidos en cookies `httpOnly`. 

Se han completado los siguientes módulos:

1. **Autenticación (Auth UI)**
   - Vistas de Login y Registro validadas con Zod.
   - Estado centralizado con Zustand (`auth-store.ts`).
   - Middleware redirigiendo de acuerdo a la existencia de tokens.
2. **Dashboard Veterinario**
   - Panel principal mostrando el **Semáforo de Tratamientos**.
   - Buscador de pacientes y vista de detalle por mascota con su historial de tratamientos.
3. **Dashboard Dueño (Owner)**
   - Vista de listado de mascotas propias.
   - Vista de tratamientos y un formulario interactivo para **Daily Logs** (registros diarios de medicinas, temperatura, apetito, dolor, y energía).
   - **Subida de fotos** en cada Daily Log: el dueño puede adjuntar una foto de la herida o evolución de la mascota directamente desde el formulario, con preview local instantáneo.
   - **Historial con fotos**: cada log guardado muestra la imagen subida con un lightbox para verla en tamaño completo.
4. **Dashboard de Clínicas**
   - Vistas generales y detalladas para que los administradores controlen el estado de sus miembros, invitaciones y la cuota máxima del plan.
5. **UI & Theme**
   - Se ha consolidado en `globals.css` el tema oscuro *Slate/Mint* mediante CSS nativo y Tailwind, logrando interfaces de tipo *Glassmorphism*.
   - Skeletons automáticos y diseño totalmente *Responsive*.

### Arquitectura de Seguridad (BFF + httpOnly Cookies)

```
Browser (JavaScript)                    Next.js BFF                         NestJS Backend
     │                                     │                                    │
     │  POST /api/auth/login               │                                    │
     │  { email, password }                │                                    │
     │ ──────────────────────────────────> │                                    │
     │                                     │  POST /api/v1/auth/login           │
     │                                     │ ──────────────────────────────────> │
     │                                     │  { accessToken, refreshToken }     │
     │                                     │ <────────────────────────────────── │
     │  Set-Cookie: access_token (httpOnly)│                                    │
     │  Set-Cookie: refresh_token (httpOnly)│                                   │
     │  { user }                           │                                    │
     │ <────────────────────────────────── │                                    │
```

### Correcciones Recientes
- **Estado de Sesión**: Se solucionó el bug de carga infinita ("Cargando...") en las rutas protegidas (`/dashboard`, `/vet`, `/owner`) importando el hook `useAuth()` en el layout principal para forzar la validación inicial contra el servidor y actualizar el estado global.
- **Bucle de Redirecciones (BFF Proxy)**: Se corrigió una falla en el proxy de Next.js (`api/v1/[...path]/route.ts`) que causaba un bucle infinito entre `/dashboard` y `/login`. Ahora, si el `access_token` falta pero existe el `refresh_token`, intenta refrescarlo correctamente, y si falla, limpia explícitamente ambas cookies (`maxAge: 0`) para notificar al middleware.
- **Fotos en Daily Logs (Supabase Storage)**: Se implementó la subida de fotos de evolución post-operatoria en los Daily Logs del dueño. Cloudinary fue reemplazado por **Supabase Storage** (ya en uso como BD) dado que Cloudinary no está disponible geográficamente. La imagen se sube desde el BFF de Next.js al backend NestJS vía `POST /api/v1/upload/image`, que la deposita en el bucket de Supabase usando la Service Role Key (nunca expuesta al cliente). Las fotos se muestran en el historial con un visor lightbox.
- **Configuración de Puertos y Proxy**: Se actualizó el archivo `middleware.ts` a `proxy.ts` para cumplir con el estándar de Next.js 16. Además, se forzó el puerto `3001` en `package.json` para el frontend, evitando colisiones con el backend en el `3000`. También se configuró `NEXT_PUBLIC_API_URL` a `http://127.0.0.1:3000` para resolver fallos de conexión por resolución de IPv6 (`::1`) en Windows.
- **Ruta de Clínicas**: Se arregló un bug donde el panel de Mis Clínicas (`/clinics`) enviaba peticiones al endpoint incorrecto, causando que el backend interpretara `my` como un UUID malformado. La ruta fue corregida y el mapeo de `ClinicMember` a `Clinic` fue ajustado en el frontend para asegurar la navegación al detalle.


---

## 🚀 Guía de Ejecución Rápida

### Backend
```bash
cd backend
# Configurar .env con credenciales Supabase
npx prisma db push --accept-data-loss
npx ts-node prisma/seed.ts
npm run start:dev
# API: http://localhost:3000/api/v1
```

### Frontend Next.js
```bash
cd web-next
# Crear .env.local con:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:3000
npm run dev
# App web en: http://localhost:3001
```

### Credenciales de Prueba
| Rol | Email | Password |
|-----|-------|----------|
| Veterinario | `vet@test.com` | `vet123` |
| Dueño | `owner@test.com` | `owner123` |
| Admin Clínica | `admin@test.com` | `admin123` |

---

## 🔮 Plan a Seguir — Próximos Pasos (FUTURO)

Con el Frontend Web MVP (Minimum Viable Product) al 100% terminado y la compilación exitosa sin errores (`npm run build`), el proyecto se encuentra en una etapa madura.

### Desarrollo y Operaciones (DevOps & QA)
- [ ] Tests unitarios + e2e (backend + frontend, con Jest, Cypress o Playwright).
- [ ] CI/CD Pipelines con GitHub Actions (Linting, Testing y Auto-Build).
- [ ] Conexión y migración segura de datos en el entorno de Producción real en Supabase.
- [ ] Configuración del script *cron job* para limpieza periódica de RefreshTokens expirados o revocados en la base de datos.

### Expansión Funcional
- [ ] Actualizar App de Flutter para consumir el nuevo Auth Flow con Refresh Tokens.
- [ ] Módulo de Emergencias (Notificaciones en tiempo real con WebSockets o FCM).
- [ ] SaaS B2B Gestión de Equipos: Pasarela de pagos, upgrades de licencias de clínicas.
- [ ] Implementación de Email Service (Nodemailer o Resend) para el envío real de las invitaciones por correo electrónico a la clínica.
- [x] Subida de imágenes en Daily Logs — implementado con **Supabase Storage** (Cloudinary descartado por restricción geográfica).

---

## 💻 Tutorial: Cómo levantar el entorno local (Backend + Frontend)

Para ejecutar este ecosistema en tu máquina, necesitarás abrir **dos ventanas de terminal separadas**, ya que cada proyecto tiene su propio servidor en desarrollo.

### 1. Iniciar el Backend (NestJS)
Abre la primera terminal y dirígete a la carpeta del backend. Asegúrate de tener configuradas tus variables de entorno, y luego inicia el modo desarrollo:

```bash
cd backend
npm run start:dev
```
*Esto levantará el servidor backend, típicamente en el puerto 3000.*

### 2. Iniciar el Frontend (Next.js)
Abre una segunda terminal, dirígete a la carpeta del frontend y levanta su servidor de desarrollo:

```bash
cd web-next
npm run dev
```
*El frontend está configurado para correr por defecto en el puerto `3001` (`http://localhost:3001`) para evitar colisiones de red con el backend.*

"