import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class UpdatePetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
