import {
  IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min,
} from 'class-validator';

export class CreateDailyLogDto {
  @IsUUID()
  treatmentId!: string;

  @IsBoolean()
  medicineTaken!: boolean;

  @IsInt()
  @Min(1)
  @Max(5)
  appetiteLevel!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  energyLevel!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
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
}

