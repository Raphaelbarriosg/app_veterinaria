import {
  Controller, Post, Get, Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { PostOpProtocolsService } from './post-op-protocols.service';
import { CreatePostOpProtocolDto } from './dto/post-op-protocol.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('post-op-protocols')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostOpProtocolsController {
  constructor(private readonly protocolsService: PostOpProtocolsService) {}

  /** POST /post-op-protocols/treatment/:treatmentId — VET define el protocolo */
  @Post('treatment/:treatmentId')
  @Roles(Role.VET, Role.CLINIC_ADMIN)
  async createOrUpdate(
    @Param('treatmentId') treatmentId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: CreatePostOpProtocolDto,
  ) {
    return this.protocolsService.createOrUpdate(req.user.userId, treatmentId, dto);
  }

  /** GET /post-op-protocols/treatment/:treatmentId — Consultar protocolo */
  @Get('treatment/:treatmentId')
  async findByTreatment(@Param('treatmentId') treatmentId: string) {
    return this.protocolsService.findByTreatment(treatmentId);
  }
}
