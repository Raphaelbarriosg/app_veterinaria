import { Injectable, BadRequestException, InternalServerErrorException, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucketName: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados.');
    }

    this.supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseKey || '');
    this.bucketName = process.env.SUPABASE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'vet-uploads';
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  async ensureBucketExists() {
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      if (error) {
        this.logger.error(`Error al listar buckets de Supabase: ${error.message}`);
        return;
      }
      const exists = buckets?.some((b) => b.name === this.bucketName);
      if (!exists) {
        this.logger.log(`Creando bucket '${this.bucketName}' público en Supabase...`);
        const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
        });
        if (createError) {
          this.logger.error(`Error creando bucket '${this.bucketName}': ${createError.message}`);
        } else {
          this.logger.log(`Bucket '${this.bucketName}' creado exitosamente con acceso público.`);
        }
      } else {
        this.logger.log(`Bucket '${this.bucketName}' verificado correctamente en Supabase.`);
      }
    } catch (err) {
      this.logger.error('Excepción al verificar/crear bucket de Supabase:', err);
    }
  }

  async uploadImage(file: Express.Multer.File, folder = 'daily-logs'): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido. Solo JPG, PNG y WEBP.');
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo excede el tamaño máximo (10 MB)');
    }

    const ext = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      console.error('[UploadService] Error:', error);
      throw new InternalServerErrorException('Error al subir la imagen');
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl };
  }
}
