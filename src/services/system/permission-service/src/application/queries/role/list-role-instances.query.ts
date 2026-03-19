import { IQuery } from '@nestjs/cqrs'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class ListRoleInstancesQuery implements IQuery {
  @IsInt()
  @Min(1)
  readonly page: number

  @IsInt()
  @Min(1)
  readonly pageSize: number

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsOptional()
  @IsString()
  readonly keyword?: string

  constructor(params: { page: number; pageSize: number; tenantId?: string; keyword?: string }) {
    this.page = params.page
    this.pageSize = params.pageSize
    this.tenantId = params.tenantId
    this.keyword = params.keyword
  }
}
