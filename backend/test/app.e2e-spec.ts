import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { cleanDatabase, testUsers } from './setup';
import * as bcrypt from 'bcrypt';

describe('Ecosistema Veterinario API (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let vetToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Limpiar base de datos antes de los tests
    await cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /api/v1/health - should return API status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('GET /api/docs - should return Swagger documentation', () => {
      return request(app.getHttpServer())
        .get('/api/docs')
        .expect(200);
    });
  });

  describe('Authentication', () => {
    describe('POST /api/v1/auth/register', () => {
      it('should register a new owner successfully', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(testUsers.owner)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body.user.email).toBe(testUsers.owner.email);
            expect(res.body.user.role).toBe('OWNER');
            expect(res.body.user).not.toHaveProperty('passwordHash');
            
            // Guardar token para tests posteriores
            authToken = res.body.accessToken;
          });
      });

      it('should register a new vet successfully', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(testUsers.vet)
          .expect(201)
          .expect((res) => {
            expect(res.body.user.role).toBe('VET');
            vetToken = res.body.accessToken;
          });
      });

      it('should fail with duplicate email', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(testUsers.owner)
          .expect(409)
          .expect((res) => {
            expect(res.body.message).toContain('ya está registrado');
          });
      });

      it('should fail with invalid data', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            email: 'invalid-email',
            password: '123', // Muy corta
          })
          .expect(400);
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should login successfully with correct credentials', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: testUsers.owner.email,
            password: testUsers.owner.password,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('accessToken');
          });
      });

      it('should fail with incorrect password', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: testUsers.owner.email,
            password: 'wrong-password',
          })
          .expect(401);
      });

      it('should fail with non-existent email', () => {
        return request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'password123',
          })
          .expect(401);
      });
    });
  });

  describe('Pets Management', () => {
    it('GET /api/v1/pets - should return empty array for new user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/pets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('POST /api/v1/pets - should create a new pet', () => {
      return request(app.getHttpServer())
        .post('/api/v1/pets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Firulais',
          species: 'Perro',
          breed: 'Labrador',
          weight: 25.5,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Firulais');
          expect(res.body.species).toBe('Perro');
        });
    });

    it('GET /api/v1/pets - should return pets after creation', () => {
      return request(app.getHttpServer())
        .get('/api/v1/pets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].name).toBe('Firulais');
        });
    });
  });

  describe('Protected Routes', () => {
    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/pets')
        .expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/pets')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
