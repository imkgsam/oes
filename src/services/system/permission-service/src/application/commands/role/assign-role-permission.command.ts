import { ICommand } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class AssignRolePermissionCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly roleId: string

  @IsUUID()
  @IsNotEmpty()
  readonly permissionId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(roleId: string, permissionId: string, operatorScope?: OperatorScope) {
    this.roleId = roleId
    this.permissionId = permissionId
    this.operatorScope = operatorScope
  }
}
