import {
  IsEnum, IsOptional, IsString, IsDateString, IsUUID,
} from 'class-validator';
import { ControlVisitType } from '@prisma/client';

export class CreateControlVisitDto {
  @IsEnum(ControlVisitType)
  type!: ControlVisitType;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsUUID()
  vetId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteControlVisitDto {
  @IsOptional()
  @IsString()
  clinicalFindings?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
