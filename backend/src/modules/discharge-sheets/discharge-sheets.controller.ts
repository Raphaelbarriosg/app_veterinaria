import {
  Controller, Post, Get, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { DischargeSheetsService } from './discharge-sheets.service';
import { CreateDischargeSheetDto } from './dto/discharge-sheet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('discharge-sheets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DischargeSheetsController {
  constructor(private readonly dischargeSheetsService: DischargeSheetsService) {}

  /** POST /discharge-sheets/treatment/:treatmentId — VET genera o actualiza la hoja de alta */
  @Post('treatment/:treatmentId')
  @Roles(Role.VET, Role.CLINIC_ADMIN)
  async createOrUpdate(
    @Param('treatmentId') treatmentId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateDischargeSheetDto,
  ) {
    return this.dischargeSheetsService.createOrUpdate(req.user.userId, treatmentId, dto);
  }

  /** GET /discharge-sheets/treatment/:treatmentId — Ver hoja de alta */
  @Get('treatment/:treatmentId')
  async findByTreatment(@Param('treatmentId') treatmentId: string) {
    return this.dischargeSheetsService.findByTreatment(treatmentId);
  }
}
