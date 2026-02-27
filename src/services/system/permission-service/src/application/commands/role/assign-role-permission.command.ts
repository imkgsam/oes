import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class AssignRolePermissionCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly roleId: string

  @IsUUID()
  @IsNotEmpty()
  readonly permissionId: string

  @IsUUID()
  @IsNotEmpty()
  readonly createdBy: string

  constructor(roleId: string, permissionId: string, createdBy: string) {
    this.roleId = roleId
    this.permissionId = permissionId
    this.createdBy = createdBy
  }
}
