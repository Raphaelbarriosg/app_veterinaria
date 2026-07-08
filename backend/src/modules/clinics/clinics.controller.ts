import {
  Controller, Get, Post, Patch,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuditService, AuditAction } from '../../common/services/audit.service';

@Controller('clinics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicsController {
  constructor(
    private readonly clinicsService: ClinicsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateClinicDto,
  ) {
    const result = await this.clinicsService.create(req.user.userId, dto);
    this.auditService.logAsync({
      action: AuditAction.CLINIC_CREATED,
      userId: req.user.userId,
      resourceType: 'clinic',
      resourceId: result.id,
      details: { name: dto.name, slug: dto.slug },
    });
    return result;
  }

  @Get()
  async getUserClinics(@Request() req: { user: { userId: string } }) {
    return this.clinicsService.getUserClinics(req.user.userId);
  }

  @Get(':clinicId')
  async findOne(
    @Param('clinicId') clinicId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.clinicsService.findOne(clinicId, req.user.userId);
  }

  @Patch(':clinicId')
  async update(
    @Param('clinicId') clinicId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateClinicDto,
  ) {
    return this.clinicsService.update(clinicId, req.user.userId, dto);
  }

  // ── Miembros ──

  @Get(':clinicId/members')
  async getMembers(
    @Param('clinicId') clinicId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.clinicsService.getMembers(clinicId, req.user.userId);
  }

  @Post(':clinicId/members/invite')
  async inviteMember(
    @Param('clinicId') clinicId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: InviteMemberDto,
  ) {
    return this.clinicsService.inviteMember(clinicId, req.user.userId, dto);
  }

  @Post('invitations/:token/accept')
  async acceptInvitation(
    @Param('token') token: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.clinicsService.acceptInvitation(token, req.user.userId);
  }

  @Patch(':clinicId/members/:memberUserId/remove')
  async removeMember(
    @Param('clinicId') clinicId: string,
    @Param('memberUserId') memberUserId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.clinicsService.removeMember(clinicId, req.user.userId, memberUserId);
  }
}