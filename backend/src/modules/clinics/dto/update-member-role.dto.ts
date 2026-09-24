import { IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class UpdateMemberRoleDto {
  @IsEnum(Role, { message: 'El rol debe ser un rol válido (CLINIC_ADMIN, VET, OWNER)' })
  role!: Role;
}
