import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from './operator-scope'

export class GetRoleByIdQuery implements IQuery {
  @IsUUID('4', { message: 'Invalid role ID format' })
  @IsNotEmpty({ message: 'Role ID is required' })
  readonly id: string

  readonly operatorScope?: OperatorScope

  constructor(id: string, operatorScope?: OperatorScope) {
    this.id = id
    this.operatorScope = operatorScope
  }
}
