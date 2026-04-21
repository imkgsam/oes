import { IQuery } from '@nestjs/cqrs'
import { Allow, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { OperatorScope } from '../../authorization'

const ACCOUNT_DIRECTORY_SCOPE_LEVELS = ['SYSTEM', 'TENANT'] as const
const ACCOUNT_DIRECTORY_STATUSES = ['DISABLED', 'ENABLED'] as const

export class ListAccountsQuery implements IQuery {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  readonly keyword?: string

  @IsOptional()
  @IsIn(ACCOUNT_DIRECTORY_SCOPE_LEVELS)
  readonly scopeLevel?: string

  @IsOptional()
  @IsIn(ACCOUNT_DIRECTORY_STATUSES)
  readonly status?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  readonly page?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  readonly pageSize?: number

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input?: {
    keyword?: string
    page?: number
    pageSize?: number
    scopeLevel?: string
    status?: string
    operatorScope?: OperatorScope
  }) {
    this.keyword = input?.keyword
    this.page = input?.page
    this.pageSize = input?.pageSize
    this.scopeLevel = input?.scopeLevel
    this.status = input?.status
    this.operatorScope = input?.operatorScope
  }
}
