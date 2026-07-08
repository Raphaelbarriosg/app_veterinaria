import { IsEmail, IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(Role, { message: 'El rol debe ser VET o CLINIC_ADMIN' })
  role!: Role;
}