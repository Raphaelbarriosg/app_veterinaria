<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
  <h1 align="center">Ecosistema Veterinario MVP</h1>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11.0.1-red" alt="NestJS Version">
  <img src="https://img.shields.io/badge/TypeScript-5.7.3-blue" alt="TypeScript Version">
  <img src="https://img.shields.io/badge/Prisma-5.15.0-darkblue" alt="Prisma Version">
  <img src="https://img.shields.io/badge/PostgreSQL-16+-blue" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Flutter-3.0+-blue" alt="Flutter">
</p>

## 📋 Descripción

Sistema completo para el **seguimiento post-operatorio de mascotas** que consta de:

- **Backend API REST**: NestJS + PostgreSQL + Prisma ORM
- **Aplicación Móvil**: Flutter para iOS/Android
- **Dashboard Web**: (En desarrollo) para veterinarios

## 🎯 Casos de Uso

1. **Veterinarios**: Crean tratamientos, monitorean progreso, reciben alertas
2. **Dueños**: Registran seguimiento diario, suben fotos, reciben recordatorios
3. **Sistema**: Alertas automáticas basadas en signos de alarma

## 🏗️ Arquitectura

```
backend/
├── src/
│   ├── modules/          # Módulos de funcionalidad
│   │   ├── auth/         # Autenticación JWT
│   │   ├── users/        # Gestión de usuarios
│   │   ├── pets/         # CRUD de mascotas
│   │   ├── treatments/   # Tratamientos post-operativos
│   │   ├── daily-logs/   # Registros diarios
│   │   └── cloudinary/   # Upload de imágenes
│   ├── common/           # Utilidades comunes
│   └── prisma/           # Prisma ORM Service
├── prisma/               # Esquema de base de datos
└── test/                 # Tests

mobile/                   # Aplicación Flutter
├── lib/
│   ├── core/            # Lógica de negocio
│   ├── features/        # Características específicas
│   └── config/          # Configuración
```

## 🗄️ Modelo de Datos

```prisma
User (VET | OWNER) → Pet → Treatment → TreatmentRule → DailyLog
```

- **User**: Veterinarios y dueños con roles diferenciados
- **Pet**: Mascotas con datos médicos
- **Treatment**: Tratamientos con diagnóstico y fechas
- **TreatmentRule**: Reglas de medicación (frecuencia, dosis)
- **DailyLog**: Registros diarios (apetito, energía, signos)

## 🚀 Configuración Rápida

### Prerrequisitos
- Node.js 18+
- PostgreSQL 16+
- Flutter 3.0+
- npm o yarn

### 1. Clonar y configurar
```bash
git clone <repo-url>
cd app_veterinaria/backend
cp .env.example .env
```

### 2. Configurar variables de entorno
```env
DATABASE_URL="postgresql://user:password@localhost:5432/veterinaria_db"
PORT=3000
JWT_SECRET="tu-super-secreto-jwt-aqui"
CLOUDINARY_CLOUD_NAME="tu-cloud-name"
CLOUDINARY_API_KEY="tu-api-key"
CLOUDINARY_API_SECRET="tu-api-secret"
```

### 3. Instalar dependencias
```bash
npm install
npx prisma generate
npx prisma migrate dev
```

### 4. Ejecutar el backend
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

### 5. Ejecutar tests
```bash
# Tests unitarios
npm run test

# Tests E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

## 📚 Documentación de API

Una vez ejecutado el servidor, la documentación Swagger está disponible en:
- **Swagger UI**: http://localhost:3000/api/docs
- **API Base**: http://localhost:3000/api/v1

## 🔐 Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** con los siguientes roles:
- **VET**: Acceso completo, puede crear tratamientos
- **OWNER**: Acceso limitado a sus mascotas, registra daily logs

## 🛠️ Scripts Disponibles

```bash
npm run start          # Iniciar en modo desarrollo
npm run start:dev      # Iniciar con hot-reload
npm run start:prod     # Iniciar en producción
npm run build          # Compilar proyecto
npm run test           # Ejecutar tests unitarios
npm run test:e2e       # Ejecutar tests E2E
npm run test:cov       # Generar reporte de cobertura
npm run lint           # Lint y auto-fix
npm run format         # Formatear código con Prettier
```

## 🧪 Testing

El proyecto incluye:
- **Tests unitarios**: Jest para servicios y controladores
- **Tests E2E**: Supertest para endpoints API
- **Prisma Testing**: Base de datos de prueba

## 🚢 Deployment

### Opciones recomendadas:
1. **Railway.app**: Simple deployment para MVP
2. **Render.com**: Gratis para PostgreSQL + Node.js
3. **AWS EC2 + RDS**: Para producción a escala

### Variables de producción:
```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="secreto-largo-y-complejo"
CORS_ORIGIN="https://tudominio.com"
```

## 📱 Aplicación Móvil (Flutter)

### Configuración:
```bash
cd mobile
flutter pub get
```

### Ejecutar:
```bash
flutter run
```

### Build:
```bash
flutter build apk
flutter build ios
```

## 🤝 Contribución

1. Fork el repositorio
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Contacto

Proyecto desarrollado para el seguimiento post-operatorio de mascotas.

- **Autor**: Equipo de desarrollo
- **GitHub**: [repositorio-url]
- **Email**: desarrollo@veterinaria.com

---

<p align="center">
  <i>🐾 Cuidando a tus mascotas, un día a la vez 🐾</i>
</p>
