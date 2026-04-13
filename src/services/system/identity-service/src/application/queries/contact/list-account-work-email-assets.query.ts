import { IQuery } from '@nestjs/cqrs'
import { Allow, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class ListAccountWorkEmailAssetsQuery implements IQuery {
  @IsUUID()
  readonly accountId: string
  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(accountId: string, operatorScope?: OperatorScope) {
    this.accountId = accountId
    this.operatorScope = operatorScope
  }
}
