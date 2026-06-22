import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Datos de prueba
export const testUsers = {
  vet: {
    email: 'vet@test.com',
    password: 'vet123',
    name: 'Dr. Test Veterinario',
    role: 'VET' as const,
  },
  owner: {
    email: 'owner@test.com',
    password: 'owner123',
    name: 'Dueño Test',
    role: 'OWNER' as const,
  },
};

export const testPet = {
  name: 'Firulais',
  species: 'Perro',
  breed: 'Labrador',
  weight: 25.5,
};

// Funciones de utilidad para tests
export const cleanDatabase = async () => {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
};

// Setup global para tests
beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});