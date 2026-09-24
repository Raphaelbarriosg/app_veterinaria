import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';

@Injectable()
export class TreatmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolver clinicId a partir del petId (la mascota ya tiene clinicId)
   */
  private async getClinicIdFromPet(petId: string): Promise<string> {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      select: { clinicId: true },
    });
    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }
    return pet.clinicId;
  }

  async create(vetId: string, dto: CreateTreatmentDto) {
    // Obtener clinicId de la mascota
    const clinicId = await this.getClinicIdFromPet(dto.petId);

    return this.prisma.treatment.create({
      data: {
        clinicId,
        vetId,
        petId: dto.petId,
        diagnosis: dto.diagnosis,
        procedureType: dto.procedureType ?? 'OTHER',
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        rules: dto.rules
          ? {
              create: dto.rules.map((rule) => ({
                medicineName: rule.medicineName,
                dosage: rule.dosage,
                frequencyHours: rule.frequencyHours,
                requirePhoto: rule.requirePhoto ?? false,
              })),
            }
          : undefined,
      },
      include: { rules: true, pet: true },
    });
  }

  async findAllByVet(vetId: string, status?: string) {
    const whereClause: any = { vetId };
    if (status) {
      whereClause.status = status;
    }
    return this.prisma.treatment.findMany({
      where: whereClause,
      include: {
        pet: { include: { owner: { select: { id: true, name: true, phone: true } } } },
        rules: true,
        dailyLogs: { orderBy: { registeredAt: 'desc' }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByPet(petId: string, userId: string, userRole: string, status?: string) {
    // Verificar que el dueño tenga acceso a esta mascota
    if (userRole === 'OWNER') {
      const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
      if (!pet || pet.ownerId !== userId) {
        throw new ForbiddenException('No tienes acceso a esta mascota');
      }
    }

    const where: any = { petId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    return this.prisma.treatment.findMany({
      where,
      include: {
        vet: { select: { id: true, name: true, email: true, phone: true } },
        rules: true,
        dailyLogs: { orderBy: { registeredAt: 'desc' } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getHistory(vetId: string, query?: { q?: string; status?: string; page?: number; limit?: number }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      vetId,
    };

    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query?.q && query.q.trim() !== '') {
      where.OR = [
        { diagnosis: { contains: query.q, mode: 'insensitive' } },
        { pet: { name: { contains: query.q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.treatment.findMany({
        where,
        include: {
          pet: { include: { owner: { select: { id: true, name: true, phone: true } } } },
          rules: true,
          dailyLogs: { orderBy: { registeredAt: 'desc' }, take: 5 },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.treatment.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id },
      include: {
        vet: { select: { id: true, name: true, email: true, phone: true } },
        pet: { include: { owner: { select: { id: true, name: true, phone: true } } } },
        rules: true,
        dailyLogs: { orderBy: { registeredAt: 'desc' } },
      },
    });

    if (!treatment) {
      throw new NotFoundException('Tratamiento no encontrado');
    }

    return treatment;
  }

  async update(id: string, vetId: string, dto: UpdateTreatmentDto) {
    const treatment = await this.prisma.treatment.findUnique({ where: { id } });

    if (!treatment) {
      throw new NotFoundException('Tratamiento no encontrado');
    }

    if (treatment.vetId !== vetId) {
      throw new ForbiddenException('Solo el veterinario que creó el tratamiento puede editarlo');
    }

    return this.prisma.treatment.update({
      where: { id },
      data: {
        ...dto,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { rules: true },
    });
  }

  /**
   * Dashboard Semáforo — Calcula el estado de cumplimiento de tratamientos activos.
   */
  async getDashboard(vetId: string) {
    const treatments = await this.prisma.treatment.findMany({
      where: { vetId, status: 'ACTIVE' },
      include: {
        pet: { include: { owner: { select: { id: true, name: true, phone: true } } } },
        rules: true,
        dailyLogs: {
          where: {
            registeredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          orderBy: { registeredAt: 'desc' },
        },
        medicationLogs: {
          where: {
            scheduledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          orderBy: { scheduledAt: 'desc' },
        },
      },
    });

    // Importación de los umbrales de temperatura por especie
    const { TEMP_THRESHOLDS } = require('../medication-logs/medication-logs.service');

    return treatments.map((treatment) => {
      const logs24h = treatment.dailyLogs;
      const medLogs24h = treatment.medicationLogs;

      // RED rules
      const hasAlarmSigns = logs24h.some((log) => log.alarmSigns && log.alarmSigns.trim() !== '');

      const thresholds = TEMP_THRESHOLDS[treatment.pet.species] || TEMP_THRESHOLDS.OTHER;
      const hasFever = logs24h.some(
        (log) => log.temperature && Number(log.temperature) >= thresholds.fever,
      );

      // RED if alarm signs present, fever, or zero daily reports
      const isRed = hasAlarmSigns || hasFever || logs24h.length === 0;

      // YELLOW rules
      // Check missed dose (explicitly SKIPPED or PENDING older than 2 hours)
      const hasMissedDose = medLogs24h.some(
        (log) => log.status === 'SKIPPED' || (log.status === 'PENDING' && (Date.now() - log.scheduledAt.getTime()) > 2 * 60 * 60 * 1000),
      );

      const hasLowAppetite = logs24h.some((log) => log.appetiteLevel <= 2);

      // Low energy is only a concern if the surgery was more than 3 days ago (otherwise rest is expected)
      const daysSinceStart = (Date.now() - treatment.startDate.getTime()) / (24 * 60 * 60 * 1000);
      const hasLowEnergyConcern = logs24h.some(
        (log) => log.energyLevel <= 2 && daysSinceStart > 3,
      );

      const isYellow = !isRed && (hasMissedDose || hasLowAppetite || hasLowEnergyConcern);

      let priority: 'RED' | 'YELLOW' | 'GREEN' = 'GREEN';
      if (isRed) {
        priority = 'RED';
      } else if (isYellow) {
        priority = 'YELLOW';
      }

      const expectedDoses = treatment.rules.reduce(
        (sum, rule) => sum + Math.floor(24 / rule.frequencyHours),
        0,
      );
      const actualDoses = medLogs24h.filter(
        (log) => log.status === 'GIVEN' || log.status === 'LATE',
      ).length;

      return {
        treatmentId: treatment.id,
        pet: treatment.pet,
        diagnosis: treatment.diagnosis,
        procedureType: treatment.procedureType,
        startDate: treatment.startDate,
        priority,
        stats: {
          expectedDoses,
          actualDoses,
          hasAlarmSigns,
          hasFever,
          logsCount24h: logs24h.length,
          medLogsCount24h: medLogs24h.length,
        },
        recentLogs: logs24h.slice(0, 3),
      };
    }).sort((a, b) => {
      const order = { RED: 0, YELLOW: 1, GREEN: 2 };
      return order[a.priority] - order[b.priority];
    });
  }
}
