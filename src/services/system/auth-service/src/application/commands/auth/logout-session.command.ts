import { IsNotEmpty, IsString } from 'class-validator'

// Carries the self-service request for revoking one other session within the current account boundary.
export class LogoutSessionCommand {
  @IsString()
  @IsNotEmpty()
  readonly userId: string

  @IsString()
  @IsNotEmpty()
  readonly currentSessionId: string

  @IsString()
  @IsNotEmpty()
  readonly targetSessionId: string

  constructor(userId: string, currentSessionId: string, targetSessionId: string) {
    this.userId = userId
    this.currentSessionId = currentSessionId
    this.targetSessionId = targetSessionId
  }
}
