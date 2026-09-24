import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

export class CreateEmergencyDto {
  @ApiProperty({ description: 'ID de la mascota' })
  petId: string;

  @ApiProperty({ description: 'Descripción de los síntomas' })
  symptoms: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: false })
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty({ required: false })
  notes?: string;
}

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async reportEmergency(userId: string, dto: CreateEmergencyDto) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: dto.petId },
      include: { clinic: true, owner: true },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    const severity = dto.severity || 'HIGH';
    this.logger.warn(`[EMERGENCIA VETERINARIA] Alerta para ${pet.name} (Nivel: ${severity}): ${dto.symptoms}`);

    if (pet.clinic?.email) {
      await this.mailService.sendClinicInvitation(
        pet.clinic.email,
        `[ALERTA URGENTE] Emergencia reportada para ${pet.name}`,
        `Detalles:\nMascota: ${pet.name}\nDueño: ${pet.owner.name} (${pet.owner.email})\nSeveridad: ${severity}\nSíntomas: ${dto.symptoms}`,
      );
    }

    // Despachar notificación push en tiempo real a veterinarios y administradores
    await this.notificationsService.sendEmergencyAlert({
      clinicId: pet.clinicId,
      petName: pet.name,
      ownerName: pet.owner.name,
      severity,
      symptoms: dto.symptoms,
    });

    return {
      success: true,
      emergencyId: `EMG-${Date.now().toString().slice(-6)}`,
      petName: pet.name,
      severity,
      clinicContactPhone: pet.clinic?.phone || 'Sin teléfono registrado',
      clinicEmail: pet.clinic?.email || 'Sin email registrado',
      message: 'Emergencia registrada y alerta enviada a la clínica asignada.',
      createdAt: new Date(),
    };
  }
}
