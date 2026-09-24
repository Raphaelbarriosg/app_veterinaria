import {
  IsEnum, IsOptional, IsString, IsArray, IsNotEmpty,
} from 'class-validator';
import { ProcedureType } from '@prisma/client';

export class AlarmSignDto {
  @IsString()
  @IsNotEmpty()
  sign!: string;

  @IsString()
  @IsNotEmpty()
  severity!: 'CRITICAL' | 'HIGH' | 'MEDIUM';

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreatePostOpProtocolDto {
  @IsEnum(ProcedureType)
  procedureType!: ProcedureType;

  @IsArray()
  alarmSigns!: AlarmSignDto[];

  @IsArray()
  restrictions!: string[];

  @IsArray()
  specialCare!: string[];

  @IsOptional()
  @IsString()
  emergencyCall?: string;
}
