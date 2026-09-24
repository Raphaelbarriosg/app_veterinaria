import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { MailService } from '../mail/mail.service';
import { DailyLogType } from '@prisma/client';

@Injectable()
export class DailyLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(userId: string, userRole: string, dto: CreateDailyLogDto) {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: dto.treatmentId },
      include: {
        pet: { include: { owner: true } },
        vet: true,
      },
    });

    if (!treatment) {
      throw new NotFoundException('Tratamiento no encontrado');
    }

    // Identificar el tipo de log a registrar
    let logType: DailyLogType = DailyLogType.OWNER;
    
    if (userRole === 'OWNER') {
      if (treatment.pet.ownerId !== userId) {
        throw new ForbiddenException('Solo el dueño de la mascota puede registrar logs de propietario');
      }
      logType = DailyLogType.OWNER;
    } else if (userRole === 'VET' || userRole === 'CLINIC_ADMIN') {
      // Verificar membresía en la clínica
      const membership = await this.prisma.clinicMember.findFirst({
        where: { clinicId: treatment.clinicId, userId, isActive: true },
      });
      if (!membership) {
        throw new ForbiddenException('No tienes acceso a la clínica de este tratamiento');
      }
      logType = DailyLogType.CLINICAL;
    }

    if (treatment.status !== 'ACTIVE') {
      throw new ForbiddenException('No se pueden agregar logs a un tratamiento no activo');
    }

    const log = await this.prisma.dailyLog.create({
      data: {
        treatmentId: dto.treatmentId,
        logType,
        registeredById: userId,
        medicineTaken: dto.medicineTaken ?? false,
        appetiteLevel: dto.appetiteLevel,
        energyLevel: dto.energyLevel,
        painLevel: dto.painLevel,
        temperature: dto.temperature,
        alarmSigns: dto.alarmSigns,
        observations: dto.observations,
        imageUrl: dto.imageUrl,
      },
    });

    // Si hay signos de alarma y es un log de OWNER, alertar inmediatamente al veterinario
    if (dto.alarmSigns && dto.alarmSigns.trim() !== '' && logType === DailyLogType.OWNER) {
      if (treatment.vet.email) {
        await this.mailService.sendAlertToVet(
          treatment.vet.email,
          treatment.vet.name,
          treatment.pet.name,
          treatment.pet.owner.name,
          dto.alarmSigns,
          treatment.id,
        );
      }
    }

    return log;
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
        include: { registeredBy: { select: { id: true, name: true, role: true } } },
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

  async update(logId: string, userId: string, userRole: string, dto: CreateDailyLogDto) {
    const log = await this.prisma.dailyLog.findUnique({
      where: { id: logId },
      include: { treatment: { include: { pet: true } } },
    });

    if (!log) {
      throw new NotFoundException('Registro diario no encontrado');
    }

    // Validación de ventana de edición de 24 horas
    const oneDayInMs = 24 * 60 * 60 * 1000;
    if (Date.now() - log.registeredAt.getTime() > oneDayInMs) {
      throw new BadRequestException('El registro no puede editarse después de 24 horas');
    }

    // Validación de permisos
    if (userRole === 'OWNER' && log.registeredById !== userId) {
      throw new ForbiddenException('No tienes permisos para editar este registro');
    } else if (userRole === 'VET' || userRole === 'CLINIC_ADMIN') {
      const membership = await this.prisma.clinicMember.findFirst({
        where: { clinicId: log.treatment.clinicId, userId, isActive: true },
      });
      if (!membership) {
        throw new ForbiddenException('No perteneces a la clínica de este tratamiento');
      }
    }

    // Construir el historial de cambios
    const currentHistory = Array.isArray(log.editHistory) ? log.editHistory : [];
    const newHistoryEntry = {
      editedAt: new Date().toISOString(),
      editedBy: userId,
      previousValues: {
        appetiteLevel: log.appetiteLevel,
        energyLevel: log.energyLevel,
        painLevel: log.painLevel,
        temperature: log.temperature ? Number(log.temperature) : null,
        alarmSigns: log.alarmSigns,
        observations: log.observations,
        imageUrl: log.imageUrl,
        medicineTaken: log.medicineTaken,
      },
    };
    currentHistory.push(newHistoryEntry as any);


    return this.prisma.dailyLog.update({
      where: { id: logId },
      data: {
        medicineTaken: dto.medicineTaken ?? log.medicineTaken,
        appetiteLevel: dto.appetiteLevel,
        energyLevel: dto.energyLevel,
        painLevel: dto.painLevel ?? log.painLevel,
        temperature: dto.temperature ?? log.temperature,
        alarmSigns: dto.alarmSigns ?? log.alarmSigns,
        observations: dto.observations ?? log.observations,
        imageUrl: dto.imageUrl ?? log.imageUrl,
        editedAt: new Date(),
        editedById: userId,
        editHistory: currentHistory as any,
      },
    });
  }

  async updateVetNotes(logId: string, vetNotes: string) {
    const log = await this.prisma.dailyLog.findUnique({ where: { id: logId } });
    if (!log) {
      throw new NotFoundException('Registro diario no encontrado');
    }

    return this.prisma.dailyLog.update({
      where: { id: logId },
      data: { vetNotes },
    });
  }
}

