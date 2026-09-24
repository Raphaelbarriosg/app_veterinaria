import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { Role } from '../../common/enums/role.enum';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import * as crypto from 'crypto';

@Injectable()
export class ClinicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // ── CRUD Clinica ──

  async create(userId: string, dto: CreateClinicDto) {
    // Verificar slug unico
    const existing = await this.prisma.clinic.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`El slug "${dto.slug}" ya esta en uso`);
    }

    // Crear clinica + admin como miembro + suscripcion trial
    const clinic = await this.prisma.clinic.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        country: dto.country,
        currency: dto.currency || 'CLP',
        timezone: dto.timezone || 'America/Santiago',
        status: 'TRIAL',
        members: {
          create: {
            userId,
            role: 'CLINIC_ADMIN',
            isActive: true,
          },
        },
        subscription: {
          create: {
            planType: 'FREE',
            status: 'TRIAL',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias trial
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        },
      },
      include: {
        members: true,
        subscription: true,
      },
    });

    return clinic;
  }

  async findOne(clinicId: string, userId: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        subscription: true,
        _count: { select: { members: true, pets: true } },
      },
    });

    if (!clinic) {
      throw new NotFoundException('Clinica no encontrada');
    }

    // Verificar que el usuario es miembro
    await this.verifyMembership(clinicId, userId);

    return clinic;
  }

  async update(clinicId: string, userId: string, dto: UpdateClinicDto) {
    // Solo CLINIC_ADMIN puede actualizar
    await this.verifyAdmin(clinicId, userId);

    return this.prisma.clinic.update({
      where: { id: clinicId },
      data: dto,
    });
  }

  // ── Miembros ──

  async getMembers(clinicId: string, userId: string) {
    await this.verifyMembership(clinicId, userId);

    return this.prisma.clinicMember.findMany({
      where: { clinicId, isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async inviteMember(clinicId: string, userId: string, dto: InviteMemberDto) {
    await this.verifyAdmin(clinicId, userId);

    // Verificar que el email no sea ya miembro
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      const existingMember = await this.prisma.clinicMember.findUnique({
        where: { clinicId_userId: { clinicId, userId: existingUser.id } },
      });
      if (existingMember) {
        throw new ConflictException('Este usuario ya es miembro de la clinica');
      }
    }

    // Verificar limite de vets segun plan
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { subscription: true, _count: { select: { members: true } } },
    });

    if (clinic && clinic.maxVets <= clinic._count.members) {
      throw new ForbiddenException('Has alcanzado el limite de miembros de tu plan');
    }

    // Crear invitacion
    const token = crypto.randomBytes(32).toString('hex');

    const invitation = await this.prisma.clinicInvitation.create({
      data: {
        clinicId,
        email: dto.email,
        role: dto.role,
        token,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });

    // Enviar correo de invitación (SMTP o consola dry-run)
    const clinicName = clinic?.name || 'Clínica Veterinaria';
    await this.mailService.sendClinicInvitation(dto.email, clinicName, token);

    return invitation;
  }

  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.clinicInvitation.findUnique({
      where: { token },
      include: {
        clinic: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.acceptedAt) {
      throw new ConflictException('Esta invitación ya fue aceptada');
    }

    if (invitation.expiresAt < new Date()) {
      throw new ForbiddenException('Esta invitación ha expirado');
    }

    return invitation;
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.clinicInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitacion no encontrada');
    }

    if (invitation.acceptedAt) {
      throw new ConflictException('Esta invitacion ya fue aceptada');
    }

    if (invitation.expiresAt < new Date()) {
      throw new ForbiddenException('Esta invitacion ha expirado');
    }

    // Verificar que el usuario coincide con el email invitado
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== invitation.email) {
      throw new ForbiddenException('Esta invitacion no corresponde a tu email');
    }

    // Crear membresia + marcar invitacion como aceptada
    await this.prisma.$transaction([
      this.prisma.clinicMember.create({
        data: {
          clinicId: invitation.clinicId,
          userId,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
          isActive: true,
        },
      }),
      this.prisma.clinicInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return { message: 'Invitacion aceptada correctamente', clinicId: invitation.clinicId };
  }

  async removeMember(clinicId: string, adminUserId: string, memberUserId: string) {
    await this.verifyAdmin(clinicId, adminUserId);

    const member = await this.prisma.clinicMember.findUnique({
      where: { clinicId_userId: { clinicId, userId: memberUserId } },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }

    // No puede eliminarse a si mismo
    if (memberUserId === adminUserId) {
      throw new ForbiddenException('No puedes eliminarte a ti mismo');
    }

    await this.prisma.clinicMember.update({
      where: { id: member.id },
      data: { isActive: false },
    });

    return { message: 'Miembro removido correctamente' };
  }

  async updateMemberRole(
    clinicId: string,
    adminUserId: string,
    memberUserId: string,
    newRole: Role,
  ) {
    await this.verifyAdmin(clinicId, adminUserId);

    const member = await this.prisma.clinicMember.findUnique({
      where: { clinicId_userId: { clinicId, userId: memberUserId } },
    });

    if (!member || !member.isActive) {
      throw new NotFoundException('Miembro no encontrado o inactivo');
    }

    // Proteger contra dejar la clínica sin administradores
    if (member.role === Role.CLINIC_ADMIN && newRole !== Role.CLINIC_ADMIN) {
      const adminCount = await this.prisma.clinicMember.count({
        where: { clinicId, role: Role.CLINIC_ADMIN, isActive: true },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException(
          'No puedes cambiar el rol del único administrador de la clínica',
        );
      }
    }

    // Verificar límite de veterinarios según plan si se cambia a VET
    if (newRole === Role.VET && member.role !== Role.VET) {
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: clinicId },
        include: { _count: { select: { members: true } } },
      });

      const currentVets = await this.prisma.clinicMember.count({
        where: { clinicId, role: Role.VET, isActive: true },
      });

      if (clinic && currentVets >= clinic.maxVets) {
        throw new ForbiddenException('Has alcanzado el límite de veterinarios de tu plan');
      }
    }

    return this.prisma.clinicMember.update({
      where: { id: member.id },
      data: { role: newRole as any },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  // ── Invitaciones ──

  async getInvitations(clinicId: string, userId: string) {
    await this.verifyAdmin(clinicId, userId);

    return this.prisma.clinicInvitation.findMany({
      where: {
        clinicId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelInvitation(clinicId: string, userId: string, invitationId: string) {
    await this.verifyAdmin(clinicId, userId);

    const invitation = await this.prisma.clinicInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.clinicId !== clinicId) {
      throw new NotFoundException('Invitación no encontrada');
    }

    await this.prisma.clinicInvitation.delete({
      where: { id: invitationId },
    });

    return { message: 'Invitación cancelada correctamente' };
  }

  // ── Estadísticas en Tiempo Real ──

  async getClinicStats(clinicId: string, userId: string) {
    await this.verifyMembership(clinicId, userId);

    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        subscription: true,
      },
    });

    if (!clinic) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // 1. Conteo de mascotas activas
    const totalPets = await this.prisma.pet.count({
      where: { clinicId, isActive: true },
    });

    // 2. Conteo de miembros por rol
    const membersByRole = await this.prisma.clinicMember.groupBy({
      by: ['role'],
      where: { clinicId, isActive: true },
      _count: { id: true },
    });

    let vetsCount = 0;
    let adminsCount = 0;
    let ownersCount = 0;

    for (const group of membersByRole) {
      if (group.role === 'VET') vetsCount = group._count.id;
      else if (group.role === 'CLINIC_ADMIN') adminsCount = group._count.id;
      else if (group.role === 'OWNER') ownersCount = group._count.id;
    }

    const totalMembers = vetsCount + adminsCount + ownersCount;

    // 3. Tratamientos activos y completados
    const activeTreatments = await this.prisma.treatment.count({
      where: { clinicId, status: 'ACTIVE' },
    });

    const completedTreatments = await this.prisma.treatment.count({
      where: { clinicId, status: 'COMPLETED' },
    });

    // 4. Alertas críticas (tratamientos activos con signos de alarma recientes o sin reportes)
    const activeTreatmentsWithLogs = await this.prisma.treatment.findMany({
      where: { clinicId, status: 'ACTIVE' },
      select: {
        id: true,
        dailyLogs: {
          where: {
            registeredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          select: {
            alarmSigns: true,
            temperature: true,
          },
        },
      },
    });

    const criticalAlerts = activeTreatmentsWithLogs.filter((t) => {
      return (
        t.dailyLogs.length === 0 ||
        t.dailyLogs.some(
          (l) => (l.alarmSigns && l.alarmSigns.trim() !== '') || (l.temperature && Number(l.temperature) >= 39.5)
        )
      );
    }).length;

    // 5. Invitaciones pendientes
    const pendingInvitations = await this.prisma.clinicInvitation.count({
      where: {
        clinicId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    // 6. Distribución de especies
    const speciesGroups = await this.prisma.pet.groupBy({
      by: ['species'],
      where: { clinicId, isActive: true },
      _count: { id: true },
    });

    const speciesDistribution = speciesGroups.map((g) => ({
      species: g.species,
      count: g._count.id,
    }));

    // 7. Capacidad y límites
    const capacity = {
      currentVets: vetsCount,
      maxVets: clinic.maxVets,
      currentPets: totalPets,
      maxPets: clinic.maxPets,
      pctVets: Math.min(100, Math.round((vetsCount / (clinic.maxVets || 1)) * 100)),
      pctPets: Math.min(100, Math.round((totalPets / (clinic.maxPets || 1)) * 100)),
    };

    // 8. Días restantes suscripción / trial
    let daysRemaining = 0;
    if (clinic.subscription?.currentPeriodEnd) {
      const diffMs = new Date(clinic.subscription.currentPeriodEnd).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else if (clinic.subscription?.trialEndsAt) {
      const diffMs = new Date(clinic.subscription.trialEndsAt).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // 9. Actividad reciente (últimos 5 daily logs)
    const recentLogs = await this.prisma.dailyLog.findMany({
      where: { treatment: { clinicId } },
      include: {
        treatment: {
          select: {
            id: true,
            diagnosis: true,
            pet: { select: { id: true, name: true, species: true } },
          },
        },
        registeredBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { registeredAt: 'desc' },
      take: 5,
    });

    return {
      clinic: {
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        email: clinic.email,
        phone: clinic.phone,
        address: clinic.address,
        status: clinic.status,
        timezone: clinic.timezone,
        currency: clinic.currency,
      },
      totalPets,
      activeTreatments,
      completedTreatments,
      criticalAlerts,
      vetsCount,
      adminsCount,
      ownersCount,
      totalMembers,
      pendingInvitations,
      speciesDistribution,
      capacity,
      subscription: clinic.subscription
        ? {
            planType: clinic.subscription.planType,
            status: clinic.subscription.status,
            daysRemaining,
            currentPeriodEnd: clinic.subscription.currentPeriodEnd,
          }
        : null,
      recentActivity: recentLogs.map((log) => ({
        id: log.id,
        treatmentId: log.treatment.id,
        petName: log.treatment.pet.name,
        petSpecies: log.treatment.pet.species,
        diagnosis: log.treatment.diagnosis,
        registeredByName: log.registeredBy?.name || 'Usuario',
        registeredByRole: log.registeredBy?.role || 'VET',
        registeredAt: log.registeredAt,
        logType: log.logType,
        alarmSigns: log.alarmSigns,
      })),
    };
  }

  // ── Clinicas del usuario ──

  async getUserClinics(userId: string) {
    return this.prisma.clinicMember.findMany({
      where: { userId, isActive: true },
      include: {
        clinic: {
          include: {
            subscription: { select: { planType: true, status: true } },
            _count: { select: { members: true, pets: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // ── Helpers ──

  private async verifyMembership(clinicId: string, userId: string) {
    const member = await this.prisma.clinicMember.findUnique({
      where: { clinicId_userId: { clinicId, userId } },
    });

    if (!member || !member.isActive) {
      throw new ForbiddenException('No eres miembro de esta clinica');
    }

    return member;
  }

  private async verifyAdmin(clinicId: string, userId: string) {
    const member = await this.verifyMembership(clinicId, userId);

    if (member.role !== 'CLINIC_ADMIN' && member.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Solo el administrador puede realizar esta accion');
    }

    return member;
  }
}