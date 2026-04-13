import { ICommand } from '@nestjs/cqrs'
import { Allow, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { AccountType } from '../../../domain/enums/account-type.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { OperatorScope } from '../../authorization/operator-scope'

export class AssignAccountRoleCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string

  @IsEnum(AccountType)
  readonly accountType: AccountType

  @IsUUID()
  @IsNotEmpty()
  readonly roleId: string

  @IsEnum(ScopeLevel)
  readonly scopeLevel: ScopeLevel

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsOptional()
  @IsDateString()
  readonly effectiveAt?: string

  @IsOptional()
  @IsDateString()
  readonly expiresAt?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(params: {
    accountId: string
    accountType: AccountType
    roleId: string
    scopeLevel?: ScopeLevel
    tenantId?: string
    effectiveAt?: string
    expiresAt?: string
    operatorScope?: OperatorScope
  }) {
    this.accountId = params.accountId
    this.accountType = params.accountType
    this.roleId = params.roleId
    this.scopeLevel = params.scopeLevel ?? ScopeLevel.TENANT
    this.tenantId = params.tenantId
    this.effectiveAt = params.effectiveAt
    this.expiresAt = params.expiresAt
    this.operatorScope = params.operatorScope
  }
}
