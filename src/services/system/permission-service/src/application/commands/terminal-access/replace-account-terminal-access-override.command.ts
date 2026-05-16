import { ICommand } from '@nestjs/cqrs'
import { ArrayUnique, IsArray, IsEnum, IsIn, IsNotEmpty, IsOptional, IsUUID } from 'class-validator'
import { TERMINAL_ACCESS_TERMINALS } from '../../../domain/constants/terminal-access-terminal'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'

export interface ReplaceAccountTerminalAccessOverrideCommandParams {
  accountId: string
  tenantId?: string | null
  scopeLevel: ScopeLevel
  allowedTerminals: readonly string[]
}

/** ReplaceAccountTerminalAccessOverrideCommand fully replaces one account's terminal override for a scope. */
export class ReplaceAccountTerminalAccessOverrideCommand implements ICommand {
  @IsUUID('4', { message: 'Invalid account ID format' })
  @IsNotEmpty({ message: 'Account ID is required' })
  readonly accountId: string

  @IsOptional()
  @IsUUID('4', { message: 'Invalid tenant ID format' })
  readonly tenantId: string | null

  @IsEnum(ScopeLevel, { message: 'Invalid scope level' })
  readonly scopeLevel: ScopeLevel

  @IsArray()
  @ArrayUnique()
  @IsIn(TERMINAL_ACCESS_TERMINALS, { each: true })
  readonly allowedTerminals: readonly string[]

  constructor(params: ReplaceAccountTerminalAccessOverrideCommandParams) {
    this.accountId = params.accountId
    this.tenantId = params.scopeLevel === ScopeLevel.SYSTEM ? null : params.tenantId ?? null
    this.scopeLevel = params.scopeLevel
    this.allowedTerminals = params.allowedTerminals
  }
}
