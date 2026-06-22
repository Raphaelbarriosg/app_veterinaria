# Guía de Deployment - Ecosistema Veterinario

## 🚀 Opciones de Deployment

### 1. **Docker Compose (Recomendado para desarrollo/local)**

#### Prerrequisitos
- Docker 20.10+
- Docker Compose 2.0+

#### Pasos
```bash
# 1. Clonar y configurar
git clone <repo-url>
cd app_veterinaria/backend

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Levantar servicios
npm run docker:compose
# o manualmente:
docker-compose up -d

# 4. Verificar que todo funcione
curl http://localhost:3000/api/v1/health
```

#### Servicios disponibles:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **PostgreSQL**: localhost:5432
- **pgAdmin** (opcional): http://localhost:5050

### 2. **Render.com (Gratis para MVP)**

#### Configuración en Render
1. Crear nuevo **Web Service**
2. Conectar repositorio de GitHub
3. Configurar build settings:
   ```bash
   Build Command: npm install && npm run build
   Start Command: npm run start:prod
   ```
4. Variables de entorno:
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=tu-secreto
   NODE_ENV=production
   ```

5. Crear base de datos PostgreSQL en Render
6. Agregar variable `DATABASE_URL` del servicio de base de datos

### 3. **Railway.app (Simple y rápido)**

#### Pasos
1. Push a GitHub
2. Crear nuevo proyecto en Railway
3. Conectar repositorio
4. Agregar PostgreSQL plugin
5. Railway detectará automáticamente el `Dockerfile`

#### Variables en Railway:
- `DATABASE_URL` (automático de PostgreSQL)
- `JWT_SECRET`
- `PORT` (3000)
- `NODE_ENV=production`

### 4. **AWS (Producción a escala)**

#### Stack recomendado:
- **EC2** o **ECS Fargate** para la aplicación
- **RDS PostgreSQL** para base de datos
- **S3** para almacenamiento de imágenes
- **CloudFront** para CDN

#### Docker en ECS:
```bash
# 1. Build de la imagen
docker build -t veterinaria-backend .

# 2. Push a ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag veterinaria-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/veterinaria-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/veterinaria-backend:latest
```

## 🔧 Configuración de Producción

### Variables de entorno críticas:
```env
# Base de datos
DATABASE_URL="postgresql://user:password@host:5432/database?ssl=true"

# Seguridad
JWT_SECRET="mínimo-32-caracteres-complejo-y-aleatorio"
NODE_ENV="production"

# CORS (restringir en producción)
CORS_ORIGIN="https://app.veterinaria.com"

# Cloudinary
CLOUDINARY_CLOUD_NAME="tu-cloud"
CLOUDINARY_API_KEY="tu-key"
CLOUDINARY_API_SECRET="tu-secret"

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100
```

### Configuración de PostgreSQL en producción:
```sql
-- Mejoras de performance
ALTER DATABASE veterinaria_db SET work_mem = '16MB';
ALTER DATABASE veterinaria_db SET maintenance_work_mem = '64MB';
ALTER DATABASE veterinaria_db SET effective_cache_size = '1GB';

-- Índices recomendados adicionales
CREATE INDEX idx_daily_logs_treatment_date ON daily_logs(treatment_id, registered_at DESC);
CREATE INDEX idx_treatments_vet_status ON treatments(vet_id, status);
```

## 📊 Monitoreo y Logs

### Health Checks
El endpoint `/api/v1/health` debe ser monitoreado:
```bash
# Health check simple
curl -f http://tu-api.com/api/v1/health || exit 1

# Health check con timeout
curl --max-time 5 --fail http://tu-api.com/api/v1/health
```

### Logs recomendados:
```typescript
// En main.ts para producción
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');
logger.log(`🐾 Vet App API corriendo en: http://localhost:${port}/api/v1`);
```

### Métricas a monitorear:
- **Uptime**: Health check cada 1 minuto
- **Response time**: P95 < 500ms
- **Error rate**: < 1%
- **Database connections**: < 80% del máximo

## 🧪 Pruebas de Deployment

### Checklist pre-producción:
- [ ] Tests pasan: `npm run test && npm run test:e2e`
- [ ] Build exitoso: `npm run build`
- [ ] Health check funciona
- [ ] Swagger docs accesibles
- [ ] CORS configurado correctamente
- [ ] Variables de entorno seguras
- [ ] Backups de base de datos configurados
- [ ] SSL/TLS habilitado (HTTPS)
- [ ] Rate limiting configurado
- [ ] Logs centralizados

### Smoke test post-deployment:
```bash
# 1. Health check
curl https://tu-api.com/api/v1/health

# 2. Autenticación
curl -X POST https://tu-api.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test","role":"OWNER"}'

# 3. Endpoint protegido
curl -H "Authorization: Bearer <token>" \
  https://tu-api.com/api/v1/pets
```

## 🔒 Seguridad

### Best practices:
1. **Never commit `.env`** - Usar `.env.example`
2. **Rotar JWT_SECRET** periódicamente
3. **Usar HTTPS** siempre en producción
4. **Rate limiting** para prevenir abuso
5. **CORS restringido** a dominios específicos
6. **Headers de seguridad**:
   ```typescript
   app.use(helmet()); // NestJS tiene helmet integrado
   ```

### Backup de base de datos:
```bash
# Backup diario
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup.sql
```

## 📱 Frontend Mobile (Flutter)

### Variables de entorno para Flutter:
```dart
const apiBaseUrl = 'https://tu-api.com/api/v1';
const socketUrl = 'wss://tu-api.com'; // Para WebSockets
```

### Build para producción:
```bash
# Android
flutter build apk --release --split-per-abi

# iOS
flutter build ios --release

# Web (opcional)
flutter build web --release
```

## 🚨 Troubleshooting

### Problemas comunes:

1. **Database connection fails**
   ```bash
   # Verificar conexión
   psql $DATABASE_URL -c "SELECT 1"
   
   # Verificar migraciones
   npx prisma migrate status
   ```

2. **JWT errors**
   - Verificar que `JWT_SECRET` sea el mismo en todos los servicios
   - Verificar formato del token en headers

3. **CORS errors**
   ```typescript
   // Verificar configuración en main.ts
   app.enableCors({
     origin: process.env.CORS_ORIGIN || '*',
   });
   ```

4. **High memory usage**
   ```bash
   # Monitorear memoria
   docker stats
   
   # Limitar recursos en docker-compose
   deploy:
     resources:
       limits:
         memory: 512M
   ```

## 📈 Scaling

### Vertical scaling:
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
    scale: 2  # Múltiples instancias
```

### Horizontal scaling:
- Usar **Redis** para sesiones compartidas
- Configurar **load balancer**
- Base de datos con **read replicas**

---

**Última actualización**: Junio 2024  
**Contacto**: desarrollo@veterinaria.com  
**Estado**: MVP - Listo para producción