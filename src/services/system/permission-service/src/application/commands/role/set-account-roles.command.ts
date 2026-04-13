import { ICommand } from '@nestjs/cqrs'
import { Allow, IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { AccountType } from '../../../domain/enums/account-type.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { OperatorScope } from '../../authorization/operator-scope'

export class SetAccountRolesCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string

  @IsEnum(AccountType)
  readonly accountType: AccountType

  @IsEnum(ScopeLevel)
  readonly scopeLevel: ScopeLevel

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsArray()
  @IsUUID(undefined, { each: true })
  readonly roleIds: string[]

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(params: {
    accountId: string
    accountType: AccountType
    scopeLevel?: ScopeLevel
    tenantId?: string
    roleIds: string[]
    operatorScope?: OperatorScope
  }) {
    this.accountId = params.accountId
    this.accountType = params.accountType
    this.scopeLevel = params.scopeLevel ?? ScopeLevel.TENANT
    this.tenantId = params.tenantId
    this.roleIds = params.roleIds
    this.operatorScope = params.operatorScope
  }
}
