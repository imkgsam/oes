import { IsUUID } from 'class-validator'

export class AssignRolePermissionDto {
  @IsUUID()
  roleId: string

  @IsUUID()
  permissionId: string
}
