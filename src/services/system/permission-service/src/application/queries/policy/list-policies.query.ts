import { IQuery } from '@nestjs/cqrs'
import { IsOptional, IsString } from 'class-validator'

export class ListPoliciesQuery implements IQuery {
  @IsOptional()
  @IsString()
  readonly tenantId?: string

  constructor(tenantId?: string) {
    this.tenantId = tenantId
  }
}
