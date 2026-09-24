import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'Token de registro para notificaciones push (FCM / APNs)',
    example: 'fcm_d1a2b3c4d5e6f7g8h9i0...',
  })
  @IsString()
  @IsNotEmpty({ message: 'El token del dispositivo es obligatorio' })
  token: string;

  @ApiProperty({
    description: 'Plataforma del cliente',
    enum: ['android', 'ios', 'web'],
    example: 'android',
  })
  @IsString()
  @IsIn(['android', 'ios', 'web'], {
    message: 'La plataforma debe ser android, ios o web',
  })
  platform: 'android' | 'ios' | 'web';
}
