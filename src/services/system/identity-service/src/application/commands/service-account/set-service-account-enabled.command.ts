import { ICommand } from '@nestjs/cqrs'
import { Allow, IsBoolean, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class SetServiceAccountEnabledCommand implements ICommand {
  @IsUUID()
  readonly serviceAccountId: string

  @IsBoolean()
  readonly enabled: boolean

  @IsUUID()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(
    serviceAccountId: string,
    enabled: boolean,
    operatorId: string,
    operatorScope?: OperatorScope
  ) {
    this.serviceAccountId = serviceAccountId
    this.enabled = enabled
    this.operatorId = operatorId
    this.operatorScope = operatorScope
  }
}
