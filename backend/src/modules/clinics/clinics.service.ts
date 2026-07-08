import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import * as crypto from 'crypto';

@Injectable()
export class ClinicsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.clinicInvitation.create({
      data: {
        clinicId,
        email: dto.email,
        role: dto.role,
        token,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });
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