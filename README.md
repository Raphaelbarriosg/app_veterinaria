# 🐾 VetCare — Ecosistema Veterinario

Sistema completo para el **seguimiento post-operatorio de mascotas**, compuesto por una API REST, una aplicación móvil y un frontend web.

## 📦 Estructura del Monorepo

```
app_veterinaria/
├── backend/     # API REST — NestJS 11 + PostgreSQL 17 + Prisma 6
├── mobile/      # App móvil — Flutter
└── web-next/    # Frontend web — Next.js 16 + React 19 (Tailwind v4)
```

## 🚀 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Backend** | NestJS + TypeScript | 11.x |
| **Base de Datos** | PostgreSQL | 17.x |
| **ORM** | Prisma | 6.x |
| **Cache** | Redis | 7.x |
| **Mobile** | Flutter | 3.x |
| **Contenedores** | Docker + Compose | V2 |
| **Proxy** | Traefik | 3.x |

## ⚡ Inicio Rápido (Docker)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Raphaelbarriosg/app_veterinaria.git
cd app_veterinaria/backend

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Levantar todo con Docker
docker compose -f docker-compose.dev.yml up --build
```

**Servicios disponibles:**

| Servicio | URL |
|----------|-----|
| API | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/api/docs |
| Prisma Studio | http://localhost:5555 |
| pgAdmin | http://localhost:5050 |

## 🔑 Credenciales de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| Veterinario | `vet@test.com` | `vet123` |
| Dueño | `owner@test.com` | `owner123` |
| Admin Clínica | `admin@test.com` | `admin123` |

## 📚 Documentación

- [`backend/README.md`](./backend/README.md) — Guía completa del backend
- [`backend/README-DOCKER.md`](./backend/README-DOCKER.md) — Guía Docker
- [`backend/DEPLOYMENT.md`](./backend/DEPLOYMENT.md) — Guía de deployment
- [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) — Estado actual del proyecto

## 🗄️ Modelo de Datos

```
User (VET | OWNER | CLINIC_ADMIN | SUPER_ADMIN)
  ├── Clinic (Multi-tenant)
  └── Pet
        └── Treatment
              ├── TreatmentRule  (medicación, dosis, frecuencia)
              └── DailyLog       (apetito, energía, dolor, temperatura)
```

## 📄 Licencia

MIT © [Raphaelbarriosg](https://github.com/Raphaelbarriosg)

