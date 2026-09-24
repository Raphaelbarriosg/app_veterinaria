import {
  Controller, Get, Post,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

/**
 * Rutas públicas para invitaciones (sin autenticación obligatoria).
 * GET  /invitations/:token          — Consultar detalles de invitación (vista previa pública)
 * POST /invitations/:token/accept   — Aceptar invitación (requiere JWT del usuario invitado)
 */
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  /** Vista previa pública — sin JWT */
  @Get(':token')
  async getInvitation(@Param('token') token: string) {
    return this.clinicsService.getInvitationByToken(token);
  }

  /** Aceptar — sí requiere sesión activa */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':token/accept')
  async acceptInvitation(
    @Param('token') token: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.clinicsService.acceptInvitation(token, req.user.userId);
  }
}
