import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('cloudinary')
@UseGuards(JwtAuthGuard)
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * GET /cloudinary/signature?folder=vet_app/daily_logs
   *
   * Retorna los parámetros necesarios para que Flutter suba
   * una imagen directamente a Cloudinary con Signed Upload.
   * Solo usuarios autenticados pueden obtener firmas.
   */
  @Get('signature')
  getSignature(@Query('folder') folder?: string) {
    return this.cloudinaryService.generateSignature(folder);
  }
}
