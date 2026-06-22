import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface CloudinarySignatureResponse {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

@Injectable()
export class CloudinaryService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = process.env.CLOUDINARY_API_KEY || '';
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  }

  /**
   * Genera los parámetros de firma para un "Signed Upload" de Cloudinary.
   *
   * Flujo:
   * 1. Flutter solicita firma → Backend genera timestamp + signature
   * 2. Flutter sube imagen directo a Cloudinary con estos parámetros
   * 3. Cloudinary retorna URL → Flutter la envía al Backend para almacenar
   *
   * La API Secret NUNCA sale del servidor.
   */
  generateSignature(folder = 'vet_app/daily_logs'): CloudinarySignatureResponse {
    const timestamp = Math.round(Date.now() / 1000);

    // String-to-sign: parámetros en orden alfabético + API secret
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${this.apiSecret}`;

    // SHA-1 del string
    const signature = createHash('sha1').update(stringToSign).digest('hex');

    return {
      timestamp,
      signature,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
      folder,
    };
  }
}
