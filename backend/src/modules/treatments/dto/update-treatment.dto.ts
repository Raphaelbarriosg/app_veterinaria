import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

enum TreatmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateTreatmentDto {
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(TreatmentStatus)
  status?: TreatmentStatus;
}
