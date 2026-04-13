import { ICommand } from '@nestjs/cqrs'
import { Allow, IsDateString, IsOptional, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class CreateApiKeyCommand implements ICommand {
  @IsUUID()
  readonly serviceAccountId: string

  @IsOptional()
  @IsDateString()
  readonly expiresAt?: string

  @IsUUID()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input: {
    serviceAccountId: string
    expiresAt?: string
    operatorId: string
    operatorScope?: OperatorScope
  }) {
    this.serviceAccountId = input.serviceAccountId
    this.expiresAt = input.expiresAt
    this.operatorId = input.operatorId
    this.operatorScope = input.operatorScope
  }
}
