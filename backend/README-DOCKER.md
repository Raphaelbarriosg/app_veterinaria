# 🐾 Ecosistema Veterinario - Docker Edition

Sistema completo Dockerizado para el seguimiento post-operatorio de mascotas utilizando las últimas versiones de todas las tecnologías.

## 🚀 **Stack Tecnológico Actualizado**

| Componente | Versión | Descripción |
|------------|---------|-------------|
| **Node.js** | 20.x | Runtime JavaScript |
| **NestJS** | 11.x | Framework backend |
| **PostgreSQL** | 17.x | Base de datos principal |
| **Prisma** | 6.x | ORM y migraciones |
| **Redis** | 7.x | Cache y sesiones |
| **Docker** | Latest | Contenedores |
| **Traefik** | 3.x | Reverse proxy (opcional) |

## 📁 **Estructura del Proyecto**

```
backend/
├── 📁 src/                    # Código fuente NestJS
├── 📁 prisma/                 # Esquema y migraciones
├── 📁 test/                   # Tests unitarios y E2E
├── 📁 postgres/               # Configuración PostgreSQL
├── 📁 traefik/                # Configuración Traefik (opcional)
├── 📄 Dockerfile              # Build producción
├── 📄 Dockerfile.dev          # Build desarrollo
├── 📄 docker-compose.yml      # Producción
├── 📄 docker-compose.dev.yml  # Desarrollo
├── 📄 Makefile                # Comandos simplificados
├── 📄 package.json            # Dependencias Node
└── 📄 .env.example            # Variables de entorno
```

## 🎯 **Características Docker**

### ✅ **Multi-entorno**
- **Desarrollo**: Hot-reload, debugging, datos de prueba
- **Producción**: Optimizado, seguridad, escalabilidad

### ✅ **Servicios incluidos**
- PostgreSQL 17 con extensión UUID
- Redis 7 para cache/sesiones
- pgAdmin para administración de BD
- Prisma Studio UI
- Traefik reverse proxy (opcional)
- Health checks automáticos

### ✅ **Seguridad**
- Usuarios no-root en contenedores
- Secrets management
- HTTPS con Let's Encrypt (Traefik)
- Headers de seguridad (Helmet)
- CORS configurable

### ✅ **Performance**
- Multi-stage Docker builds
- Cache optimizado
- Resource limits
- Connection pooling

## 🚀 **Inicio Rápido**

### **Prerrequisitos**
- Docker 20.10+
- Docker Compose 2.0+
- Git

### **1. Clonar y configurar**
```bash
# Clonar repositorio
git clone <repo-url>
cd app_veterinaria/backend

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores
```

### **2. Desarrollo (Recomendado)**
```bash
# Usar Makefile (recomendado)
make dev

# O manualmente
docker compose -f docker-compose.dev.yml up --build
```

**Servicios de desarrollo:**
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api/docs
- Prisma Studio: http://localhost:5555
- pgAdmin: http://localhost:5050
- Redis: localhost:6379

### **3. Producción**
```bash
# Entorno de producción
make prod

# O manualmente
docker compose up -d --build
```

## 📖 **Comandos Makefile**

El Makefile simplifica todos los comandos comunes:

| Comando | Descripción |
|---------|-------------|
| `make help` | Mostrar todos los comandos |
| `make setup` | Configurar proyecto por primera vez |
| `make dev` | Iniciar entorno desarrollo |
| `make prod` | Iniciar entorno producción |
| `make down` | Detener todos los servicios |
| `make logs` | Ver logs |
| `make migrate` | Ejecutar migraciones |
| `make seed` | Poblar base de datos |
| `make clean` | Limpiar todo (contenedores, imágenes, volúmenes) |
| `make health` | Verificar salud de la API |
| `make docs` | Abrir Swagger UI |
| `make pgadmin` | Abrir pgAdmin |

## 🔧 **Configuración Docker**

### **Variables de entorno principales**
```env
# Base de datos
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=veterinaria_db
DB_PORT=5432

# API
PORT=3000
NODE_ENV=development  # o production

# Seguridad
JWT_SECRET=tu-super-secreto
CORS_ORIGIN=*  # En producción: https://tudominio.com

# Cloudinary (imágenes)
CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_API_KEY=tu-key
CLOUDINARY_API_SECRET=tu-secret
```

### **Puertos expuestos**
| Servicio | Puerto | URL |
|----------|--------|-----|
| API | 3000 | http://localhost:3000 |
| PostgreSQL | 5432 | localhost:5432 |
| pgAdmin | 5050 | http://localhost:5050 |
| Prisma Studio | 5555 | http://localhost:5555 |
| Redis | 6379 | localhost:6379 |
| Traefik Dashboard | 8080 | http://localhost:8080 |

