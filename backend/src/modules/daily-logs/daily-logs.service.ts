import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';

@Injectable()
export class DailyLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDailyLogDto) {
    // Verificar que el tratamiento existe y que el usuario es el dueño de la mascota
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: dto.treatmentId },
      include: { pet: true },
    });

    if (!treatment) {
      throw new NotFoundException('Tratamiento no encontrado');
    }

    if (treatment.pet.ownerId !== userId) {
      throw new ForbiddenException('Solo el dueño de la mascota puede registrar logs');
    }

    if (treatment.status !== 'ACTIVE') {
      throw new ForbiddenException('No se pueden agregar logs a un tratamiento no activo');
    }

    return this.prisma.dailyLog.create({
      data: {
        treatmentId: dto.treatmentId,
        medicineTaken: dto.medicineTaken,
        appetiteLevel: dto.appetiteLevel,
        energyLevel: dto.energyLevel,
        painLevel: dto.painLevel,
        temperature: dto.temperature,
        alarmSigns: dto.alarmSigns,
        observations: dto.observations,
        imageUrl: dto.imageUrl,
      },
    });
  }

  async findByTreatment(
    treatmentId: string,
    userId: string,
    userRole: string,
    page = 1,
    limit = 20,
  ) {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId },
      include: { pet: true },
    });

    if (!treatment) {
      throw new NotFoundException('Tratamiento no encontrado');
    }

    // Los dueños solo ven logs de sus mascotas
    if (userRole === 'OWNER' && treatment.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes acceso a estos registros');
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.dailyLog.findMany({
        where: { treatmentId },
        orderBy: { registeredAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.dailyLog.count({ where: { treatmentId } }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
