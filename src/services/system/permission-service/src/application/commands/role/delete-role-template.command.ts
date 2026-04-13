import { ICommand } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class DeleteRoleTemplateCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly id: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(id: string, operatorScope?: OperatorScope) {
    this.id = id
    this.operatorScope = operatorScope
  }
}
