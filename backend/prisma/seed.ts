import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // ============================================
  // 1. Limpiar base de datos (cuidado en producción)
  // ============================================
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Limpiando base de datos de desarrollo...');
    
    // Orden inverso por dependencias de foreign keys
    await prisma.dailyLog.deleteMany({});
    await prisma.treatmentRule.deleteMany({});
    await prisma.treatment.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('✅ Base de datos limpiada');
  }

  // ============================================
  // 2. Crear usuarios de prueba
  // ============================================
  console.log('👥 Creando usuarios de prueba...');

  // Veterinario
  const vetPassword = await bcrypt.hash('vet123', SALT_ROUNDS);
  const vet = await prisma.user.upsert({
    where: { email: 'vet@test.com' },
    update: {},
    create: {
      email: 'vet@test.com',
      passwordHash: vetPassword,
      name: 'Dr. María González',
      phone: '+34 600 123 456',
      role: 'VET',
    },
  });

  // Dueño
  const ownerPassword = await bcrypt.hash('owner123', SALT_ROUNDS);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@test.com' },
    update: {},
    create: {
      email: 'owner@test.com',
      passwordHash: ownerPassword,
      name: 'Carlos Rodríguez',
      phone: '+34 611 987 654',
      role: 'OWNER',
    },
  });

  console.log(`✅ Usuarios creados: ${vet.name} (VET) y ${owner.name} (OWNER)`);

  // ============================================
  // 3. Crear mascotas
  // ============================================
  console.log('🐾 Creando mascotas de prueba...');

  const pets = await Promise.all([
    prisma.pet.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440101' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440101',
        name: 'Luna',
        species: 'DOG',
        breed: 'Border Collie',
        weight: 18.5,
        birthDate: new Date('2020-03-15'),
        ownerId: owner.id,
      },
    }),
    prisma.pet.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440102' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440102',
        name: 'Simba',
        species: 'CAT',
        breed: 'Persa',
        weight: 5.2,
        birthDate: new Date('2021-07-22'),
        ownerId: owner.id,
      },
    }),
    prisma.pet.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440103' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440103',
        name: 'Rocky',
        species: 'DOG',
        breed: 'Bulldog Francés',
        weight: 12.8,
        birthDate: new Date('2019-11-30'),
        ownerId: owner.id,
      },
    }),
  ]);

  console.log(`✅ ${pets.length} mascotas creadas`);

  // ============================================
  // 4. Crear tratamientos
  // ============================================
  console.log('🏥 Creando tratamientos de prueba...');

  const treatments = await Promise.all([
    prisma.treatment.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440201' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440201',
        vetId: vet.id,
        petId: pets[0].id, // Luna
        diagnosis: 'Fractura de pata posterior derecha - Post operatorio',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-03-15'),
        status: 'ACTIVE',
      },
    }),
    prisma.treatment.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440202' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440202',
        vetId: vet.id,
        petId: pets[1].id, // Simba
        diagnosis: 'Gastroenteritis - Tratamiento con antibióticos',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-15'),
        status: 'COMPLETED',
      },
    }),
  ]);

  console.log(`✅ ${treatments.length} tratamientos creados`);

  // ============================================
  // 5. Crear reglas de tratamiento
  // ============================================
  console.log('💊 Creando reglas de tratamiento...');

  const treatmentRules = await Promise.all([
    prisma.treatmentRule.create({
      data: {
        treatmentId: treatments[0].id,
        medicineName: 'Carprofeno',
        dosage: '50mg',
        frequencyHours: 24,
        requirePhoto: true,
      },
    }),
    prisma.treatmentRule.create({
      data: {
        treatmentId: treatments[0].id,
        medicineName: 'Tramadol',
        dosage: '25mg',
        frequencyHours: 12,
        requirePhoto: false,
      },
    }),
    prisma.treatmentRule.create({
      data: {
        treatmentId: treatments[1].id,
        medicineName: 'Metronidazol',
        dosage: '100mg',
        frequencyHours: 8,
        requirePhoto: false,
      },
    }),
  ]);

  console.log(`✅ ${treatmentRules.length} reglas de tratamiento creadas`);

  // ============================================
  // 6. Crear registros diarios (logs)
  // ============================================
  console.log('📅 Creando registros diarios de prueba...');

  // Crear logs para los últimos 7 días
  const dailyLogs = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);
    
    const dailyLog = await prisma.dailyLog.create({
      data: {
        treatmentId: treatments[0].id,
        registeredAt: logDate,
        medicineTaken: i % 3 !== 0, // No tomó medicina cada 3 días
        appetiteLevel: Math.floor(Math.random() * 5) + 1, // 1-5
        energyLevel: Math.floor(Math.random() * 5) + 1, // 1-5
        alarmSigns: i === 2 ? 'Cojea un poco al caminar' : null,
        imageUrl: i === 0 ? 'https://example.com/photo1.jpg' : null,
      },
    });
    
    dailyLogs.push(dailyLog);
  }

  console.log(`✅ ${dailyLogs.length} registros diarios creados`);

  // ============================================
  // 7. Resumen final
  // ============================================
  console.log('\n🎉 Seed completado exitosamente!');
  console.log('==================================');
  console.log(`👥 Usuarios: 2 (1 VET, 1 OWNER)`);
  console.log(`🐾 Mascotas: ${pets.length}`);
  console.log(`🏥 Tratamientos: ${treatments.length}`);
  console.log(`💊 Reglas de tratamiento: ${treatmentRules.length}`);
  console.log(`📅 Registros diarios: ${dailyLogs.length}`);
  console.log('==================================\n');

  console.log('🔑 Credenciales de prueba:');
  console.log('Veterinario: vet@test.com / vet123');
  console.log('Dueño: owner@test.com / owner123\n');
}

main()
  .catch((error) => {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });