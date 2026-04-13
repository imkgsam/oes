import { ICommand } from '@nestjs/cqrs'
import { Allow, IsDateString, IsOptional, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class RotateApiKeyCommand implements ICommand {
  @IsUUID()
  readonly apiKeyId: string

  @IsOptional()
  @IsDateString()
  readonly expiresAt?: string

  @IsUUID()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input: {
    apiKeyId: string
    expiresAt?: string
    operatorId: string
    operatorScope?: OperatorScope
  }) {
    this.apiKeyId = input.apiKeyId
    this.expiresAt = input.expiresAt
    this.operatorId = input.operatorId
    this.operatorScope = input.operatorScope
  }
}
