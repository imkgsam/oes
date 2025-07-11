import { IsUUID } from 'class-validator'

export class AssignUserRoleDto {
  @IsUUID()
  userId: string

  @IsUUID()
  roleId: string
}
