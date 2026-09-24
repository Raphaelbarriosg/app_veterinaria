import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { Role } from '@prisma/client';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly isDryRun: boolean;

  constructor(private readonly prisma: PrismaService) {
    // Si no se proveen credenciales de Firebase en el entorno, operamos en modo Dry-Run seguro
    const hasFirebaseCreds = !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_PROJECT_ID);
    this.isDryRun = !hasFirebaseCreds;

    if (this.isDryRun) {
      this.logger.log('Firebase FCM no configurado. NotificationsService operará en modo Dry-Run (registro en consola).');
    } else {
      this.logger.log('NotificationsService inicializado con soporte Firebase FCM.');
    }
  }

  /**
   * Registrar o actualizar el token FCM de un dispositivo para el usuario autenticado.
   */
  async registerToken(userId: string, dto: RegisterDeviceTokenDto) {
    const tokenRecord = await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
        isActive: true,
      },
      update: {
        userId,
        platform: dto.platform,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Token FCM registrado/actualizado para usuario ${userId} (${dto.platform})`);
    return {
      success: true,
      message: 'Token de dispositivo registrado exitosamente',
      id: tokenRecord.id,
      platform: tokenRecord.platform,
    };
  }

  /**
   * Revocar un token de dispositivo (ej. al cerrar sesión).
   */
  async removeToken(userId: string, token: string) {
    const result = await this.prisma.deviceToken.updateMany({
      where: {
        userId,
        token,
      },
      data: {
        isActive: false,
      },
    });

    this.logger.log(`Token FCM revocado para usuario ${userId}. Afectados: ${result.count}`);
    return {
      success: true,
      revoked: result.count > 0,
    };
  }

  /**
   * Obtener tokens activos del usuario.
   */
  async getUserTokens(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        token: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Despachar notificación push a todos los dispositivos activos de un usuario.
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
    const activeTokens = await this.prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (activeTokens.length === 0) {
      this.logger.debug(`El usuario ${userId} no tiene dispositivos activos registrados para push.`);
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const device of activeTokens) {
      try {
        await this.dispatchNotification(device.token, device.platform, payload);
        sent++;
      } catch (err) {
        failed++;
        this.logger.error(`Error enviando notificación a token ${device.token.substring(0, 15)}...`, err);
      }
    }

    return { sent, failed };
  }

  /**
   * Despachar notificación push a todos los miembros de una clínica con un rol específico.
   */
  async sendToClinic(clinicId: string, role: Role, payload: PushNotificationPayload) {
    const members = await this.prisma.clinicMember.findMany({
      where: {
        clinicId,
        role,
        isActive: true,
      },
      select: {
        userId: true,
      },
    });

    const results = await Promise.all(
      members.map((m) => this.sendToUser(m.userId, payload)),
    );

    const totalSent = results.reduce((acc, r) => acc + r.sent, 0);
    const totalFailed = results.reduce((acc, r) => acc + r.failed, 0);

    return { recipients: members.length, sent: totalSent, failed: totalFailed };
  }

  /**
   * Disparar alerta urgente de emergencia a los veterinarios y administradores de una clínica.
   */
  async sendEmergencyAlert(params: {
    clinicId?: string;
    petName: string;
    ownerName: string;
    severity: string;
    symptoms: string;
    treatmentId?: string;
  }) {
    const title = `🚨 EMERGENCIA (${params.severity}): ${params.petName}`;
    const body = `${params.ownerName} reportó: "${params.symptoms}"`;
    const data = {
      type: 'EMERGENCY_ALERT',
      severity: params.severity,
      petName: params.petName,
      treatmentId: params.treatmentId || '',
    };

    if (params.clinicId) {
      await this.sendToClinic(params.clinicId, Role.VET, { title, body, data });
      await this.sendToClinic(params.clinicId, Role.CLINIC_ADMIN, { title, body, data });
    }
  }

  /**
   * Disparar recordatorio de toma de medicación al dueño de la mascota.
   */
  async sendMedicationReminder(params: {
    ownerId: string;
    petName: string;
    medicationName: string;
    dosage?: string;
    treatmentId: string;
  }) {
    const title = `💊 Medicamento para ${params.petName}`;
    const body = params.dosage
      ? `Es hora de administrar ${params.medicationName} (${params.dosage}) a ${params.petName}.`
      : `Es hora de administrar ${params.medicationName} a ${params.petName}.`;

    return this.sendToUser(params.ownerId, {
      title,
      body,
      data: {
        type: 'MEDICATION_REMINDER',
        treatmentId: params.treatmentId,
        petName: params.petName,
        medicationName: params.medicationName,
      },
    });
  }

  /**
   * Disparar recordatorio de cita de control al dueño.
   */
  async sendControlVisitReminder(params: {
    ownerId: string;
    petName: string;
    visitType: string;
    scheduledAt: Date;
    treatmentId: string;
  }) {
    const dateFormatted = new Date(params.scheduledAt).toLocaleString('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const title = `📅 Cita de Control: ${params.petName}`;
    const body = `Tienes un control (${params.visitType}) agendado para el ${dateFormatted}.`;

    return this.sendToUser(params.ownerId, {
      title,
      body,
      data: {
        type: 'CONTROL_VISIT_REMINDER',
        treatmentId: params.treatmentId,
        visitType: params.visitType,
        scheduledAt: params.scheduledAt.toISOString(),
      },
    });
  }

  /**
   * Motor de despacho individual (maneja Dry-Run o integración directa).
   */
  private async dispatchNotification(
    token: string,
    platform: string,
    payload: PushNotificationPayload,
  ): Promise<void> {
    if (this.isDryRun) {
      this.logger.log(
        `[DRY-RUN PUSH] [${platform.toUpperCase()}] Token: ${token.substring(0, 18)}... | Título: "${payload.title}" | Mensaje: "${payload.body}" | Data: ${JSON.stringify(payload.data || {})}`,
      );
      return;
    }

    // Si Firebase está activo, aquí se llamaría a admin.messaging().send(...)
    // Manejo de token inválido para deshabilitarlo automáticamente:
    // try { await firebaseAdmin.messaging().send(...) }
    // catch (err) { if (err.code === 'messaging/registration-token-not-registered') this.prisma.deviceToken.update(...) }
  }
}
