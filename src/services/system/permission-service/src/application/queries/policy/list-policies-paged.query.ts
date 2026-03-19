import { IQuery } from '@nestjs/cqrs'
import { Type } from 'class-transformer'
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class ListPoliciesPagedQuery implements IQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly pageSize: number

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsOptional()
  @IsString()
  readonly permissionCode?: string

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly isEnabled?: boolean

  @IsOptional()
  @IsString()
  readonly keyword?: string

  constructor(input: {
    page: number
    pageSize: number
    tenantId?: string
    permissionCode?: string
    isEnabled?: boolean
    keyword?: string
  }) {
    this.page = input.page
    this.pageSize = input.pageSize
    this.tenantId = input.tenantId
    this.permissionCode = input.permissionCode
    this.isEnabled = input.isEnabled
    this.keyword = input.keyword
  }
}
