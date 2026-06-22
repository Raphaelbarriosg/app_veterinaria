-- ============================================
-- Script de inicialización de PostgreSQL
-- Para entorno de producción
-- ============================================

-- Configurar parámetros de performance
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '768MB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Configurar logging
ALTER SYSTEM SET log_statement = 'none';
ALTER SYSTEM SET log_duration = off;
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET deadlock_timeout = '1s';

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET TIMEZONE = 'UTC';

-- Crear usuario específico para la aplicación (opcional)
-- CREATE USER veterinaria_app WITH PASSWORD 'app_password';
-- GRANT ALL PRIVILEGES ON DATABASE veterinaria_db TO veterinaria_app;

-- Comentario: Las tablas serán creadas automáticamente por Prisma
-- Este script solo configura el servidor de base de datos