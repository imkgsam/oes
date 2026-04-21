import { IQuery } from '@nestjs/cqrs'
import { Allow, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class ListTenantsQuery implements IQuery {
  @IsOptional()
  @IsString()
  readonly keyword?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  readonly pageSize?: number

  @IsOptional()
  @IsBoolean()
  readonly activeOnly?: boolean

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input?: {
    keyword?: string
    pageSize?: number
    activeOnly?: boolean
    operatorScope?: OperatorScope
  }) {
    this.keyword = input?.keyword
    this.pageSize = input?.pageSize
    this.activeOnly = input?.activeOnly
    this.operatorScope = input?.operatorScope
  }
}
