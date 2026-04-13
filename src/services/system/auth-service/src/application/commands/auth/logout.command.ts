import { IsNotEmpty, IsString } from 'class-validator'

export class LogoutCommand {
  @IsString()
  @IsNotEmpty()
  readonly sessionId: string

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }
}
