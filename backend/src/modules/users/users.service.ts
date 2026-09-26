import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTutorDto } from './dto/create-tutor.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, data: { name?: string; phone?: string }) {
    await this.findOne(id); // Verifica existencia

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Buscar y listar tutores (usuarios con rol OWNER) para la clínica
   */
  async searchOwners(query?: string) {
    const trimmed = query?.trim();
    return this.prisma.user.findMany({
      where: {
        role: 'OWNER',
        ...(trimmed
          ? {
              OR: [
                { name: { contains: trimmed, mode: 'insensitive' } },
                { email: { contains: trimmed, mode: 'insensitive' } },
                { phone: { contains: trimmed, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: { ownedPets: true },
        },
      },
      take: 50,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Crear o vincular un nuevo tutor (cliente) directamente desde el flujo médico
   */
  async createTutor(creatorUserId: string, dto: CreateTutorDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.role !== 'OWNER') {
        throw new ConflictException(
          'Ya existe un usuario con este correo pero está registrado con otro rol',
        );
      }
      await this.ensureClinicMembership(creatorUserId, existing.id);
      return {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        role: existing.role,
        alreadyExisted: true,
      };
    }

    const rawPassword = dto.password || 'Tutor' + Math.floor(1000 + Math.random() * 9000);
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        phone: dto.phone?.trim() || null,
        passwordHash,
        role: 'OWNER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    await this.ensureClinicMembership(creatorUserId, newUser.id);

    return {
      ...newUser,
      alreadyExisted: false,
    };
  }

  /**
   * Asegura que el tutor esté vinculado como miembro OWNER a la clínica del veterinario
   */
  private async ensureClinicMembership(creatorUserId: string, ownerUserId: string) {
    const creatorMembership = await this.prisma.clinicMember.findFirst({
      where: { userId: creatorUserId, isActive: true },
    });

    let clinicId = creatorMembership?.clinicId;
    if (!clinicId) {
      const defaultClinic = await this.prisma.clinic.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
      });
      clinicId = defaultClinic?.id;
    }

    if (clinicId) {
      const existing = await this.prisma.clinicMember.findUnique({
        where: { clinicId_userId: { clinicId, userId: ownerUserId } },
      });
      if (!existing) {
        await this.prisma.clinicMember.create({
          data: {
            clinicId,
            userId: ownerUserId,
            role: 'OWNER',
            isActive: true,
          },
        });
      }
    }
  }
}
