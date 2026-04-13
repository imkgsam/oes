import { ICommand } from '@nestjs/cqrs'
import { Allow, IsBoolean, IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class SetRoleEnabledCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly id: string

  @IsBoolean()
  readonly isEnabled: boolean

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(id: string, isEnabled: boolean, operatorScope?: OperatorScope) {
    this.id = id
    this.isEnabled = isEnabled
    this.operatorScope = operatorScope
  }
}
