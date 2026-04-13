import { Allow, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization'

// Carries the admin session revocation request together with the optional operator scope used for resource checks.
export class AdminRevokeSessionCommand {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly operatorId: string

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly sessionId: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  readonly reason: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(
    operatorId: string,
    sessionId: string,
    reason: string,
    operatorScope?: OperatorScope
  ) {
    this.operatorId = operatorId
    this.sessionId = sessionId
    this.reason = reason
    this.operatorScope = operatorScope
  }
}
