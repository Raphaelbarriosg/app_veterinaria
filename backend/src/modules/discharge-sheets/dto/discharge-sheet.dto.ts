import {
  IsString, IsNotEmpty, IsOptional, IsArray,
} from 'class-validator';

export class DischargeMedicationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  dosage!: string;

  @IsString()
  @IsNotEmpty()
  schedule!: string;

  @IsString()
  @IsNotEmpty()
  duration!: string;
}

export class CreateDischargeSheetDto {
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @IsOptional()
  @IsString()
  nextSteps?: string;

  @IsOptional()
  @IsString()
  returnSigns?: string;

  @IsOptional()
  @IsString()
  restrictions?: string;

  @IsOptional()
  @IsArray()
  medications?: DischargeMedicationDto[];

  @IsOptional()
  @IsString()
  feedingNotes?: string;
}
