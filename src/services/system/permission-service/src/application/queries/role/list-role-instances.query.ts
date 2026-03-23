import { IQuery } from '@nestjs/cqrs'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'
import { OperatorScope } from './operator-scope'

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

  readonly operatorScope?: OperatorScope

  constructor(params: {
    page: number
    pageSize: number
    tenantId?: string
    keyword?: string
    operatorScope?: OperatorScope
  }) {
    this.page = params.page
    this.pageSize = params.pageSize
    this.tenantId = params.tenantId
    this.keyword = params.keyword
    this.operatorScope = params.operatorScope
  }
}
