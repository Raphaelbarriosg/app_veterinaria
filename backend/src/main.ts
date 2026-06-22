import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Prefijo global para la API
  app.setGlobalPrefix('api/v1');

  // Seguridad con Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Validación global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Elimina propiedades no definidas en DTOs
      forbidNonWhitelisted: true, // Lanza error si envían propiedades no permitidas
      transform: true,            // Transforma payloads a instancias de DTOs
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS configurable
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const corsMethods = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';
  
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Permitir cualquier origen en desarrollo (incluyendo null/file://) si corsOrigin es '*'
      if (!origin || origin === 'null' || corsOrigin === '*' || corsOrigin.split(',').map(o => o.trim()).includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por CORS'));
      }
    },
    methods: corsMethods,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400, // 24 horas
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Ecosistema Veterinario API')
    .setDescription('API para el seguimiento post-operatorio de mascotas')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese el token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticación de usuarios')
    .addTag('users', 'Gestión de usuarios')
    .addTag('pets', 'Gestión de mascotas')
    .addTag('treatments', 'Tratamientos post-operativos')
    .addTag('daily-logs', 'Registros diarios de seguimiento')
    .addTag('cloudinary', 'Gestión de imágenes')
    .addTag('health', 'Health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Ecosistema Veterinario API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`==========================================`);
  logger.log(`🐾  Ecosistema Veterinario API`);
  logger.log(`==========================================`);
  logger.log(`🌍  Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`🚀  Servidor: http://localhost:${port}/api/v1`);
  logger.log(`📚  Docs: http://localhost:${port}/api/docs`);
  logger.log(`🏥  Health: http://localhost:${port}/api/v1/health`);
  logger.log(`🔒  CORS Origin: ${corsOrigin}`);
  logger.log(`==========================================`);
  
  // Log de advertencias de seguridad
  if (corsOrigin === '*') {
    logger.warn('⚠️  CORS configurado para permitir todos los orígenes (*)');
    logger.warn('   En producción, restringir a dominios específicos');
  }
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change')) {
    logger.warn('⚠️  JWT_SECRET no configurado o usando valor por defecto');
    logger.warn('   En producción, usar un secreto seguro y único');
  }
}
bootstrap();
