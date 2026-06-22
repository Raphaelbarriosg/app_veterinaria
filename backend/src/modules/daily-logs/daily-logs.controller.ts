import {
  Controller, Get, Post,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { DailyLogsService } from './daily-logs.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('daily-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailyLogsController {
  constructor(private readonly dailyLogsService: DailyLogsService) {}

  @Post()
  @Roles(Role.OWNER)
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateDailyLogDto,
  ) {
    return this.dailyLogsService.create(req.user.userId, dto);
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
}
