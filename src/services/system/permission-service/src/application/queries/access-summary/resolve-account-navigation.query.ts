import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'

/** ResolveAccountNavigationQuery requests runtime navigation for a selected account context. */
export class ResolveAccountNavigationQuery implements IQuery {
  @IsString()
  @IsNotEmpty()
  readonly accountId: string

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsString()
  @IsNotEmpty()
  readonly scopeLevel: ScopeLevel

  @IsString()
  @IsNotEmpty()
  readonly terminal: string

  constructor(accountId: string, tenantId: string | undefined, scopeLevel: ScopeLevel, terminal: string) {
    this.accountId = accountId
    this.tenantId = tenantId
    this.scopeLevel = scopeLevel
    this.terminal = terminal
  }
}
