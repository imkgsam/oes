import { IQuery } from '@nestjs/cqrs'
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'

/** GetAccountTerminalAccessQuery reads the final allowed login terminal set for one account scope. */
export class GetAccountTerminalAccessQuery implements IQuery {
  @IsUUID('4', { message: 'Invalid account ID format' })
  @IsNotEmpty({ message: 'Account ID is required' })
  readonly accountId: string

  @IsOptional()
  @IsUUID('4', { message: 'Invalid tenant ID format' })
  readonly tenantId: string | undefined

  @IsEnum(ScopeLevel, { message: 'Invalid scope level' })
  readonly scopeLevel: ScopeLevel

  constructor(accountId: string, tenantId: string | undefined, scopeLevel: ScopeLevel) {
    this.accountId = accountId
    this.tenantId = tenantId
    this.scopeLevel = scopeLevel
  }
}
