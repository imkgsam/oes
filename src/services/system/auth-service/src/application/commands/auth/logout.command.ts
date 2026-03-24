import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class LogoutCommand {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly sessionId: string

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }
}
