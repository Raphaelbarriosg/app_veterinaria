import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ControlVisitsService } from '../control-visits/control-visits.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly controlVisitsService: ControlVisitsService,
  ) {}

  /**
   * Limpieza automática de RefreshTokens expirados o revocados.
   * Se ejecuta diariamente a la medianoche (00:00).
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanExpiredRefreshTokens() {
    this.logger.log('Iniciando tarea programada: limpieza de RefreshTokens expirados o revocados...');
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isRevoked: true },
          ],
        },
      });
      this.logger.log(`Limpieza de tokens completada: ${result.count} registros eliminados.`);
    } catch (error) {
      this.logger.error('Error en CronService al limpiar RefreshTokens:', error);
    }
  }

  /**
   * Recordatorio automático de dosis de medicación próximas.
   * Se ejecuta cada 10 minutos buscando dosis en estado PENDING programadas dentro de los próximos 20 minutos.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendUpcomingMedicationReminders() {
    const now = new Date();
    const in20Minutes = new Date(now.getTime() + 20 * 60 * 1000);

    try {
      const pendingLogs = await this.prisma.medicationLog.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: {
            gte: now,
            lte: in20Minutes,
          },
        },
        include: {
          rule: true,
          treatment: {
            include: {
              pet: true,
            },
          },
        },
      });

      for (const log of pendingLogs) {
        if (!log.treatment || log.treatment.status !== 'ACTIVE') continue;

        const ownerId = log.treatment.pet.ownerId;
        const petName = log.treatment.pet.name;
        const medicationName = log.rule?.medicineName || 'Medicamento';
        const dosage = log.rule?.dosage;

        await this.notificationsService.sendMedicationReminder({
          ownerId,
          petName,
          medicationName,
          dosage,
          treatmentId: log.treatmentId,
        });
      }

      if (pendingLogs.length > 0) {
        this.logger.log(`Recordatorios de medicación despachados vía push: ${pendingLogs.length}`);
      }
    } catch (error) {
      this.logger.error('Error en CronService al procesar recordatorios de medicación:', error);
    }
  }

  /**
   * Recordatorios matutinos de citas de control post-op para mañana.
   * Se ejecuta diariamente a las 08:00 AM.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyControlVisitReminders() {
    this.logger.log('Iniciando recordatorios de citas de control post-op...');
    try {
      const result = await this.controlVisitsService.sendUpcomingReminders();
      this.logger.log(`Recordatorios de visitas de control despachados: ${result.reminded}`);
    } catch (error) {
      this.logger.error('Error en CronService al procesar recordatorios de control:', error);
    }
  }
}
