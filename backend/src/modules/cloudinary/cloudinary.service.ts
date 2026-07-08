import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

export interface UploadImageResponse {
  url: string;
  path: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly bucket: string;

  constructor() {
    this.supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'vet-app-images';
  }

  /**
   * Sube una imagen al bucket de Supabase Storage y retorna la URL pública.
   *
   * Flujo:
   * 1. Cliente (BFF Next.js) envía el archivo al backend via multipart/form-data
   * 2. Backend sube el archivo a Supabase Storage usando la Service Role Key (secreta)
   * 3. Backend retorna la URL pública permanente al cliente
   *
   * La Service Role Key NUNCA sale del servidor.
   */
  async uploadImage(file: Express.Multer.File): Promise<UploadImageResponse> {
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new InternalServerErrorException(
        'Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas',
      );
    }

    // Generar un nombre de archivo único para evitar colisiones
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const storagePath = `daily_logs/${uniqueName}`;

    const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${storagePath}`;

    this.logger.log(`Subiendo imagen a Supabase Storage: ${storagePath}`);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.serviceRoleKey}`,
          'Content-Type': file.mimetype,
          'x-upsert': 'true', // Sobrescribir si ya existe
        },
        body: file.buffer as unknown as BodyInit,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Error Supabase Storage: ${errorText}`);
        throw new InternalServerErrorException(
          `Error al subir imagen a Supabase Storage: ${errorText}`,
        );
      }

      // La URL pública de Supabase Storage para buckets con política pública
      const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${storagePath}`;

      this.logger.log(`Imagen subida exitosamente: ${publicUrl}`);

      return { url: publicUrl, path: storagePath };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error('Error inesperado al subir imagen', error);
      throw new InternalServerErrorException('Error de conexión al subir la imagen');
    }
  }
}
