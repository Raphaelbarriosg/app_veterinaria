import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuditService, AuditAction } from '../../common/services/audit.service';

@Controller('pets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PetsController {
  constructor(
    private readonly petsService: PetsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles(Role.OWNER)
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreatePetDto,
  ) {
    const result = await this.petsService.create(req.user.userId, dto);
    this.auditService.logAsync({
      action: AuditAction.PET_CREATED,
      userId: req.user.userId,
      resourceType: 'pet',
      resourceId: result.id,
      details: { name: dto.name, species: dto.species },
    });
    return result;
  }

  @Get()
  @Roles(Role.OWNER)
  async findAll(@Request() req: { user: { userId: string } }) {
    return this.petsService.findAllByOwner(req.user.userId);
  }

  @Get('search')
  @Roles(Role.VET)
  async search(@Query('q') query: string) {
    return this.petsService.searchByName(query || '');
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.petsService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  @Roles(Role.OWNER)
  async update(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdatePetDto,
  ) {
    return this.petsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  async delete(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.petsService.delete(id, req.user.userId);
  }
}