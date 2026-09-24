import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostOpProtocolDto } from './dto/post-op-protocol.dto';

@Injectable()
export class PostOpProtocolsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdate(vetId: string, treatmentId: string, dto: CreatePostOpProtocolDto) {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId },
    });
    if (!treatment) throw new NotFoundException('Tratamiento no encontrado');
    if (treatment.vetId !== vetId) {
      throw new ForbiddenException('Solo el veterinario asignado puede definir el protocolo');
    }

    // Convert arrays/objects to JSON compatible formats
    const alarmSignsJson = JSON.parse(JSON.stringify(dto.alarmSigns));
    const restrictionsJson = JSON.parse(JSON.stringify(dto.restrictions));
    const specialCareJson = JSON.parse(JSON.stringify(dto.specialCare));

    return this.prisma.postOpProtocol.upsert({
      where: { treatmentId },
      update: {
        procedureType: dto.procedureType,
        alarmSigns: alarmSignsJson,
        restrictions: restrictionsJson,
        specialCare: specialCareJson,
        emergencyCall: dto.emergencyCall,
      },
      create: {
        treatmentId,
        createdById: vetId,
        procedureType: dto.procedureType,
        alarmSigns: alarmSignsJson,
        restrictions: restrictionsJson,
        specialCare: specialCareJson,
        emergencyCall: dto.emergencyCall,
      },
    });
  }

  async findByTreatment(treatmentId: string) {
    const protocol = await this.prisma.postOpProtocol.findUnique({
      where: { treatmentId },
    });
    if (!protocol) throw new NotFoundException('Protocolo no definido aún para este tratamiento');
    return protocol;
  }
}
