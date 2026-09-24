import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MedicationLogStatus } from '@prisma/client';
import { CreateMedicationLogDto } from './dto/create-medication-log.dto';

// ─── Umbrales normales de temperatura por especie ───
const TEMP_THRESHOLDS: Record<string, { min: number; max: number; fever: number }> = {
  DOG:    { min: 37.8, max: 39.2, fever: 39.5 },
  CAT:    { min: 38.1, max: 39.2, fever: 39.5 },
  BIRD:   { min: 40.0, max: 42.0, fever: 43.0 },
  RODENT: { min: 37.0, max: 38.5, fever: 39.5 },
  REPTILE:{ min: 25.0, max: 35.0, fever: 36.0 },
  OTHER:  { min: 38.0, max: 39.5, fever: 40.0 },
};

export { TEMP_THRESHOLDS };

@Injectable()
export class MedicationLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear o actualizar un registro de dosis individual.
   * Si ya existe un log PENDING para esa regla en ese scheduledAt → lo actualiza.
   * Si no → crea uno nuevo.
   */
  async upsertLog(userId: string, dto: CreateMedicationLogDto) {
    // Verificar que el tratamiento existe y el usuario tiene acceso
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: dto.treatmentId },
      include: { pet: true, rules: true },
    });

    if (!treatment) throw new NotFoundException('Tratamiento no encontrado');

    // Solo el OWNER o el VET asignado pueden registrar
    const isOwner = treatment.pet.ownerId === userId;
    const isVet   = treatment.vetId === userId;
    if (!isOwner && !isVet) {
      throw new ForbiddenException('No tienes acceso a este tratamiento');
    }

    if (treatment.status !== 'ACTIVE') {
      throw new ForbiddenException('El tratamiento no está activo');
    }

    // Verificar que la regla pertenece al tratamiento
    const rule = treatment.rules.find((r) => r.id === dto.ruleId);
    if (!rule) throw new BadRequestException('Regla de medicación no encontrada en este tratamiento');
    if (!rule.isActive) throw new BadRequestException('Esta regla de medicación ya no está activa');

    const scheduledAt = new Date(dto.scheduledAt);
    const givenAt = dto.givenAt ? new Date(dto.givenAt) : undefined;

    // Determinar el status automáticamente si givenAt está presente
    let status = dto.status ?? 'PENDING';
    if (givenAt && status === 'PENDING') {
      const diffMinutes = (givenAt.getTime() - scheduledAt.getTime()) / 60000;
      status = diffMinutes > 120 ? 'LATE' : 'GIVEN'; // Más de 2h = LATE
    }

    // Buscar si ya existe un log para esa dosis (upsert por treatmentId + ruleId + scheduledAt)
    const existing = await this.prisma.medicationLog.findFirst({
      where: {
        treatmentId: dto.treatmentId,
        ruleId: dto.ruleId,
        scheduledAt: {
          gte: new Date(scheduledAt.getTime() - 30 * 60000), // ±30 min de ventana
          lte: new Date(scheduledAt.getTime() + 30 * 60000),
        },
      },
    });

    if (existing) {
      return this.prisma.medicationLog.update({
        where: { id: existing.id },
        data: {
          givenAt,
          status: status as MedicationLogStatus,
          skippedReason: dto.skippedReason,
          photoUrl: dto.photoUrl,
          notes: dto.notes,
          registeredById: userId,
        },
        include: { rule: true },
      });
    }

    return this.prisma.medicationLog.create({
      data: {
        treatmentId: dto.treatmentId,
        ruleId: dto.ruleId,
        registeredById: userId,
        scheduledAt,
        givenAt,
        status: status as MedicationLogStatus,
        skippedReason: dto.skippedReason,
        photoUrl: dto.photoUrl,
        notes: dto.notes,
      },
      include: { rule: true },
    });
  }

  /**
   * Obtener todos los logs de medicación de un tratamiento,
   * con resumen de cumplimiento por regla.
   */
  async findByTreatment(treatmentId: string, userId: string, userRole: string) {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId },
      include: { pet: true, rules: { where: { isActive: true } } },
    });

    if (!treatment) throw new NotFoundException('Tratamiento no encontrado');

    if (userRole === 'OWNER' && treatment.pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes acceso a este tratamiento');
    }

    const logs = await this.prisma.medicationLog.findMany({
      where: { treatmentId },
      include: { rule: true, registeredBy: { select: { id: true, name: true, role: true } } },
      orderBy: { scheduledAt: 'desc' },
    });

    // Calcular cumplimiento por regla
    const compliance = treatment.rules.map((rule) => {
      const ruleLogs = logs.filter((l) => l.ruleId === rule.id);
      const given  = ruleLogs.filter((l) => l.status === 'GIVEN' || l.status === 'LATE').length;
      const late   = ruleLogs.filter((l) => l.status === 'LATE').length;
      const skipped = ruleLogs.filter((l) => l.status === 'SKIPPED').length;
      const total  = ruleLogs.filter((l) => l.status !== 'PENDING').length;
      const rate   = total > 0 ? Math.round((given / total) * 100) : null;

      return {
        ruleId: rule.id,
        medicineName: rule.medicineName,
        dosage: rule.dosage,
        frequencyHours: rule.frequencyHours,
        complianceRate: rate,
        given,
        late,
        skipped,
        total,
      };
    });

    return { logs, compliance };
  }

  /**
   * Obtener los logs de medicación de las últimas N horas de un tratamiento.
   * Usado por el semáforo del dashboard VET.
   */
  async getRecentLogs(treatmentId: string, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.prisma.medicationLog.findMany({
      where: {
        treatmentId,
        scheduledAt: { gte: since },
      },
      include: { rule: true },
      orderBy: { scheduledAt: 'desc' },
    });
  }
}
