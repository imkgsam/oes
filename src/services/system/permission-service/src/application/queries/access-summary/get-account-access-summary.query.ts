import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'

// Describes the selected account context whose effective authorization summary should be resolved.
export class GetAccountAccessSummaryQuery {
  @IsString()
  @IsNotEmpty()
  readonly accountId: string

  @IsEnum(ScopeLevel)
  readonly scopeLevel: ScopeLevel

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  constructor(accountId: string, tenantId?: string, scopeLevel: ScopeLevel = ScopeLevel.TENANT) {
    this.accountId = accountId
    this.scopeLevel = scopeLevel
    this.tenantId = tenantId
  }
}
