import { IQuery } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class ListRoleTemplatePermissionsQuery implements IQuery {
  @IsUUID()
  @IsNotEmpty()
  readonly roleTemplateId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(roleTemplateId: string, operatorScope?: OperatorScope) {
    this.roleTemplateId = roleTemplateId
    this.operatorScope = operatorScope
  }
}
