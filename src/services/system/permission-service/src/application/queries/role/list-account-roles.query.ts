import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class ListAccountRolesQuery implements IQuery {
  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string

  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  constructor(accountId: string, tenantId: string) {
    this.accountId = accountId
    this.tenantId = tenantId
  }
}
