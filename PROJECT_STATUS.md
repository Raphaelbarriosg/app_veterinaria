# Estado del Proyecto — VetCare SaaS Multi-Tenant

> Última actualización: 18 de julio de 2026

Este documento centraliza el avance actual, la arquitectura técnica y el estado real del sistema.

---

## 🏗️ Arquitectura del Sistema

1. **Backend**: API REST en **NestJS v11** + **TypeScript** + **Prisma ORM 6**
2. **Base de Datos**: **Supabase** (PostgreSQL 17+) con conexión pooler + directa
3. **Auth**: Propio con **JWT + Refresh Token** (rotación segura, 15min access / 7d refresh)
4. **Multi-Tenant**: Modelo `Clinic` con miembros, invitaciones, suscripciones y planes
5. **Frontend Web**: **React 19 + Next.js 16** (Turbopack) — Build exitoso (19 rutas) ✅
6. **Frontend Móvil**: App **Flutter** con arquitectura BLoC — 3 roles cubiertos ✅
7. **Almacenamiento**: **Supabase Storage** (bucket `vet-uploads`) para fotos de evolución
8. **CI/CD**: **GitHub Actions** con pipelines para backend y frontend

---

## 📦 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------| 
| **Backend** | NestJS + TypeScript | 11.x |
| **Base de Datos** | Supabase (PostgreSQL) | 17.x |
| **ORM** | Prisma | 6.x |
| **Auth** | JWT + Refresh Token (rotación) | Propio |
| **Rate Limiting** | @nestjs/throttler | 3 tiers |
| **Swagger** | @nestjs/swagger | 11.x |
| **Email** | Nodemailer + Dry-Run | 9.x |
| **Cron** | @nestjs/schedule | 6.x |
| **Storage** | @supabase/supabase-js | 2.x |
| **Frontend Web** | Next.js + React + Tailwind | 16.x / 19.x |
| **State (Web)** | Zustand | 5.x |
| **Data Fetching** | SWR | 2.x |
| **Forms (Web)** | React Hook Form + Zod | 7.x / 4.x |
| **Mobile** | Flutter + BLoC | 3.x |
| **HTTP (Mobile)** | Dio + QueuedInterceptorsWrapper | 5.x |
| **Storage (Mobile)** | flutter_secure_storage | 9.x |

---

## ✅ Builds y Tests Verificados

| Proyecto | Comando | Resultado | Fecha |
|----------|---------|----------| ------|
| Backend | `npx nest build` | ✅ Sin errores | 22-sep-2026 |
| Backend Tests | `npm test` | ✅ 11 tests unitarios Jest pasados | 22-sep-2026 |
| Frontend | `npx next build` | ✅ Sin errores (19 rutas) | 22-sep-2026 |
| Frontend E2E | `npx playwright test` | ✅ 14 tests E2E Playwright pasados | 22-sep-2026 |

---

## 📈 Estado de Avance — Backend (COMPLETO ✅)

### Módulos activos (14 módulos)

| Módulo | Endpoints | Funcionalidad |
|--------|-----------|---------------|
| **Auth** | `/api/v1/auth` | Register, Login, Refresh, Logout, Me |
| **Users** | `/api/v1/users` | Gestión de usuarios |
| **Pets** | `/api/v1/pets` | CRUD mascotas (resolveClinicId multi-tenant) |
| **Treatments** | `/api/v1/treatments` | Tratamientos + Semáforo Clínico Refactorizado |
| **Daily Logs** | `/api/v1/daily-logs` | Reportes diarios (logType: OWNER/CLINICAL, edición 24h) |
| **Medication Logs** ⭐ | `/api/v1/medication-logs` | Dosis individuales, cálculo de compliance y LATE check |
| **Control Visits** ⭐ | `/api/v1/control-visits` | Citas de control programadas, cambios de estado y recordatorios |
| **Post-Op Protocols** ⭐ | `/api/v1/post-op-protocols` | Plantillas de alarmas y restricciones según ProcedureType |
| **Discharge Sheets** ⭐ | `/api/v1/discharge-sheets` | Altas médicas para el paciente en casa con medicinas |
| **Upload** | `/api/v1/upload/image` | Subida de imágenes a **Supabase Storage** |
| **Clinics** | `/api/v1/clinics` | CRUD + Miembros + Invitaciones por token |
| **Emergency** | `/api/v1/emergency` | Reporte urgente (log + email a clínica) |
| **Mail** | (interno) | Nodemailer + Dry-Run + control reminders & alerts |
| **Cron** | (interno) | Limpieza de RefreshTokens + próximas citas |
| **Health** | `/api/v1/health` | Health check |
| **Audit** | (interno) | Logging asíncrono de operaciones |

> ⚠️ **Módulo `cloudinary` eliminado** el 18-jul-2026 — reemplazado por `upload` con Supabase Storage.

### Seguridad
- JWT Access Token: 15 minutos
- Refresh Token: 7 días, rotación (un solo uso, revocación en cadena)
- Rate Limiting: 3 tiers global + por endpoint (`short` / `medium` / `long`)
- Helmet + CORS dinámico + ValidationPipe global
- Audit Service: logging asíncrono por operación (incluye `DAILY_LOG_UPDATED`)

