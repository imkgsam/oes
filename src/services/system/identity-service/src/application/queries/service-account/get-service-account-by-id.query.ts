import { IQuery } from '@nestjs/cqrs'
import { Allow, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class GetServiceAccountByIdQuery implements IQuery {
  @IsUUID()
  readonly serviceAccountId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(serviceAccountId: string, operatorScope?: OperatorScope) {
    this.serviceAccountId = serviceAccountId
    this.operatorScope = operatorScope
  }
}
