import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator'

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

  constructor(operatorId: string, sessionId: string, reason: string) {
    this.operatorId = operatorId
    this.sessionId = sessionId
    this.reason = reason
  }
}
