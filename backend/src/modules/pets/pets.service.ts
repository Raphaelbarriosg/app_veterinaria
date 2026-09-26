import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
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
      const member = await this.prisma.clinicMember.findUnique({
        where: { clinicId_userId: { clinicId, userId } },
      });
      if (!member) {
        await this.prisma.clinicMember.create({
          data: { clinicId, userId, role: 'OWNER', isActive: true },
        });
      }
      return clinicId;
    }

    // Fallback: primera clínica activa del usuario
    const firstMembership = await this.prisma.clinicMember.findFirst({
      where: { userId, isActive: true },
      orderBy: { joinedAt: 'asc' },
    });

    if (firstMembership) {
      return firstMembership.clinicId;
    }

    // Si el cliente se registró autónomamente, vincular a la clínica activa por defecto
    const defaultClinic = await this.prisma.clinic.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });

    if (defaultClinic) {
      await this.prisma.clinicMember.create({
        data: {
          clinicId: defaultClinic.id,
          userId,
          role: 'OWNER',
          isActive: true,
        },
      });
      return defaultClinic.id;
    }

    throw new BadRequestException('No hay clínicas activas disponibles en el sistema');
  }

  /**
   * Normaliza cualquier entrada de especie (español, inglés, mayúsculas, minúsculas)
   * al enum estándar PetSpecies de Prisma.
   */
  private normalizeSpecies(species?: string): PetSpecies {
    if (!species) return PetSpecies.OTHER;
    const clean = species.trim().toLowerCase();
    const map: Record<string, PetSpecies> = {
      dog: PetSpecies.DOG,
      perro: PetSpecies.DOG,
      canino: PetSpecies.DOG,
      cat: PetSpecies.CAT,
      gato: PetSpecies.CAT,
      felino: PetSpecies.CAT,
      bird: PetSpecies.BIRD,
      ave: PetSpecies.BIRD,
      pajaro: PetSpecies.BIRD,
      pájaro: PetSpecies.BIRD,
      rodent: PetSpecies.RODENT,
      conejo: PetSpecies.RODENT,
      roedor: PetSpecies.RODENT,
      hamster: PetSpecies.RODENT,
      hámster: PetSpecies.RODENT,
      reptile: PetSpecies.REPTILE,
      reptil: PetSpecies.REPTILE,
      other: PetSpecies.OTHER,
      otro: PetSpecies.OTHER,
    };
    if (map[clean]) {
      return map[clean];
    }
    const upper = species.trim().toUpperCase();
    if (Object.values(PetSpecies).includes(upper as PetSpecies)) {
      return upper as PetSpecies;
    }
    return PetSpecies.OTHER;
  }

  async create(ownerId: string, dto: CreatePetDto, clinicId?: string) {
    const resolvedClinicId = await this.resolveClinicId(ownerId, clinicId);

    try {
      return await this.prisma.pet.create({
        data: {
          clinicId: resolvedClinicId,
          ownerId,
          name: dto.name,
          species: this.normalizeSpecies(dto.species),
          breed: dto.breed,
          weight: dto.weight,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Ya tienes una mascota registrada con este nombre');
      }
      throw error;
    }
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

    // Convertir species a enum normalizado si está presente
    if (dto.species) {
      updateData.species = this.normalizeSpecies(dto.species);
    }

    try {
      return await this.prisma.pet.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Ya tienes una mascota registrada con este nombre');
      }
      throw error;
    }
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