## 🧪 **Testing con Docker**

### **Tests unitarios**
```bash
# Ejecutar tests
make test

# Tests con watch
npm run test:watch

# Cobertura
npm run test:cov
```

### **Tests E2E**
```bash
# Con base de datos de prueba
npm run test:e2e

# Con Docker
docker compose -f docker-compose.dev.yml exec backend npm run test:e2e
```

## 🚢 **Deployment**

### **Opción 1: Docker Compose (simple)**
```bash
# Construir y ejecutar
make prod

# Verificar
make health
```

### **Opción 2: Kubernetes (avanzado)**
```yaml
# Ejemplo deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: veterinaria-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: veterinaria-backend
  template:
    metadata:
      labels:
        app: veterinaria-backend
    spec:
      containers:
      - name: backend
        image: veterinaria-backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: veterinaria-secrets
```

### **Opción 3: Cloud Providers**
- **AWS**: ECS Fargate + RDS + ElastiCache
- **Google Cloud**: GKE + Cloud SQL + Memorystore
- **Azure**: AKS + Azure Database + Redis Cache
- **Railway/Render**: Simple con Docker Compose

## 📊 **Monitoreo y Logs**

### **Logs en tiempo real**
```bash
# Todos los servicios
make logs

# Servicio específico
docker compose logs -f backend

# Desarrollo
make logs-dev
```

### **Health checks**
```bash
# Verificar salud
curl http://localhost:3000/api/v1/health

# Con Makefile
make health
```

### **Métricas**
- Health endpoint: `/api/v1/health`
- Swagger docs: `/api/docs`
- Prometheus metrics (con Traefik)

## 🔒 **Seguridad en Producción**

### **1. Secrets management**
```bash
# Nunca committear .env
echo ".env" >> .gitignore

# Usar Docker secrets o Vault
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.prod
```

### **2. HTTPS obligatorio**
```yaml
# Traefik con Let's Encrypt
traefik:
  image: traefik:v3.0
  command:
    - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
    - "--entrypoints.websecure.address=:443"
```

### **3. Resource limits**
```yaml
# En docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

## 🛠️ **Troubleshooting**

### **Problemas comunes**

1. **Puerto en uso**
```bash
# Ver procesos usando puerto 3000
netstat -ano | findstr :3000

# O cambiar puerto en .env
PORT=3001
```

2. **Docker out of memory**
```bash
# Limpiar recursos
docker system prune -a

# Aumentar memoria Docker Desktop
# Settings -> Resources -> Memory
```

3. **Migraciones fallan**
```bash
# Resetear base de datos
docker compose down -v
docker compose up -d

# Ejecutar migraciones manualmente
docker compose exec backend npx prisma migrate dev
```

4. **Health check falla**
```bash
# Verificar logs
docker compose logs backend

# Probar conexión manualmente
curl -v http://localhost:3000/api/v1/health
```

### **Comandos útiles**
```bash
# Ver estado de contenedores
docker ps
docker compose ps

# Acceder a contenedor
docker compose exec backend sh

# Ver uso de recursos
docker stats

# Reconstruir imágenes
docker compose build --no-cache
```

## 📈 **Escalabilidad**

### **Horizontal scaling**
```yaml
# docker-compose.scale.yml
services:
  backend:
    scale: 3
    deploy:
      replicas: 3
```

### **Load balancing**
```bash
# Con Traefik
traefik:
  labels:
    - "traefik.http.services.backend.loadbalancer.server.port=3000"
```

### **Database scaling**
- PostgreSQL: Read replicas
- Redis: Cluster mode
- Connection pooling

## 🤝 **Contribución**

1. **Clonar y configurar**
```bash
git clone <repo>
cd app_veterinaria/backend
make setup
```

2. **Ejecutar tests**
```bash
make test
make test-e2e
```

3. **Crear PR**
- Asegurar que todos los tests pasen
- Actualizar documentación si es necesario
- Seguir convenciones de código

## 📞 **Soporte**

### **Recursos**
- 📚 [Documentación NestJS](https://docs.nestjs.com)
- 🐘 [Documentación PostgreSQL](https://www.postgresql.org/docs/)
- 🐳 [Documentación Docker](https://docs.docker.com)
- 🔧 [Documentación Prisma](https://www.prisma.io/docs)

### **Contacto**
- **Issues**: GitHub Issues
- **Email**: desarrollo@veterinaria.com
- **Slack**: #veterinaria-ecosistema

---

**🚀 ¡Listo para producción!**  
Este stack Dockerizado está optimizado, seguro y preparado para escalar desde MVP hasta producción a gran escala.

**Última actualización**: Junio 2024  
**Versión**: 1.0.0  
**Estado**: Production Ready 🟢