import { ICommand } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class RevokeRoleTemplatePermissionCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly roleTemplateId: string

  @IsUUID()
  @IsNotEmpty()
  readonly permissionId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(roleTemplateId: string, permissionId: string, operatorScope?: OperatorScope) {
    this.roleTemplateId = roleTemplateId
    this.permissionId = permissionId
    this.operatorScope = operatorScope
  }
}
