import {
  IsNotEmpty, IsString, IsDateString, IsUUID,
  IsOptional, IsEnum, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  requirePhoto?: boolean;
}

export class CreateTreatmentDto {
  @IsUUID()
  petId!: string;

  @IsString()
  @IsNotEmpty()
  diagnosis!: string;

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
