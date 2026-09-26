# 🚀 Guía de Despliegue en la Nube — VetCare SaaS

Esta guía te muestra cómo desplegar **Backend (NestJS)** en **Render** y **Frontend (Next.js)** en **Vercel**, conectándolos a tu base de datos y almacenamiento ya existentes en **Supabase**.

---

## 🗺️ Arquitectura del Despliegue

```
┌─────────────────────────────────┐
│     Vercel (Plan Hobby)         │
│     Frontend: web-next          │  ← (Tu dominio: https://vetcare.vercel.app)
└──────────────┬──────────────────┘
               │ BFF Proxy (/api/v1/...)
               ▼
┌─────────────────────────────────┐
│     Render (Web Service)        │
│     Backend: NestJS + Cron      │  ← (https://vetcare-backend.onrender.com)
└──────────────┬──────────────────┘
               │ PostgreSQL (Pooler 6543) + Storage
               ▼
┌─────────────────────────────────┐
│     Supabase Cloud              │  ← (Ya configurado y funcionando)
└─────────────────────────────────┘
```

---

## Paso 1: Subir tus Cambios a GitHub

Asegúrate de tener tus últimos cambios subidos al repositorio:

```bash
git add .
git commit -m "chore: setup deployment configurations for vercel and render"
git push origin main
```

---

## Paso 2: Desplegar el Backend en Render.com

Render es ideal para NestJS porque mantiene el servidor en ejecución continua, permitiendo que funcionen los **Cron Jobs** (`cron.module.ts`) y la conexión de base de datos sin problemas de cold starts extremos.

1. Ve a [dashboard.render.com](https://dashboard.render.com/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu repositorio `app_veterinaria`.
4. Completa los campos con la siguiente configuración:

| Campo | Valor |
|---|---|
| **Name** | `vetcare-backend` (o el nombre que elijas) |
| **Region** | `Ohio (US East)` (misma región de tu Supabase) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install --include=dev && npx prisma generate && npm run build` |
| **Start Command** | `node dist/main.js` |
| **Instance Type** | `Free` |

5. Despliega la sección **Environment Variables** y agrega las siguientes variables (puedes copiarlas desde tu archivo `backend/.env`):

| Clave | Valor |
|---|---|
| `NODE_VERSION` | `22` |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | *(Tu URL de Supabase Pooler del archivo backend/.env)* |
| `DIRECT_URL` | *(Tu URL de Supabase Direct del archivo backend/.env)* |
| `JWT_SECRET` | *(Tu secreto JWT de al menos 32 caracteres)* |
| `JWT_EXPIRATION` | `24h` |
| `SUPABASE_URL` | `https://kopcemtwnflizospnoxh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Tu Service Role Key de Supabase)* |
| `SUPABASE_STORAGE_BUCKET` | `vet-app-images` |
| `CORS_ORIGIN` | `*` |

6. Haz clic en **Create Web Service**.
7. Una vez completado el despliegue (tardará 2-3 minutos), copia la URL que Render te asigna (ejemplo: `https://vetcare-backend.onrender.com`).
8. Verifica que responda abriendo en tu navegador:
   `https://vetcare-backend.onrender.com/api/v1/health`

---

## Paso 3: Desplegar el Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **Add New...** > **Project**.
3. Importa tu repositorio `app_veterinaria`.
4. En la pantalla de configuración:
   * **Framework Preset**: Detectará automáticamente `Next.js`.
   * **Root Directory**: Haz clic en **Edit** y selecciona la carpeta **`web-next`**. *(¡Muy importante!)*
   * Deja el Build Command y Output Directory por defecto.
5. En la sección **Environment Variables**, agrega:

| Clave | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://vetcare-backend-vxua.onrender.com` |

6. Haz clic en **Deploy**.
7. Tu aplicación web se encuentra activa en:
   **`https://appveterinaria-five.vercel.app`**

---

## Paso 4: Probar la Aplicación en la Nube (¡Verificado con éxito! ✅)

1. Abre la URL en producción: **https://appveterinaria-five.vercel.app**
2. Inicia sesión con cualquiera de los usuarios de prueba:
   * **Veterinario**: `vet@test.com` / `vet123`
   * **Dueño**: `owner@test.com` / `owner123`
   * **Administrador**: `admin@test.com` / `admin123`
3. Comprueba el correcto funcionamiento del dashboard, subida de fotos y semáforo clínico.

---

## Paso 5: App Móvil (Flutter) — Descargar e Instalar en tu Teléfono

El APK ya ha sido compilado en la nube con GitHub Actions:

### 📥 Descarga Directa del APK:
1. Entra a tu pipeline de GitHub: **[Última ejecución de GitHub Actions (Versión 1.0.0+3)](https://github.com/Raphaelbarriosg/app_veterinaria/actions/runs/36206890006)**
2. En la sección inferior **Artifacts**, haz clic en **`vetcare-app-release`** (archivo zip de ~32 MB).
3. Descomprime el archivo zip para obtener **`app-release.apk`**.
4. Pasa el archivo a tu teléfono Android (o descárgalo directamente desde el navegador de tu teléfono) e instálalo.
5. Inicia sesión con cualquiera de los usuarios de prueba:
   * **Veterinario**: `vet@test.com` / `vet123`
   * **Dueño**: `owner@test.com` / `owner123`
   * **Administrador**: `admin@test.com` / `admin123`

---

### 💻 Compilación manual opcional:
* En dispositivo físico conectado por USB:
  ```bash
  flutter run --dart-define=API_BASE_URL=https://vetcare-backend-vxua.onrender.com/api/v1
  ```
* Generación local de APK:
  ```bash
  flutter build apk --dart-define=API_BASE_URL=https://vetcare-backend-vxua.onrender.com/api/v1
  ```

---

## 🧹 Cómo Liberar Memoria RAM en tu PC Ahora Mismo

Si tu máquina se quedó congelada, es muy probable que haya procesos huérfanos consumiendo memoria:

1. **Cerrar Emuladores de Android**:
   Si tienes un emulador abierto, ciérralo. Ahorrarás entre 3 y 5 GB de memoria RAM de inmediato.

2. **Terminar Procesos Node.js en Segundo Plano** (desde PowerShell):
   ```powershell
   Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

3. **Cerrar servidores locales**:
   Una vez que el backend y frontend estén en Render y Vercel, ya no necesitas ejecutar `npm run start:dev` ni `npm run dev` en tu computadora para probar la aplicación.
