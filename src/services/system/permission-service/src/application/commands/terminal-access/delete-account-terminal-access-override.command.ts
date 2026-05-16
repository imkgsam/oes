import { ICommand } from '@nestjs/cqrs'
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'

export interface DeleteAccountTerminalAccessOverrideCommandParams {
  accountId: string
  tenantId?: string | null
  scopeLevel: ScopeLevel
}

/** DeleteAccountTerminalAccessOverrideCommand removes account replacement so role defaults apply again. */
export class DeleteAccountTerminalAccessOverrideCommand implements ICommand {
  @IsUUID('4', { message: 'Invalid account ID format' })
  @IsNotEmpty({ message: 'Account ID is required' })
  readonly accountId: string

  @IsOptional()
  @IsUUID('4', { message: 'Invalid tenant ID format' })
  readonly tenantId: string | null

  @IsEnum(ScopeLevel, { message: 'Invalid scope level' })
  readonly scopeLevel: ScopeLevel

  constructor(params: DeleteAccountTerminalAccessOverrideCommandParams) {
    this.accountId = params.accountId
    this.scopeLevel = params.scopeLevel
    this.tenantId = params.scopeLevel === ScopeLevel.SYSTEM ? null : params.tenantId ?? null
  }
}
