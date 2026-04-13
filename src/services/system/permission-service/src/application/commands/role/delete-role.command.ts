import { ICommand } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class DeleteRoleCommand implements ICommand {
  @IsUUID('4', { message: 'Invalid role ID format' })
  @IsNotEmpty({ message: 'Role ID is required' })
  readonly id: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(id: string, operatorScope?: OperatorScope) {
    this.id = id
    this.operatorScope = operatorScope
  }
}
