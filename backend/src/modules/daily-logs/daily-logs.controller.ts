import {
  Controller, Get, Post, Patch,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { DailyLogsService } from './daily-logs.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuditService, AuditAction } from '../../common/services/audit.service';

@Controller('daily-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyLogsController {
  constructor(
    private readonly dailyLogsService: DailyLogsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles(Role.OWNER, Role.VET, Role.CLINIC_ADMIN)
  async create(
    @Request() req: { user: { userId: string; role: string } },
    @Body() dto: CreateDailyLogDto,
  ) {
    const result = await this.dailyLogsService.create(req.user.userId, req.user.role, dto);

    // Audit log creation
    this.auditService.logAsync({
      action: AuditAction.DAILY_LOG_CREATED,
      userId: req.user.userId,
      resourceType: 'dailyLog',
      resourceId: result.id,
      details: { treatmentId: dto.treatmentId, medicineTaken: dto.medicineTaken, logType: result.logType },
    });

    // Alert if alarm signs present
    if (dto.alarmSigns && dto.alarmSigns.trim() !== '') {
      this.auditService.logAsync({
        action: AuditAction.DAILY_LOG_ALARM,
        userId: req.user.userId,
        resourceType: 'dailyLog',
        resourceId: result.id,
        details: { treatmentId: dto.treatmentId, alarmSigns: dto.alarmSigns },
      });
    }

    return result;
  }

  @Get('treatment/:treatmentId')
  async findByTreatment(
    @Param('treatmentId') treatmentId: string,
    @Request() req: { user: { userId: string; role: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dailyLogsService.findByTreatment(
      treatmentId,
      req.user.userId,
      req.user.role,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; role: string } },
    @Body() dto: CreateDailyLogDto,
  ) {
    const result = await this.dailyLogsService.update(id, req.user.userId, req.user.role, dto);
    this.auditService.logAsync({
      action: AuditAction.DAILY_LOG_UPDATED,
      userId: req.user.userId,
      resourceType: 'dailyLog',
      resourceId: id,
      details: { treatmentId: dto.treatmentId },
    });
    return result;
  }

  @Patch(':id/vet-notes')
  @Roles(Role.VET, Role.CLINIC_ADMIN)
  async updateVetNotes(
    @Param('id') id: string,
    @Body('vetNotes') vetNotes: string,
  ) {
    return this.dailyLogsService.updateVetNotes(id, vetNotes);
  }
}