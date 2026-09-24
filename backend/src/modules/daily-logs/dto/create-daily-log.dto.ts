import {
  IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min, IsEnum,
} from 'class-validator';
import { DailyLogType } from '@prisma/client';

export class CreateDailyLogDto {
  @IsUUID()
  treatmentId!: string;

  @IsOptional()
  @IsBoolean()
  medicineTaken?: boolean;

  @IsInt()
  @Min(0)
  @Max(10)
  appetiteLevel!: number;

  @IsInt()
  @Min(0)
  @Max(10)
  energyLevel!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  painLevel?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsString()
  alarmSigns?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(DailyLogType)
  logType?: DailyLogType;
}

