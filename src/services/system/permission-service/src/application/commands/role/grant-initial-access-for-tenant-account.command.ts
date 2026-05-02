import { ICommand } from '@nestjs/cqrs'
import { Allow, IsArray, IsOptional, IsString } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

type GrantInitialAccessForTenantAccountInput = {
  tenantId: string
  accountId: string
  roleIds: string[]
  idempotencyKey: string
  reason?: string
  operatorScope?: OperatorScope
}

/** GrantInitialAccessForTenantAccountCommand carries a tenant onboarding first-admin grant request. */
export class GrantInitialAccessForTenantAccountCommand implements ICommand {
  @IsString()
  readonly tenantId: string

  @IsString()
  readonly accountId: string

  @IsArray()
  readonly roleIds: string[]

  @IsString()
  readonly idempotencyKey: string

  @IsOptional()
  @IsString()
  readonly reason?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input: GrantInitialAccessForTenantAccountInput) {
    this.tenantId = input.tenantId
    this.accountId = input.accountId
    this.roleIds = input.roleIds
    this.idempotencyKey = input.idempotencyKey
    this.reason = input.reason
    this.operatorScope = input.operatorScope
  }
}
