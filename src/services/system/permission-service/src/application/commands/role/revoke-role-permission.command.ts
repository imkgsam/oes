import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class RevokeRolePermissionCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly roleId: string

  @IsUUID()
  @IsNotEmpty()
  readonly permissionId: string

  constructor(roleId: string, permissionId: string) {
    this.roleId = roleId
    this.permissionId = permissionId
  }
}
