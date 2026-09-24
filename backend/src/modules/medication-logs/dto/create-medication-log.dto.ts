import {
  IsUUID, IsEnum, IsOptional, IsString, IsDateString,
} from 'class-validator';
import { MedicationLogStatus } from '@prisma/client';

export class CreateMedicationLogDto {
  @IsUUID()
  treatmentId!: string;

  @IsUUID()
  ruleId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsDateString()
  givenAt?: string;

  @IsOptional()
  @IsEnum(MedicationLogStatus)
  status?: MedicationLogStatus;

  @IsOptional()
  @IsString()
  skippedReason?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
