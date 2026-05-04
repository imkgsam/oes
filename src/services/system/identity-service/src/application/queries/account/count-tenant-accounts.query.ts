import { IQuery } from '@nestjs/cqrs'
import { Allow, ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization'

const ACCOUNT_COUNT_SCOPE_LEVELS = ['TENANT'] as const
const ACCOUNT_COUNT_STATUSES = ['DISABLED', 'ENABLED'] as const

/** CountTenantAccountsQuery carries a tenant account count request for system-admin tenant lists. */
export class CountTenantAccountsQuery implements IQuery {
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(128, { each: true })
  readonly tenantIds: string[]

  @IsOptional()
  @IsIn(ACCOUNT_COUNT_SCOPE_LEVELS)
  readonly scopeLevel?: string

  @IsOptional()
  @IsIn(ACCOUNT_COUNT_STATUSES)
  readonly status?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input?: {
    tenantIds?: string[]
    scopeLevel?: string
    status?: string
    operatorScope?: OperatorScope
  }) {
    this.tenantIds = input?.tenantIds ?? []
    this.scopeLevel = input?.scopeLevel
    this.status = input?.status
    this.operatorScope = input?.operatorScope
  }
}
