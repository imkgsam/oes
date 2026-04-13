import { IQuery } from '@nestjs/cqrs'
import { Allow, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { OperatorScope } from '../../authorization/operator-scope'

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
  @IsEnum(ScopeLevel)
  readonly scopeLevel?: ScopeLevel

  @IsOptional()
  @IsString()
  readonly keyword?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(params: {
    page: number
    pageSize: number
    tenantId?: string
    scopeLevel?: ScopeLevel
    keyword?: string
    operatorScope?: OperatorScope
  }) {
    this.page = params.page
    this.pageSize = params.pageSize
    this.tenantId = params.tenantId
    this.scopeLevel = params.scopeLevel
    this.keyword = params.keyword
    this.operatorScope = params.operatorScope
  }
}
