import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuditService, AuditAction } from '../../common/services/audit.service';

@Controller('treatments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentsController {
  constructor(
    private readonly treatmentsService: TreatmentsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles(Role.VET)
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateTreatmentDto,
  ) {
    const result = await this.treatmentsService.create(req.user.userId, dto);
    this.auditService.logAsync({
      action: AuditAction.TREATMENT_CREATED,
      userId: req.user.userId,
      resourceType: 'treatment',
      resourceId: result.id,
      details: { petId: dto.petId, diagnosis: dto.diagnosis },
    });
    return result;
  }

  @Get('dashboard')
  @Roles(Role.VET)
  async getDashboard(@Request() req: { user: { userId: string } }) {
    return this.treatmentsService.getDashboard(req.user.userId);
  }

  @Get('history')
  @Roles(Role.VET, Role.CLINIC_ADMIN)
  async getHistory(
    @Request() req: { user: { userId: string } },
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.treatmentsService.getHistory(req.user.userId, { q, status, page, limit });
  }

  @Get('by-vet')
  @Roles(Role.VET)
  async findAllByVet(
    @Request() req: { user: { userId: string } },
    @Query('status') status?: string,
  ) {
    return this.treatmentsService.findAllByVet(req.user.userId, status);
  }

  @Get('by-pet/:petId')
  async findAllByPet(
    @Param('petId') petId: string,
    @Request() req: { user: { userId: string; role: string } },
    @Query('status') status?: string,
  ) {
    return this.treatmentsService.findAllByPet(petId, req.user.userId, req.user.role, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.treatmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.VET)
  async update(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateTreatmentDto,
  ) {
    const result = await this.treatmentsService.update(id, req.user.userId, dto);
    const action = dto.status === 'COMPLETED'
      ? AuditAction.TREATMENT_COMPLETED
      : AuditAction.TREATMENT_UPDATED;
    this.auditService.logAsync({
      action,
      userId: req.user.userId,
      resourceType: 'treatment',
      resourceId: id,
      details: { status: dto.status },
    });
    return result;
  }
}