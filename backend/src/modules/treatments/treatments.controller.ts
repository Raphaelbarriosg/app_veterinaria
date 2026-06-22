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

@Controller('treatments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentsController {
  constructor(private readonly treatmentsService: TreatmentsService) {}

  @Post()
  @Roles(Role.VET)
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateTreatmentDto,
  ) {
    return this.treatmentsService.create(req.user.userId, dto);
  }

  @Get('dashboard')
  @Roles(Role.VET)
  async getDashboard(@Request() req: { user: { userId: string } }) {
    return this.treatmentsService.getDashboard(req.user.userId);
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
  ) {
    return this.treatmentsService.findAllByPet(petId, req.user.userId, req.user.role);
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
    return this.treatmentsService.update(id, req.user.userId, dto);
  }
}
