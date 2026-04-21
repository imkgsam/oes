import { Allow, IsOptional, IsString, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

// Captures the scope-aware filters used to list online users for administrator session management.
export class AdminListOnlineUsersQuery {
  @IsOptional()
  @IsString()
  @IsUUID()
  readonly tenantId?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input: { tenantId?: string }, operatorScope?: OperatorScope) {
    this.tenantId = input.tenantId?.trim() || undefined
    this.operatorScope = operatorScope
  }
}
