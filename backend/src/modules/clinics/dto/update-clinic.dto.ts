import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ClinicStatus } from '../../../common/enums/clinic-status.enum';

export class UpdateClinicDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(ClinicStatus)
  status?: ClinicStatus;

  @IsOptional()
  settings?: Record<string, any>;
}