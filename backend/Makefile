# ============================================
# Makefile para Ecosistema Veterinario
# Comandos simplificados para desarrollo
# ============================================

# Variables
DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_DEV = $(DOCKER_COMPOSE) -f docker-compose.dev.yml
DOCKER = docker

# Colores
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[0;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

.PHONY: help setup dev prod build test clean logs seed migrate

# ============================================
# COMANDOS PRINCIPALES
# ============================================

help: ## Mostrar esta ayuda
	@echo ""
	@echo "$(BLUE)🐾 Ecosistema Veterinario - Comandos disponibles$(NC)"
	@echo "=========================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

setup: ## Configurar el proyecto por primera vez
	@echo "$(BLUE)🚀 Configurando proyecto...$(NC)"
	cp .env.example .env
	@echo "$(YELLOW)⚠️  Por favor, edita el archivo .env con tus valores$(NC)"
	npm install
	@echo "$(GREEN)✅ Configuración completada$(NC)"

dev: ## Iniciar entorno de desarrollo con Docker
	@echo "$(BLUE)🚀 Iniciando entorno de desarrollo...$(NC)"
	$(DOCKER_COMPOSE_DEV) up --build

dev-detach: ## Iniciar entorno de desarrollo en segundo plano
	@echo "$(BLUE)🚀 Iniciando entorno de desarrollo en segundo plano...$(NC)"
	$(DOCKER_COMPOSE_DEV) up -d --build
	@echo "$(GREEN)✅ Servicios iniciados. Usa 'make logs' para ver logs$(NC)"

prod: ## Iniciar entorno de producción
	@echo "$(RED)⚠️  Iniciando entorno de producción$(NC)"
	$(DOCKER_COMPOSE) up -d --build

down: ## Detener todos los servicios
	@echo "$(YELLOW)🛑 Deteniendo servicios...$(NC)"
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE_DEV) down

clean: ## Limpiar contenedores, imágenes y volúmenes
	@echo "$(YELLOW)🧹 Limpiando...$(NC)"
	$(DOCKER_COMPOSE) down -v --rmi all
	$(DOCKER_COMPOSE_DEV) down -v --rmi all
	$(DOCKER) system prune -f

logs: ## Ver logs de los servicios
	@echo "$(BLUE)📄 Mostrando logs...$(NC)"
	$(DOCKER_COMPOSE) logs -f

logs-dev: ## Ver logs de desarrollo
	@echo "$(BLUE)📄 Mostrando logs de desarrollo...$(NC)"
	$(DOCKER_COMPOSE_DEV) logs -f

# ============================================
# BASE DE DATOS
# ============================================

db-shell: ## Conectar a la shell de PostgreSQL
	$(DOCKER_COMPOSE) exec postgres psql -U postgres -d veterinaria_db

db-dev-shell: ## Conectar a la shell de PostgreSQL de desarrollo
	$(DOCKER_COMPOSE_DEV) exec postgres psql -U postgres -d veterinaria_db_dev

migrate: ## Ejecutar migraciones de Prisma
	@echo "$(BLUE)🔄 Ejecutando migraciones...$(NC)"
	npx prisma migrate dev

migrate-prod: ## Ejecutar migraciones en producción
	@echo "$(RED)🔄 Ejecutando migraciones en producción...$(NC)"
	npx prisma migrate deploy

seed: ## Ejecutar seed de base de datos
	@echo "$(BLUE)🌱 Ejecutando seed...$(NC)"
	npm run prisma:db:seed

studio: ## Abrir Prisma Studio
	@echo "$(BLUE)📊 Abriendo Prisma Studio...$(NC)"
	npx prisma studio

pgadmin: ## Abrir pgAdmin en navegador
	@echo "$(BLUE)📊 pgAdmin disponible en: http://localhost:5050$(NC)"
	@echo "Email: admin@veterinaria.com"
	@echo "Password: admin123"

# ============================================
# DESARROLLO SIN DOCKER
# ============================================

install: ## Instalar dependencias
	npm install

start: ## Iniciar servidor en modo desarrollo
	npm run start:dev

build: ## Compilar proyecto
	npm run build

test: ## Ejecutar tests
	npm run test

test-e2e: ## Ejecutar tests E2E
	npm run test:e2e

lint: ## Ejecutar linter y formatear código
	npm run lint
	npm run format

# ============================================
# DOCKER INDIVIDUAL
# ============================================

docker-build: ## Construir imagen Docker
	$(DOCKER) build -t veterinaria-backend:latest .

docker-run: ## Ejecutar contenedor Docker
	$(DOCKER) run -p 3000:3000 --env-file .env --name veterinaria-backend veterinaria-backend:latest

docker-push: ## Subir imagen a registry (personalizar)
	@echo "$(YELLOW)⚠️  Configura tu registry primero$(NC)"
	# $(DOCKER) tag veterinaria-backend:latest tu-registry/veterinaria-backend:latest
	# $(DOCKER) push tu-registry/veterinaria-backend:latest

# ============================================
# UTILIDADES
# ============================================

health: ## Verificar salud de la API
	@echo "$(BLUE)🏥 Verificando salud...$(NC)"
	curl -f http://localhost:3000/api/v1/health || echo "$(RED)❌ Health check falló$(NC)"

docs: ## Abrir documentación Swagger
	@echo "$(BLUE)📚 Swagger UI disponible en: http://localhost:3000/api/docs$(NC)"

status: ## Ver estado de los contenedores
	$(DOCKER_COMPOSE) ps
	@echo ""
	$(DOCKER_COMPOSE_DEV) ps

version: ## Ver versiones de herramientas
	@echo "$(BLUE)📦 Versiones:$(NC)"
	node --version
	npm --version
	$(DOCKER) --version
	$(DOCKER_COMPOSE) --version
	npx prisma --version

# ============================================
# BACKUP Y RESTORE
# ============================================

backup: ## Crear backup de la base de datos
	@echo "$(BLUE)💾 Creando backup...$(NC)"
	$(DOCKER_COMPOSE) exec -T postgres pg_dump -U postgres veterinaria_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup creado$(NC)"

restore: ## Restaurar backup más reciente
	@echo "$(YELLOW)⚠️  Restaurando backup...$(NC)"
	$(DOCKER_COMPOSE) exec -T postgres psql -U postgres -d veterinaria_db < $$(ls -t backup_*.sql | head -1)

# ============================================
# EJEMPLOS DE USO
# ============================================

example-dev: ## Ejemplo: Desarrollo completo
	@echo "$(BLUE)🚀 Ejemplo - Flujo de desarrollo completo:$(NC)"
	@echo "1. make setup            # Configurar proyecto"
	@echo "2. make dev              # Iniciar entorno desarrollo"
	@echo "3. make migrate          # Ejecutar migraciones"
	@echo "4. make seed             # Poblar base de datos"
	@echo "5. Visitar http://localhost:3000/api/docs"

example-prod: ## Ejemplo: Producción
	@echo "$(RED)🚀 Ejemplo - Flujo de producción:$(NC)"
	@echo "1. Editar .env con valores de producción"
	@echo "2. make prod             # Iniciar servicios"
	@echo "3. make migrate-prod     # Ejecutar migraciones en prod"
	@echo "4. make health           # Verificar que todo funciona"