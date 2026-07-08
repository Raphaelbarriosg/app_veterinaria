import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // ============================================
  // 1. Limpiar base de datos
  // ============================================
  console.log('🧹 Limpiando base de datos...');
  await prisma.refreshToken.deleteMany({});
  await prisma.dailyLog.deleteMany({});
  await prisma.treatmentRule.deleteMany({});
  await prisma.treatment.deleteMany({});
  await prisma.pet.deleteMany({});
  await prisma.clinicInvitation.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.clinicMember.deleteMany({});
  await prisma.clinic.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Base de datos limpiada');

  // ============================================
  // 2. Crear usuarios de prueba
  // ============================================
  console.log('👥 Creando usuarios de prueba...');

  const vetPassword = await bcrypt.hash('vet123', SALT_ROUNDS);
  const vet = await prisma.user.create({
    data: {
      email: 'vet@test.com',
      passwordHash: vetPassword,
      name: 'Dr. María González',
      phone: '+34 600 123 456',
      role: 'VET',
    },
  });

  const ownerPassword = await bcrypt.hash('owner123', SALT_ROUNDS);
  const owner = await prisma.user.create({
    data: {
      email: 'owner@test.com',
      passwordHash: ownerPassword,
      name: 'Carlos Rodríguez',
      phone: '+34 611 987 654',
      role: 'OWNER',
    },
  });

  const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: adminPassword,
      name: 'Ana Martínez',
      phone: '+34 622 555 789',
      role: 'CLINIC_ADMIN',
    },
  });

  console.log(`✅ Usuarios: ${vet.name} (VET), ${owner.name} (OWNER), ${admin.name} (CLINIC_ADMIN)`);

  // ============================================
  // 3. Crear clínica de prueba
  // ============================================
  console.log('🏥 Creando clínica de prueba...');

  const clinic = await prisma.clinic.create({
    data: {
      name: 'VetCare Central',
      slug: 'vetcare-central',
      email: 'contacto@vetcarecentral.cl',
      phone: '+56 2 2345 6789',
      address: 'Av. Providencia 1234, Santiago',
      country: 'CHL',
      currency: 'CLP',
      timezone: 'America/Santiago',
      status: 'ACTIVE',
      maxVets: 5,
      maxPets: 200,
      members: {
        create: [
          { userId: admin.id, role: 'CLINIC_ADMIN', isActive: true },
          { userId: vet.id, role: 'VET', isActive: true },
          { userId: owner.id, role: 'OWNER', isActive: true },
        ],
      },
      subscription: {
        create: {
          planType: 'PROFESSIONAL',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
    include: { members: true, subscription: true },
  });

  console.log(`✅ Clínica: ${clinic.name} (${clinic.slug})`);

  // ============================================
  // 4. Crear mascotas (con clinicId)
  // ============================================
  console.log('🐾 Creando mascotas de prueba...');

  const pets = await Promise.all([
    prisma.pet.create({
      data: {
        clinicId: clinic.id,
        name: 'Luna',
        species: 'DOG',
        breed: 'Border Collie',
        weight: 18.5,
        birthDate: new Date('2020-03-15'),
        ownerId: owner.id,
      },
    }),
    prisma.pet.create({
      data: {
        clinicId: clinic.id,
        name: 'Simba',
        species: 'CAT',
        breed: 'Persa',
        weight: 5.2,
        birthDate: new Date('2021-07-22'),
        ownerId: owner.id,
      },
    }),
    prisma.pet.create({
      data: {
        clinicId: clinic.id,
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
  // 5. Crear tratamientos (con clinicId)
  // ============================================
  console.log('🏥 Creando tratamientos de prueba...');

  const treatments = await Promise.all([
    prisma.treatment.create({
      data: {
        clinicId: clinic.id,
        vetId: vet.id,
        petId: pets[0].id,
        diagnosis: 'Fractura de pata posterior derecha - Post operatorio',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-03-15'),
        status: 'ACTIVE',
      },
    }),
    prisma.treatment.create({
      data: {
        clinicId: clinic.id,
        vetId: vet.id,
        petId: pets[1].id,
        diagnosis: 'Gastroenteritis - Tratamiento con antibióticos',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-15'),
        status: 'COMPLETED',
      },
    }),
  ]);

  console.log(`✅ ${treatments.length} tratamientos creados`);

  // ============================================
  // 6. Crear reglas de tratamiento
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
  // 7. Crear registros diarios (logs)
  // ============================================
  console.log('📅 Creando registros diarios de prueba...');

  const dailyLogs = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);

    const dailyLog = await prisma.dailyLog.create({
      data: {
        treatmentId: treatments[0].id,
        registeredAt: logDate,
        medicineTaken: i % 3 !== 0,
        appetiteLevel: Math.floor(Math.random() * 5) + 1,
        energyLevel: Math.floor(Math.random() * 5) + 1,
        painLevel: Math.floor(Math.random() * 10) + 1,
        temperature: 37.5 + Math.random() * 2,
        alarmSigns: i === 2 ? 'Cojea un poco al caminar' : null,
        observations: i === 0 ? 'Buena evolución general' : null,
        imageUrl: i === 0 ? 'https://example.com/photo1.jpg' : null,
      },
    });

    dailyLogs.push(dailyLog);
  }

  console.log(`✅ ${dailyLogs.length} registros diarios creados`);

  // ============================================
  // 8. Resumen final
  // ============================================
  console.log('\n🎉 Seed completado exitosamente!');
  console.log('==================================');
  console.log('👥 Usuarios: 3 (VET, OWNER, CLINIC_ADMIN)');
  console.log(`🏥 Clínica: ${clinic.name}`);
  console.log(`🐾 Mascotas: ${pets.length}`);
  console.log(`💊 Tratamientos: ${treatments.length}`);
  console.log(`📋 Reglas: ${treatmentRules.length}`);
  console.log(`📅 Registros diarios: ${dailyLogs.length}`);
  console.log('==================================\n');

  console.log('🔑 Credenciales de prueba:');
  console.log('Veterinario: vet@test.com / vet123');
  console.log('Dueño: owner@test.com / owner123');
  console.log('Admin Clínica: admin@test.com / admin123\n');
}

main()
  .catch((error) => {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });