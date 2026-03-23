import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from './operator-scope'

export class GetRoleTemplateByIdQuery implements IQuery {
  @IsUUID()
  @IsNotEmpty()
  readonly id: string

  readonly operatorScope?: OperatorScope

  constructor(id: string, operatorScope?: OperatorScope) {
    this.id = id
    this.operatorScope = operatorScope
  }
}
