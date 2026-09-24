import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmergencyService, CreateEmergencyDto } from './emergency.service';

@ApiTags('Emergency')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @ApiOperation({ summary: 'Reportar un caso de emergencia para una mascota' })
  @Post('report')
  async reportEmergency(@Request() req: any, @Body() dto: CreateEmergencyDto) {
    return this.emergencyService.reportEmergency(req.user.id, dto);
  }
}
