import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateControlVisitDto, CompleteControlVisitDto } from './dto/control-visit.dto';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ControlVisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(vetId: string, treatmentId: string, dto: CreateControlVisitDto) {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId },
      include: { pet: { include: { owner: true } } },
    });
    if (!treatment) throw new NotFoundException('Tratamiento no encontrado');
    if (treatment.vetId !== vetId) {
      throw new ForbiddenException('Solo el veterinario asignado puede agendar citas de control');
    }

    const visit = await this.prisma.controlVisit.create({
      data: {
        treatmentId,
        vetId: dto.vetId ?? vetId,
        type: dto.type,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes,
      },
      include: { vet: { select: { id: true, name: true, phone: true } } },
    });

    // Notificar al dueño por email
    const owner = treatment.pet.owner;
    await this.mailService.sendControlVisitReminder(
      owner.email,
      owner.name,
      treatment.pet.name,
      visit.type,
      visit.scheduledAt,
    );

    // Notificar al dueño por Push Notification
    await this.notificationsService.sendControlVisitReminder({
      ownerId: owner.id,
      petName: treatment.pet.name,
      visitType: visit.type,
      scheduledAt: visit.scheduledAt,
      treatmentId,
    });

    return visit;
  }

  async findByTreatment(treatmentId: string) {
    return this.prisma.controlVisit.findMany({
      where: { treatmentId },
      include: { vet: { select: { id: true, name: true, phone: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async complete(visitId: string, vetId: string, dto: CompleteControlVisitDto) {
    const visit = await this.prisma.controlVisit.findUnique({
      where: { id: visitId },
    });
    if (!visit) throw new NotFoundException('Cita de control no encontrada');
    if (visit.vetId !== vetId) {
      throw new ForbiddenException('Solo el veterinario asignado puede completar esta cita');
    }

    return this.prisma.controlVisit.update({
      where: { id: visitId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        clinicalFindings: dto.clinicalFindings,
        notes: dto.notes,
      },
    });
  }

  async cancel(visitId: string, vetId: string) {
    const visit = await this.prisma.controlVisit.findUnique({ where: { id: visitId } });
    if (!visit) throw new NotFoundException('Cita de control no encontrada');
    if (visit.vetId !== vetId) {
      throw new ForbiddenException('Solo el veterinario asignado puede cancelar esta cita');
    }
    return this.prisma.controlVisit.update({
      where: { id: visitId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Cron: detectar citas programadas para mañana y enviar recordatorio al dueño.
   */
  async sendUpcomingReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const dayEnd   = new Date(tomorrow.setHours(23, 59, 59, 999));

    const visits = await this.prisma.controlVisit.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        treatment: {
          include: { pet: { include: { owner: true } } },
        },
        vet: { select: { name: true, phone: true } },
      },
    });

    for (const visit of visits) {
      const owner = visit.treatment.pet.owner;
      await this.mailService.sendControlVisitReminder(
        owner.email,
        owner.name,
        visit.treatment.pet.name,
        visit.type,
        visit.scheduledAt,
      );

      await this.notificationsService.sendControlVisitReminder({
        ownerId: owner.id,
        petName: visit.treatment.pet.name,
        visitType: visit.type,
        scheduledAt: visit.scheduledAt,
        treatmentId: visit.treatmentId,
      });
    }

    return { reminded: visits.length };
  }
}
