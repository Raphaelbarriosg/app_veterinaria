-- ============================================
-- Script de inicialización de PostgreSQL
-- Para entorno de desarrollo
-- ============================================

-- Configurar para desarrollo (más logging, menos performance)
ALTER SYSTEM SET shared_buffers = '128MB';
ALTER SYSTEM SET effective_cache_size = '384MB';
ALTER SYSTEM SET work_mem = '8MB';
ALTER SYSTEM SET maintenance_work_mem = '32MB';

-- Más logging para debugging
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET deadlock_timeout = '1s';

-- Crear extensiones útiles para desarrollo
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET TIMEZONE = 'UTC';

-- Crear datos de prueba para desarrollo
DO $$
BEGIN
    -- Insertar usuarios de prueba solo si la tabla existe
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- Veterinario de prueba
        INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
        VALUES (
            '550e8400-e29b-41d4-a716-446655440001',
            'vet@test.com',
            crypt('vet123', gen_salt('bf', 12)),
            'Dr. Test Veterinario',
            'VET',
            NOW(),
            NOW()
        ) ON CONFLICT (email) DO NOTHING;

        -- Dueño de prueba
        INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
        VALUES (
            '550e8400-e29b-41d4-a716-446655440002',
            'owner@test.com',
            crypt('owner123', gen_salt('bf', 12)),
            'Dueño Test',
            'OWNER',
            NOW(),
            NOW()
        ) ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Comentario: Datos de prueba para desarrollo
-- Las migraciones de Prisma crearán las tablas si no existen