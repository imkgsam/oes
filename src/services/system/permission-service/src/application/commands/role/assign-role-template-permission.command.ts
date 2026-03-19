import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class AssignRoleTemplatePermissionCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly roleTemplateId: string

  @IsUUID()
  @IsNotEmpty()
  readonly permissionId: string

  constructor(roleTemplateId: string, permissionId: string) {
    this.roleTemplateId = roleTemplateId
    this.permissionId = permissionId
  }
}
