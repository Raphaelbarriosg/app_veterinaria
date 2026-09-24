import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDischargeSheetDto } from './dto/discharge-sheet.dto';

@Injectable()
export class DischargeSheetsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdate(vetId: string, treatmentId: string, dto: CreateDischargeSheetDto) {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id: treatmentId },
    });
    if (!treatment) throw new NotFoundException('Tratamiento no encontrado');
    if (treatment.vetId !== vetId) {
      throw new ForbiddenException('Solo el veterinario asignado puede generar la hoja de alta');
    }

    const medicationsJson = dto.medications ? JSON.parse(JSON.stringify(dto.medications)) : undefined;

    return this.prisma.dischargeSheet.upsert({
      where: { treatmentId },
      update: {
        summary: dto.summary,
        nextSteps: dto.nextSteps,
        returnSigns: dto.returnSigns,
        restrictions: dto.restrictions,
        medications: medicationsJson,
        feedingNotes: dto.feedingNotes,
      },
      create: {
        treatmentId,
        createdById: vetId,
        summary: dto.summary,
        nextSteps: dto.nextSteps,
        returnSigns: dto.returnSigns,
        restrictions: dto.restrictions,
        medications: medicationsJson,
        feedingNotes: dto.feedingNotes,
      },
    });
  }

  async findByTreatment(treatmentId: string) {
    const sheet = await this.prisma.dischargeSheet.findUnique({
      where: { treatmentId },
    });
    if (!sheet) throw new NotFoundException('Hoja de alta no generada aún para este tratamiento');
    return sheet;
  }
}
