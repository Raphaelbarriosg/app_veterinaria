# ============================================
# Etapa de construcción
# ============================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache openssl libc6-compat

# Copiar archivos de configuración de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo devDependencies para build)
RUN npm ci --include=dev

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar el código fuente
COPY . .

# Compilar la aplicación TypeScript
RUN npm run build

# ============================================
# Etapa de producción
# ============================================
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Instalar dependencias del sistema
RUN apk add --no-cache openssl dumb-init

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar node_modules y package.json desde builder
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/prisma ./prisma

# Cambiar al usuario no-root
USER nodejs

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=512"

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Usar dumb-init como entrypoint para manejar señales correctamente
ENTRYPOINT ["dumb-init"]

# Comando de inicio con migraciones automáticas
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]