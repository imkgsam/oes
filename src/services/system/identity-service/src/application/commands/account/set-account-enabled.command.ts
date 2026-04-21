import { ICommand } from '@nestjs/cqrs'
import { Allow, IsBoolean, IsString } from 'class-validator'
import { OperatorScope } from '../../authorization'

// Carries one admin-driven account enabled-state mutation through the identity write path.
export class SetAccountEnabledCommand implements ICommand {
  @IsString()
  readonly accountId: string

  @IsBoolean()
  readonly isEnabled: boolean

  @IsString()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(
    accountId: string,
    isEnabled: boolean,
    operatorId: string,
    operatorScope?: OperatorScope
  ) {
    this.accountId = accountId
    this.isEnabled = isEnabled
    this.operatorId = operatorId
    this.operatorScope = operatorScope
  }
}
