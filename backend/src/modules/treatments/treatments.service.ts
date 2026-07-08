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

  async findAllByPet(petId: string, userId: string, userRole: string) {
    // Verificar que el dueño tenga acceso a esta mascota
    if (userRole === 'OWNER') {
      const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
      if (!pet || pet.ownerId !== userId) {
        throw new ForbiddenException('No tienes acceso a esta mascota');
      }
    }

    return this.prisma.treatment.findMany({
      where: { petId },
      include: {
        vet: { select: { id: true, name: true, email: true } },
        rules: true,
        dailyLogs: { orderBy: { registeredAt: 'desc' }, take: 5 },
      },
      orderBy: { startDate: 'desc' },
    });
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
      },
    });

    return treatments.map((treatment) => {
      const logs24h = treatment.dailyLogs;
      const hasAlarmSigns = logs24h.some((log) => log.alarmSigns && log.alarmSigns.trim() !== '');
      const expectedDoses = treatment.rules.reduce(
        (sum, rule) => sum + Math.floor(24 / rule.frequencyHours),
        0,
      );
      const actualDoses = logs24h.filter((log) => log.medicineTaken).length;
      const hasLowLevels = logs24h.some(
        (log) => log.appetiteLevel <= 2 || log.energyLevel <= 2,
      );

      let priority: 'RED' | 'YELLOW' | 'GREEN';

      if (hasAlarmSigns || logs24h.length === 0) {
        priority = 'RED';
      } else if (actualDoses < expectedDoses || hasLowLevels) {
        priority = 'YELLOW';
      } else {
        priority = 'GREEN';
      }

      return {
        treatmentId: treatment.id,
        pet: treatment.pet,
        diagnosis: treatment.diagnosis,
        startDate: treatment.startDate,
        priority,
        stats: {
          expectedDoses,
          actualDoses,
          hasAlarmSigns,
          hasLowLevels,
          logsCount24h: logs24h.length,
        },
        recentLogs: logs24h.slice(0, 3),
      };
    }).sort((a, b) => {
      const order = { RED: 0, YELLOW: 1, GREEN: 2 };
      return order[a.priority] - order[b.priority];
    });
  }
}
