import { IQuery } from '@nestjs/cqrs'
import { Allow, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { OperatorScope } from '../../authorization/operator-scope'

export class ListAccountRolesQuery implements IQuery {
  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string

  @IsEnum(ScopeLevel)
  readonly scopeLevel: ScopeLevel

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(
    accountId: string,
    tenantId?: string,
    operatorScope?: OperatorScope,
    scopeLevel: ScopeLevel = ScopeLevel.TENANT
  ) {
    this.accountId = accountId
    this.scopeLevel = scopeLevel
    this.tenantId = tenantId
    this.operatorScope = operatorScope
  }
}
