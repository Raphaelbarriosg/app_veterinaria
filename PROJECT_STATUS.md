# Estado del Proyecto — Ecosistema Veterinario (VetCare)

Este documento centraliza el avance actual, la arquitectura técnica y el estado de la **Fase 1** del sistema para que cualquier otro asistente de IA o desarrollador pueda entender el contexto y retomar el trabajo de forma inmediata.

---

## 🏗️ Arquitectura del Sistema

El ecosistema está diseñado bajo una arquitectura desacoplada donde el backend sirve tanto a clientes web como móviles:
1.  **Backend**: API REST desarrollada en **NestJS v11** utilizando **TypeScript**, **Prisma ORM** y **PostgreSQL**.
2.  **Base de Datos**: PostgreSQL 17 corriendo en un contenedor de Docker (`veterinaria-postgres-dev`).
3.  **Frontend Web (Prototipo Fase 1)**: SPA (Single Page Application) responsiva construida con **HTML5, CSS3 (Vanilla)** y **Javascript (Vanilla, ES6)**, diseñada con estética premium dark mode (Slate/Mint) y Glassmorphic.
4.  **Frontend Móvil**: Aplicación en desarrollo construida con **Flutter**.

---

## 📈 Estado de Avance (Hitos Completados)

### 1. Base de Datos (PostgreSQL & Prisma)
*   **Esquema Sincronizado**: El esquema de base de datos se actualizó a la última versión en `schema.prisma`. Se mapeó correctamente la extensión `uuid-ossp` en Prisma usando la definición `uuidOssp(map: "uuid-ossp")` para asegurar compatibilidad con PostgreSQL.
*   **Push de Esquema**: Se ejecutó `npx prisma db push --accept-data-loss` de forma exitosa sobre el contenedor PostgreSQL.
*   **Seed Completado**: Se corrigió el script `prisma/seed.ts` para que los tratamientos creados utilicen IDs con formato UUIDv4 válidos (en lugar de strings mock). El script de seeding se ejecuta exitosamente (`npx ts-node prisma/seed.ts`), creando:
    *   **Veterinario (VET)**: `vet@test.com` con contraseña `vet123`.
    *   **Dueño (OWNER)**: `owner@test.com` con contraseña `owner123`.
    *   **Mascotas**: 3 registros (`Luna`, `Simba` y `Rocky`).
    *   **Tratamientos y Reglas**: 2 tratamientos post-operatorios y 3 reglas de dosificación asociadas.
    *   **Historial Diario (Daily Logs)**: 7 registros de evolución con datos de simulación.

### 2. Backend (NestJS API)
*   **Soporte CORS Multicliente**: Configurado en `main.ts` con un callback dinámico. Permite solicitudes seguras usando `credentials: true` e incluye soporte explícito para origen `null` (navegadores cargando archivos directos con el protocolo `file://`).
*   **Logs de Excepciones**: Se modificó `http-exception.filter.ts` para imprimir en consola (`console.error`) las excepciones no controladas (errores 500) para facilitar la depuración.
*   **Ampliación del DTO de Daily Logs**: Se actualizaron [CreateDailyLogDto](file:///c:/xampp/htdocs/app_veterinaria/backend/src/modules/daily-logs/dto/create-daily-log.dto.ts) y [DailyLogsService](file:///c:/xampp/htdocs/app_veterinaria/backend/src/modules/daily-logs/daily-logs.service.ts) para recibir y persistir en la base de datos los campos clínicos críticos: `painLevel` (nivel de dolor, 1-10), `temperature` (temperatura rectal en °C) y `observations` (observaciones generales).
*   **Compilación**: El backend compila al 100% sin advertencias ni errores TypeScript.

### 3. Frontend Web (`/web`)
*   **Autenticación**: Inicio de sesión y registro funcionales con persistencia del token JWT y el rol del usuario en `localStorage`.
*   **Dashboard VET**:
    *   Buscador dinámico de pacientes (mascotas).
    *   Formulario modal de prescripción con reglas de medicación dinámicas (medicamento, dosis, frecuencia, requisito de foto).
    *   Semáforo de tratamientos activos en tiempo real (Rojo si no hay reportes de las últimas 24h o hay signos de alarma; Amarillo si no se cumplió la medicación o hay energía/apetito bajo; Verde si todo está estable).
    *   Visualizador de evolución del tratamiento detallado (con historial de métricas, dolor, temperatura e imágenes).
*   **Dashboard OWNER**:
    *   Formulario de registro de nuevas mascotas.
    *   Tarjeta informativa de tratamientos activos.
    *   Formulario modal de reporte diario (Daily Log) con sliders de apetito, energía, dolor, temperatura, alarma y foto.
*   **Carga Inteligente de Imágenes (Cloudinary Fallback)**:
    *   Flujo real implementado (obtiene firma del backend e interactúa con la API de Cloudinary).
    *   **Simulación Inteligente (Fallback)**: Si no se configuran credenciales reales en `.env` (se dejan los placeholders demo) o si la cuenta está inactiva (`cloud_name is disabled`), el frontend intercepta el error, muestra una advertencia y simula exitosamente la subida cargando una foto demo de veterinaria. Esto mantiene el prototipo 100% funcional.
*   **Ajustes de UI/CSS**: Corregido un typo en la propiedad de borde de la clase `.glass-card` en [styles.css](file:///c:/xampp/htdocs/app_veterinaria/web/styles.css).

---

## 🚀 Guía de Ejecución Rápida

### 1. Requisitos Previos
*   Docker y Docker Compose instalados.
*   Node.js instalado en el sistema.

### 2. Levantar Base de Datos y Backend
Desde la carpeta raíz del proyecto:

```bash
# 1. Iniciar contenedor de PostgreSQL en segundo plano
cd backend
docker compose -f docker-compose.dev.yml up postgres -d

# 2. Resetear, aplicar esquema y cargar semilla (opcional si es primera vez)
npx prisma db push --accept-data-loss
npx ts-node prisma/seed.ts

# 3. Iniciar servidor de desarrollo NestJS
npm run start:dev
```

*El backend correrá en: `http://localhost:3000/api/v1`*

### 3. Ejecutar Frontend Web
Puedes abrir el archivo [index.html](file:///c:/xampp/htdocs/app_veterinaria/web/index.html) directamente en tu navegador (protocolo `file://`), o servirlo mediante Apache (XAMPP) en la ruta correspondiente:
`http://localhost/app_veterinaria/web/index.html`

#### Credenciales de Prueba:
*   **Rol VET (Veterinario)**:
    *   Email: `vet@test.com`
    *   Contraseña: `vet123`
*   **Rol OWNER (Dueño)**:
    *   Email: `owner@test.com`
    *   Contraseña: `owner123`

---

## 🔮 Próximos Pasos (Fase 2)

*   **Integración Móvil (Flutter)**:
    *   Asegurar que los modelos y peticiones de red en la aplicación Flutter (`mobile/`) consuman los mismos endpoints que ya están validados en el frontend web.
    *   Revisar si la aplicación móvil requiere soporte para el envío de `painLevel` y `temperature` en sus respectivas pantallas de reporte.
*   **Despliegue y Cloudinary**:
    *   Sustituir las credenciales demo en `backend/.env` por claves reales de Cloudinary en entorno de producción.
