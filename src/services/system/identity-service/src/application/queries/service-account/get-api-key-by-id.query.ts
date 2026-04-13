import { IQuery } from '@nestjs/cqrs'
import { Allow, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class GetApiKeyByIdQuery implements IQuery {
  @IsUUID()
  readonly apiKeyId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(apiKeyId: string, operatorScope?: OperatorScope) {
    this.apiKeyId = apiKeyId
    this.operatorScope = operatorScope
  }
}
