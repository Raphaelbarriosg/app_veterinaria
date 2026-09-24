import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('device-token')
  @ApiOperation({ summary: 'Registrar token de dispositivo para notificaciones push' })
  @ApiResponse({ status: 201, description: 'Token registrado correctamente' })
  async registerToken(
    @Request() req: { user: { userId: string } },
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.notificationsService.registerToken(req.user.userId, dto);
  }

  @Delete('device-token/:token')
  @ApiOperation({ summary: 'Revocar token de dispositivo (ej. al cerrar sesión)' })
  @ApiResponse({ status: 200, description: 'Token revocado' })
  async removeToken(
    @Request() req: { user: { userId: string } },
    @Param('token') token: string,
  ) {
    return this.notificationsService.removeToken(req.user.userId, token);
  }

  @Get('device-tokens')
  @ApiOperation({ summary: 'Obtener tokens de dispositivos activos del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de tokens activos' })
  async getTokens(@Request() req: { user: { userId: string } }) {
    return this.notificationsService.getUserTokens(req.user.userId);
  }

  @Post('test')
  @ApiOperation({ summary: 'Enviar una notificación push de prueba al usuario actual' })
  @ApiResponse({ status: 200, description: 'Notificación de prueba despachada' })
  async sendTestPush(
    @Request() req: { user: { userId: string } },
    @Body() body: { title?: string; body?: string },
  ) {
    return this.notificationsService.sendToUser(req.user.userId, {
      title: body.title || '🔔 Notificación de Prueba — VetCare',
      body: body.body || 'Tu dispositivo está correctamente configurado para recibir alertas.',
      data: { type: 'TEST_PUSH' },
    });
  }
}
