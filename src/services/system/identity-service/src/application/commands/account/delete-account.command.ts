import { ICommand } from '@nestjs/cqrs'
import { Allow, IsOptional, IsString, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class DeleteAccountCommand implements ICommand {
  @IsUUID()
  readonly accountId: string

  @IsOptional()
  @IsString()
  readonly operatorId?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(
    accountId: string,
    input: {
      operatorId?: string
      operatorScope?: OperatorScope
    } = {}
  ) {
    this.accountId = accountId
    this.operatorId = input.operatorId
    this.operatorScope = input.operatorScope
  }
}
