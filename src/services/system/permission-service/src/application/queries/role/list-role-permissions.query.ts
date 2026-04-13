import { IQuery } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class ListRolePermissionsQuery implements IQuery {
  @IsUUID('4', { message: 'Invalid role ID format' })
  @IsNotEmpty({ message: 'Role ID is required' })
  readonly roleId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(roleId: string, operatorScope?: OperatorScope) {
    this.roleId = roleId
    this.operatorScope = operatorScope
  }
}