### Tests Unitarios (Jest)
- ✅ 11 tests pasados (AuthService, MailService, CronService, AppController)
- ⚠️ Sin tests E2E ni de integración (pendiente)

### Infraestructura
- ✅ Dockerfile + docker-compose.yml (producción)
- ✅ docker-compose.dev.yml (desarrollo)
- ✅ Makefile con comandos útiles
- ✅ Traefik como reverse proxy configurado
- ✅ DEPLOYMENT.md documentado

### Seed
- 3 usuarios: VET, OWNER, CLINIC_ADMIN
- 1 clínica: VetCare Central con miembros y suscripción PROFESSIONAL
- 3 mascotas, 3 tratamientos con procedureType y reglas, 3 daily logs (OWNER/CLINICAL), 1 protocolo post-op, 2 citas de control, 1 hoja de alta, y 3 medication logs de dosis individuales.

---


## 📈 Estado de Avance — Frontend Next.js (COMPLETO ✅)

### Estructura (`/web-next/src`)

```
app/
├── layout.tsx                    ✅ Root layout (Geist fonts, dark mode)
├── globals.css                   ✅ Slate/Mint + Glassmorphic + animaciones
├── page.tsx                      ✅ Root redirect (cookies → /dashboard)
├── proxy.ts                      ✅ Next.js 16 proxy (auth protection)
├── (auth)/
│   ├── layout.tsx                ✅ Auth layout
│   ├── login/page.tsx            ✅ Login con Zod
│   └── register/page.tsx         ✅ Register con Zod
├── (dashboard)/
│   ├── layout.tsx                ✅ Sidebar + header + navegación por rol
│   ├── dashboard/page.tsx        ✅ Dashboard general (redirect por rol)
│   ├── clinic-admin/
│   │   └── page.tsx              ✅ Panel CLINIC_ADMIN (Stats tiempo real, Tab Equipo e Invitaciones, Config)
│   ├── vet/
│   │   ├── page.tsx              ✅ Semáforo + stats + modal evolución
│   │   └── pets/[id]/page.tsx    ✅ Detalle mascota + prescribir tratamiento
│   ├── owner/
│   │   ├── page.tsx              ✅ Lista mascotas + crear mascota
│   │   └── pets/[id]/page.tsx    ✅ Detalle + editar/eliminar + daily logs + fotos
│   └── clinics/
│       ├── page.tsx              ✅ Lista de clínicas
│       └── [id]/page.tsx         ✅ Detalle clínica (acceso a admin + invitaciones)
├── api/
│   ├── auth/
│   │   ├── login/route.ts        ✅ BFF: Login + httpOnly cookies
│   │   ├── register/route.ts     ✅ BFF: Register + httpOnly cookies
│   │   ├── refresh/route.ts      ✅ BFF: Refresh token rotation
│   │   └── logout/route.ts       ✅ BFF: Logout + clear cookies
│   ├── upload/route.ts           ✅ BFF: Upload proxy → NestJS → Supabase
│   └── v1/[...path]/route.ts     ✅ BFF: API proxy con auto-refresh
components/ui/                    ✅ Button, Input, Select, Spinner, Toast
hooks/                            ✅ use-auth, use-pets, use-treatments, use-daily-logs
lib/                              ✅ api-client, utils (tipos + helpers)
stores/                           ✅ auth-store (Zustand)
```

### Features Implementadas
- ✅ Login/Register con Zod + httpOnly cookies
- ✅ Dashboard VET: Semáforo (RED/YELLOW/GREEN), stats, modal evolución, finalizar tratamiento
- ✅ Dashboard OWNER: Lista mascotas, crear/editar/eliminar mascota, daily logs con sliders
- ✅ Subida de fotos en Daily Logs (Supabase Storage via BFF)
- ✅ Lightbox para ver fotos en tamaño completo
- ✅ Prescribir tratamiento con reglas dinámicas (VET only)
- ✅ Clínicas: lista + detalle
- ✅ Paginación en historial de logs
- ✅ Skeleton loaders
- ✅ Responsive mobile con sidebar toggle

---

## 📈 Estado de Avance — App Móvil Flutter (FUNCIONAL ✅)

### Arquitectura BLoC

| Feature | BLoC | Repository | Pages | Estado |
|---------|------|-----------|-------|--------|
| `auth` | ✅ | ✅ | login, register | ✅ |
| `pets` | ✅ | ✅ | pet_detail, pet_form | ✅ |
| `treatments` | ✅ | ✅ | create_treatment, treatment_detail | ✅ |
| `daily_logs` | ✅ | ✅ | daily_log_form, daily_logs_history | ✅ |
| `home` | N/A | N/A | owner_home, vet_home, **clinic_admin_home** | ✅ |

### Páginas Home por Rol

| Rol | Página | Tabs |
|-----|--------|------|
| `VET` | `VetHomePage` | Prioridades (semáforo), Historial, Perfil |
| `OWNER` | `OwnerHomePage` | Mascotas, Perfil |
| `CLINIC_ADMIN` | `ClinicAdminHomePage` ⭐ | Clínica (stats), Equipo, Perfil |

