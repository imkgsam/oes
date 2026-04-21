import { Allow, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization'

// Carries one account-scoped forced logout request so auth-service can purge every session for a disabled account.
export class AdminDeleteAccountSessionsCommand {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly operatorId: string

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly userId: string

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly accountId: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  readonly reason: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(
    operatorId: string,
    userId: string,
    accountId: string,
    reason: string,
    operatorScope?: OperatorScope
  ) {
    this.operatorId = operatorId
    this.userId = userId
    this.accountId = accountId
    this.reason = reason
    this.operatorScope = operatorScope
  }
}
