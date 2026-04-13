import { ICommand } from '@nestjs/cqrs'
import { Allow, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class RevokeApiKeyCommand implements ICommand {
  @IsUUID()
  readonly apiKeyId: string

  @IsUUID()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(apiKeyId: string, operatorId: string, operatorScope?: OperatorScope) {
    this.apiKeyId = apiKeyId
    this.operatorId = operatorId
    this.operatorScope = operatorScope
  }
}
