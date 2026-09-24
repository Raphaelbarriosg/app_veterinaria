import {
  IsNotEmpty, IsString, IsDateString, IsUUID,
  IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProcedureType } from '@prisma/client';

export class CreateTreatmentRuleDto {
  @IsString()
  @IsNotEmpty()
  medicineName!: string;

  @IsString()
  @IsNotEmpty()
  dosage!: string;

  @IsNotEmpty()
  frequencyHours!: number;

  @IsOptional()
  @IsBoolean()
  requirePhoto?: boolean;
}

export class CreateTreatmentDto {
  @IsUUID()
  petId!: string;

  @IsString()
  @IsNotEmpty()
  diagnosis!: string;

  @IsOptional()
  @IsEnum(ProcedureType)
  procedureType?: ProcedureType;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTreatmentRuleDto)
  rules?: CreateTreatmentRuleDto[];
}