### Rutas de navegación (11 rutas)
`/login`, `/register`, `/owner-home`, `/vet-home`, `/clinic-admin-home` ⭐, `/pet-detail`, `/pet-form`, `/create-treatment`, `/treatment-detail`, `/daily-log-form`, `/daily-logs-history`

### API Client
- ✅ `QueuedInterceptorsWrapper` para refresh token transparente
- ✅ Revocación automática en error de refresh
- ✅ URL base configurable por entorno con `--dart-define` ⭐
- ✅ Upload de fotos a Supabase Storage vía backend (POST multipart a `/upload/image`) ⭐

### Variables de Entorno
```bash
# Emulador Android
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1

# Dispositivo físico
flutter run --dart-define=API_BASE_URL=http://192.168.1.X:3000/api/v1

# Producción
flutter build apk --dart-define=API_BASE_URL=https://api.tudominio.com/api/v1
```
> Ver `mobile/.env.example` para referencia completa.

---

## 🧹 Historial de Limpiezas

| Fecha | Elemento eliminado | Razón |
|-------|-------------------|-------|
| 18-jul-2026 | `backend/src/modules/cloudinary/` | Reemplazado por `upload` con Supabase Storage |
| 18-jul-2026 | Tag Swagger `cloudinary` en `main.ts` | Ya no existe el módulo |
| 22-sep-2026 | `web/` y `web-nuxt/` | Eliminados definitivamente tras validar paridad completa con `web-next/` |

### Proyectos frontend
| Directorio | Estado | Activo |
|-----------|--------|--------|
| `web-next/` | **ACTIVO** (Next.js 16 + React 19) | ✅ |

---

## 🚀 Guía de Ejecución Rápida

### Backend
```bash
cd backend
# Configurar .env con credenciales Supabase
# Requeridas: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET=vet-uploads
npx prisma db push --accept-data-loss
npx ts-node prisma/seed.ts
npm run start:dev
# API: http://localhost:3000/api/v1
# Docs: http://localhost:3000/api/docs
```

### Frontend Next.js
```bash
cd web-next
# Crear .env.local con:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:3000
npm run dev
# App: http://localhost:3001
```

### App Flutter
```bash
cd mobile
flutter pub get
# Emulador Android (10.0.2.2 = localhost del host):
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
# Dispositivo físico (reemplazar IP):
flutter run --dart-define=API_BASE_URL=http://192.168.16.107:3000/api/v1
```

### Credenciales de Prueba (Seed)
| Rol | Email | Password |
|-----|-------|----------|
| Veterinario | `vet@test.com` | `vet123` |
| Dueño | `owner@test.com` | `owner123` |
| Admin Clínica | `admin@test.com` | `admin123` |

---

## 🔮 Plan a Seguir

### Completado ✅
- [x] Backend completo (14 módulos activos con endpoints de estadísticas en tiempo real, invitaciones y roles de clínica)
- [x] Frontend Next.js completo (19 rutas, build exitoso y contrastes corregidos)
- [x] **Página CLINIC_ADMIN en web** — Dashboard con stats en tiempo real de la clínica (KPIs, desglose de especies, cuotas de plan), Tab Equipo completo (invitaciones con enlace y revocación, cambio de rol, remoción segura) y pestaña de Configuración general
- [x] **Tests E2E con Playwright (web)** — 14 tests automatizados cubriendo flujos de login por rol, panel CLINIC_ADMIN, dashboard VET (semáforo y búsqueda) y portal OWNER (mascotas)
- [x] Refactorización clínica del módulo Post-Operatorio (MedicationLogs, ControlVisits, PostOpProtocols, DischargeSheets) en Backend y Frontend Web (Next.js) con semáforo inteligente y edición de 24h
- [x] Flutter: 3 roles con home pages propias (VET, OWNER, CLINIC_ADMIN)
- [x] Upload de fotos: Flutter → Backend → Supabase Storage (flujo E2E)
- [x] URL base de API configurable por entorno en Flutter (`--dart-define`)
- [x] Módulo Cloudinary eliminado del backend
- [x] Tests unitarios Jest (11 tests)
- [x] CI/CD con GitHub Actions
- [x] Email Service con soporte Dry-Run
- [x] Cron job para limpieza de RefreshTokens
- [x] Módulo de Emergencias
- [x] SaaS B2B: roles CLINIC_ADMIN + membresías
- [x] Modelo de suscripción con planes
- [x] **Eliminar `web/` y `web-nuxt/`** — eliminados tras confirmar paridad completa con `web-next/`
- [x] **Configuración de despliegue en la Nube** — Blueprint de Render (`render.yaml`), soporte de imágenes Supabase en Next.js y guía detallada en `DEPLOY_GUIDE.md`

### Pendiente
- [ ] **Notificaciones push en Flutter** — alertas de tratamientos activos
- [ ] **Pasarela de pagos** — integración real (actualmente solo modelo de datos)

