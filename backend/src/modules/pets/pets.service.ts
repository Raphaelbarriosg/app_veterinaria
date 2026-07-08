import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetSpecies } from '@prisma/client';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolver clinicId: si se provee usarlo, si no, usar la primera clínica del usuario
   */
  private async resolveClinicId(userId: string, clinicId?: string): Promise<string> {
    if (clinicId) {
      // Verificar que el usuario es miembro de la clínica
      const member = await this.prisma.clinicMember.findUnique({
        where: { clinicId_userId: { clinicId, userId } },
      });
      if (!member || !member.isActive) {
        throw new ForbiddenException('No eres miembro de esta clínica');
      }
      return clinicId;
    }

    // Fallback: primera clínica del usuario
    const firstMembership = await this.prisma.clinicMember.findFirst({
      where: { userId, isActive: true },
      orderBy: { joinedAt: 'asc' },
    });

    if (!firstMembership) {
      throw new BadRequestException('El usuario no pertenece a ninguna clínica');
    }

    return firstMembership.clinicId;
  }

  async create(ownerId: string, dto: CreatePetDto, clinicId?: string) {
    const resolvedClinicId = await this.resolveClinicId(ownerId, clinicId);

    return this.prisma.pet.create({
      data: {
        clinicId: resolvedClinicId,
        ownerId,
        name: dto.name,
        species: dto.species as PetSpecies,
        breed: dto.breed,
        weight: dto.weight,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
  }

  async findAllByOwner(ownerId: string) {
    return this.prisma.pet.findMany({
      where: { ownerId },
      include: {
        treatments: {
          where: { status: 'ACTIVE' },
          select: { id: true, diagnosis: true, status: true, startDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        treatments: {
          include: {
            rules: true,
            dailyLogs: { orderBy: { registeredAt: 'desc' }, take: 5 },
          },
        },
      },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    // Los dueños solo pueden ver sus propias mascotas
    if (userRole === 'OWNER' && pet.ownerId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta mascota');
    }

    return pet;
  }

  async update(id: string, ownerId: string, dto: UpdatePetDto) {
    const pet = await this.prisma.pet.findUnique({ where: { id } });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (pet.ownerId !== ownerId) {
      throw new ForbiddenException('Solo el dueño puede editar su mascota');
    }

    const updateData: any = {
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
    };

    // Convertir species a enum si está presente
    if (dto.species) {
      updateData.species = dto.species as PetSpecies;
    }

    return this.prisma.pet.update({
      where: { id },
      data: updateData,
    });
  }

  async searchByName(query: string) {
    return this.prisma.pet.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      include: {
        owner: { select: { id: true, name: true, phone: true } },
      },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }

  async delete(id: string, ownerId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id } });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    if (pet.ownerId !== ownerId) {
      throw new ForbiddenException('Solo el dueño puede eliminar su mascota');
    }

    await this.prisma.pet.delete({ where: { id } });
    return { message: 'Mascota eliminada correctamente' };
  }
}
