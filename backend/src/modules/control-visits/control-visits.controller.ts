import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ControlVisitsService } from './control-visits.service';
import { CreateControlVisitDto, CompleteControlVisitDto } from './dto/control-visit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('control-visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ControlVisitsController {
  constructor(private readonly controlVisitsService: ControlVisitsService) {}

  /** POST /control-visits/treatment/:treatmentId — VET agenda una cita */
  @Post('treatment/:treatmentId')
  @Roles(Role.VET, Role.CLINIC_ADMIN)
  async create(
    @Param('treatmentId') treatmentId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateControlVisitDto,
  ) {
    return this.controlVisitsService.create(req.user.userId, treatmentId, dto);
  }

  /** GET /control-visits/treatment/:treatmentId — Ver citas de un tratamiento */
  @Get('treatment/:treatmentId')
  async findByTreatment(@Param('treatmentId') treatmentId: string) {
    return this.controlVisitsService.findByTreatment(treatmentId);
  }

  /** PATCH /control-visits/:id/complete — Marcar cita como completada */
  @Patch(':id/complete')
  @Roles(Role.VET, Role.CLINIC_ADMIN)
  async complete(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: CompleteControlVisitDto,
  ) {
    return this.controlVisitsService.complete(id, req.user.userId, dto);
  }

  /** DELETE /control-visits/:id — Cancelar cita */
  @Delete(':id')
  @Roles(Role.VET, Role.CLINIC_ADMIN)
  async cancel(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.controlVisitsService.cancel(id, req.user.userId);
  }
}
