import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ListPoliciesByPermissionQuery implements IQuery {
  @IsString()
  @IsNotEmpty()
  readonly permissionCode: string

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  constructor(permissionCode: string, tenantId?: string) {
    this.permissionCode = permissionCode
    this.tenantId = tenantId
  }
}
