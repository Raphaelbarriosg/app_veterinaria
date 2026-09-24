import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Iniciando seed de datos clínicos reales...');

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
  console.log('👥 Creando usuarios de prueba para todos los roles...');

  const passwordDefault = await bcrypt.hash('Password123!', SALT_ROUNDS);
  const passwordShort = await bcrypt.hash('vet123', SALT_ROUNDS);
  const passwordOwnerShort = await bcrypt.hash('owner123', SALT_ROUNDS);
  const passwordAdminShort = await bcrypt.hash('admin123', SALT_ROUNDS);

  // VET principal
  const vet = await prisma.user.create({
    data: {
      email: 'vet1@clinic.com',
      passwordHash: passwordDefault,
      name: 'Dr. María González',
      phone: '+34 600 123 456',
      role: 'VET',
    },
  });

  // VET alias corto
  await prisma.user.create({
    data: {
      email: 'vet@test.com',
      passwordHash: passwordShort,
      name: 'Dr. María González (Test)',
      phone: '+34 600 123 456',
      role: 'VET',
    },
  });

  // OWNER principal
  const owner = await prisma.user.create({
    data: {
      email: 'owner1@client.com',
      passwordHash: passwordDefault,
      name: 'Carlos Rodríguez',
      phone: '+34 611 987 654',
      role: 'OWNER',
    },
  });

  // OWNER alias corto
  await prisma.user.create({
    data: {
      email: 'owner@test.com',
      passwordHash: passwordOwnerShort,
      name: 'Carlos Rodríguez (Test)',
      phone: '+34 611 987 654',
      role: 'OWNER',
    },
  });

  // CLINIC_ADMIN
  const admin = await prisma.user.create({
    data: {
      email: 'admin@clinic.com',
      passwordHash: passwordDefault,
      name: 'Dra. Ana Martínez (Admin)',
      phone: '+34 622 555 789',
      role: 'CLINIC_ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: passwordAdminShort,
      name: 'Dra. Ana Martínez (Test)',
      phone: '+34 622 555 789',
      role: 'CLINIC_ADMIN',
    },
  });

  console.log(`✅ Usuarios creados exitosamente`);

  // ============================================
  // 3. Crear clínica de prueba
  // ============================================
  console.log('🏥 Creando clínica de prueba...');

  const clinic = await prisma.clinic.create({
    data: {
      name: 'VetCare Central Hospital Veterinario',
      slug: 'vetcare-central',
      email: 'contacto@vetcarecentral.cl',
      phone: '+56 2 2345 6789',
      address: 'Av. Providencia 1234, Santiago',
      country: 'CHL',
      currency: 'CLP',
      timezone: 'America/Santiago',
      status: 'ACTIVE',
      maxVets: 10,
      maxPets: 500,
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
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log(`✅ Clínica: ${clinic.name}`);

  // ============================================
  // 4. Crear mascotas reales
  // ============================================
  console.log('🐾 Creando pacientes (mascotas)...');

  const petMax = await prisma.pet.create({
    data: {
      clinicId: clinic.id,
      name: 'Max',
      species: 'DOG',
      breed: 'Labrador Retriever',
      weight: 28.5,
      birthDate: new Date('2021-04-10'),
      microchip: '985141002983741',
      ownerId: owner.id,
    },
  });

  const petLuna = await prisma.pet.create({
    data: {
      clinicId: clinic.id,
      name: 'Luna',
      species: 'CAT',
      breed: 'Siamés',
      weight: 4.2,
      birthDate: new Date('2022-08-18'),
      microchip: '985141008712399',
      ownerId: owner.id,
    },
  });

  const petRocky = await prisma.pet.create({
    data: {
      clinicId: clinic.id,
      name: 'Rocky',
      species: 'DOG',
      breed: 'Pastor Alemán',
      weight: 34.0,
      birthDate: new Date('2020-01-25'),
      microchip: '985141005541288',
      ownerId: owner.id,
    },
  });

  console.log(`✅ Mascotas creadas: Max, Luna, Rocky`);

  // ============================================
  // 5. Crear Tratamientos Quirúrgicos y Médicos
  // ============================================
  console.log('🏥 Creando tratamientos y prescripciones...');

  // Tratamiento 1: Max (Orquiectomía - Activo)
  const treatmentMax = await prisma.treatment.create({
    data: {
      clinicId: clinic.id,
      vetId: vet.id,
      petId: petMax.id,
      diagnosis: 'Orquiectomía y sutura de tejido blando. Control post-quirúrgico estricto.',
      procedureType: 'CASTRATION_MALE',
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      rules: {
        create: [
          {
            medicineName: 'Amoxicilina + Ácido Clavulánico',
            dosage: '250mg (1 pastilla)',
            frequencyHours: 12,
            requirePhoto: true,
          },
          {
            medicineName: 'Meloxicam GOTAS',
            dosage: '0.5mg (10 gotas)',
            frequencyHours: 24,
            requirePhoto: false,
          },
        ],
      },
    },
    include: { rules: true },
  });

  // Tratamiento 2: Luna (Ovariohisterectomía - Completado en Historial)
  const treatmentLuna = await prisma.treatment.create({
    data: {
      clinicId: clinic.id,
      vetId: vet.id,
      petId: petLuna.id,
      diagnosis: 'Ovariohisterectomía de rutina y profilaxis dental.',
      procedureType: 'OVARIOHYSTERECTOMY',
      startDate: new Date('2024-05-01'),
      endDate: new Date('2024-05-12'),
      status: 'COMPLETED',
      rules: {
        create: [
          {
            medicineName: 'Cefalexina 150mg',
            dosage: '1 comprimido',
            frequencyHours: 12,
            requirePhoto: true,
          },
        ],
      },
    },
    include: { rules: true },
  });

  // Tratamiento 3: Rocky (Gastroenteritis - Activo en seguimiento)
  const treatmentRocky = await prisma.treatment.create({
    data: {
      clinicId: clinic.id,
      vetId: vet.id,
      petId: petRocky.id,
      diagnosis: 'Gastroenteritis aguda por ingesta de cuerpo extraño. Fluidoterapia y reposo.',
      procedureType: 'GASTROENTEROLOGY',
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      rules: {
        create: [
          {
            medicineName: 'Metronidazol 250mg',
            dosage: '1 tableta',
            frequencyHours: 12,
            requirePhoto: false,
          },
        ],
      },
    },
    include: { rules: true },
  });

  console.log(`✅ 3 Tratamientos creados con reglas de medicación prescritas`);

  // ============================================
  // 6. Crear Registros Diarios (Daily Logs con Fotos)
  // ============================================
  console.log('📅 Creando registros diarios con fotos de evolución...');

  // Logs para Max (Tratamiento Quirúrgico Activo)
  await prisma.dailyLog.create({
    data: {
      treatmentId: treatmentMax.id,
      logType: 'OWNER',
      registeredById: owner.id,
      registeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      medicineTaken: true,
      appetiteLevel: 8,
      energyLevel: 7,
      painLevel: 3,
      temperature: 38.5,
      observations: 'Max comió bien su comida blanda. Se mantiene tranquilo con el collar isabelino.',
      imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80',
      vetNotes: 'Excelente inicio. Mantener el collar isabelino puesto las 24 horas.',
    },
  });

  await prisma.dailyLog.create({
    data: {
      treatmentId: treatmentMax.id,
      logType: 'OWNER',
      registeredById: owner.id,
      registeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      medicineTaken: true,
      appetiteLevel: 9,
      energyLevel: 8,
      painLevel: 2,
      temperature: 38.3,
      alarmSigns: 'Enrojecimiento leve en los bordes de la sutura.',
      observations: 'La herida se ve bastante limpia, sin secreciones.',
      imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80',
      vetNotes: 'La ligera hiperemia es normal a las 48h. Continuar con el antibiótico prescrito.',
    },
  });

  // Logs para Luna (Tratamiento Completado)
  await prisma.dailyLog.create({
    data: {
      treatmentId: treatmentLuna.id,
      logType: 'OWNER',
      registeredById: owner.id,
      registeredAt: new Date('2024-05-10'),
      medicineTaken: true,
      appetiteLevel: 10,
      energyLevel: 9,
      painLevel: 0,
      temperature: 38.1,
      observations: 'Cicatrización completa. Retiro de puntos realizado con éxito.',
      imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80',
      vetNotes: 'Tratamiento dado por finalizado. Paciente dada de alta médica.',
    },
  });

  // ============================================
  // 7. Crear Protocolos, Citas de Control y Hojas de Alta
  // ============================================
  console.log('📋 Creando protocolos post-op, citas de control y altas...');

  // Protocolo post-op para Max
  await prisma.postOpProtocol.create({
    data: {
      treatmentId: treatmentMax.id,
      createdById: vet.id,
      procedureType: 'CASTRATION_MALE',
      alarmSigns: [
        { sign: 'Sangrado activo', severity: 'CRITICAL', description: 'Goteo constante de sangre en la zona.' },
        { sign: 'Letargo severo', severity: 'HIGH', description: 'No responde a estímulos o no se levanta.' },
        { sign: 'Vómitos constantes', severity: 'HIGH', description: 'Más de 3 episodios en menos de 12 horas.' }
      ],
      restrictions: [
        'No correr, saltar o subir escaleras durante 7 días.',
        'Usar collar isabelino de forma permanente.'
      ],
      specialCare: [
        'Limpiar la herida quirúrgica con suero fisiológico y gasa estéril dos veces al día.',
        'Ofrecer comida blanda en porciones pequeñas.'
      ],
      emergencyCall: 'Llamar al +56 2 2345 6789 en horario hábil o asistir a urgencias 24h.'
    }
  });

  // Citas de control para Max
  await prisma.controlVisit.createMany({
    data: [
      {
        treatmentId: treatmentMax.id,
        vetId: vet.id,
        type: 'HOURS_48',
        status: 'COMPLETED',
        scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        clinicalFindings: 'Herida en buenas condiciones. Enrojecimiento leve normal.',
        notes: 'Paciente evoluciona favorablemente.'
      },
      {
        treatmentId: treatmentMax.id,
        vetId: vet.id,
        type: 'STITCH_REMOVAL',
        status: 'SCHEDULED',
        scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        notes: 'Cita agendada para retiro de puntos.'
      }
    ]
  });

  // Hoja de alta para Luna (completada)
  await prisma.dischargeSheet.create({
    data: {
      treatmentId: treatmentLuna.id,
      createdById: vet.id,
      summary: 'OVH de rutina sin complicaciones. Profilaxis dental con pulido.',
      nextSteps: 'Paciente dada de alta médica definitiva. No requiere controles adicionales.',
      returnSigns: 'Monitorear por si hay inflamación tardía, letargo o inapetencia.',
      restrictions: 'Actividad normal. Alimentación habitual.',
      feedingNotes: 'Dieta regular formulada para gatos esterilizados.',
      medications: [
        { name: 'Meloxivet', dosage: '0.1mg', schedule: 'Cada 24 horas', duration: '3 días' }
      ]
    }
  });

  // Generar algunos medication logs ficticios para Max
  const ruleAmox = treatmentMax.rules.find(r => r.medicineName.includes('Amoxicilina'));
  const ruleMelo = treatmentMax.rules.find(r => r.medicineName.includes('Meloxicam'));

  if (ruleAmox && ruleMelo) {
    await prisma.medicationLog.createMany({
      data: [
        {
          treatmentId: treatmentMax.id,
          ruleId: ruleAmox.id,
          registeredById: owner.id,
          scheduledAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          givenAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          status: 'GIVEN',
          notes: 'Tomada con paté.'
        },
        {
          treatmentId: treatmentMax.id,
          ruleId: ruleMelo.id,
          registeredById: owner.id,
          scheduledAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          givenAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // retraso de 1h
          status: 'GIVEN',
          notes: 'Fácil administración.'
        },
        {
          treatmentId: treatmentMax.id,
          ruleId: ruleAmox.id,
          registeredById: owner.id,
          scheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          status: 'PENDING'
        }
      ]
    });
  }

  console.log('🎉 Seeding completo exitosamente!');
  console.log('==============================================');
  console.log('🔑 CREDANCIALES PARA PRUEBAS E2E:');
  console.log('👨‍⚕️ VETERINARIO:       vet1@clinic.com  /  Password123!');
  console.log('🐶 DUEÑO DE MASCOTA:  owner1@client.com /  Password123!');
  console.log('🏥 ADMIN CLÍNICA:     admin@clinic.com /  Password123!');
  console.log('==============================================');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });