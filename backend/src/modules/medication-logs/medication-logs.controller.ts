import {
  Controller, Post, Get, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { MedicationLogsService } from './medication-logs.service';
import { CreateMedicationLogDto } from './dto/create-medication-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('medication-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicationLogsController {
  constructor(private readonly medicationLogsService: MedicationLogsService) {}

  /**
   * POST /medication-logs
   * El OWNER registra que dio la medicina (o que la omitió).
   * El VET también puede registrar dosis clínicas.
   */
  @Post()
  @Roles(Role.OWNER, Role.VET)
  async upsertLog(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateMedicationLogDto,
  ) {
    return this.medicationLogsService.upsertLog(req.user.userId, dto);
  }

  /**
   * GET /medication-logs/treatment/:treatmentId
   * Ver el historial de dosis y el resumen de cumplimiento.
   */
  @Get('treatment/:treatmentId')
  async findByTreatment(
    @Param('treatmentId') treatmentId: string,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.medicationLogsService.findByTreatment(
      treatmentId,
      req.user.userId,
      req.user.role,
    );
  }
}
