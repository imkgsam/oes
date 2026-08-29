import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CheckPermissionQuery implements IQuery {
  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string

  @IsString()
  @IsNotEmpty()
  readonly permissionCode: string

  @IsOptional()
  @IsUUID()
  readonly tenantId?: string

  constructor(accountId: string, permissionCode: string, tenantId?: string) {
    this.accountId = accountId
    this.permissionCode = permissionCode
    this.tenantId = tenantId
  }
}
