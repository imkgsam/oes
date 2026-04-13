import { IQuery } from '@nestjs/cqrs'
import { Allow, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class GetOrgTreeByTenantIdQuery implements IQuery {
  @IsUUID()
  readonly tenantId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(tenantId: string, operatorScope?: OperatorScope) {
    this.tenantId = tenantId
    this.operatorScope = operatorScope
  }
}
