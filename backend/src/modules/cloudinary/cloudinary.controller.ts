import {
  Controller, Post, UploadedFile, UseGuards,
  UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { memoryStorage } from 'multer';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * POST /upload/image
   *
   * Recibe una imagen (multipart/form-data) y la sube a Supabase Storage.
   * Retorna la URL pública permanente de la imagen.
   * Solo usuarios autenticados pueden subir imágenes.
   */
  @Post('image')
  @Throttle({ short: { ttl: 5000, limit: 3 }, long: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Subir imagen a Supabase Storage' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // Mantener en memoria para enviarlo a Supabase
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(`Tipo de archivo no permitido. Use: ${ALLOWED_MIME_TYPES.join(', ')}`),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }
    return this.cloudinaryService.uploadImage(file);
  }
}
