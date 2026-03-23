import { IQuery } from '@nestjs/cqrs'
import { IsUUID } from 'class-validator'

export class GetTenantByIdQuery implements IQuery {
  @IsUUID()
  readonly tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }
}
