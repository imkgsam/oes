import { IsNotEmpty, IsString } from 'class-validator'

export class LogoutOtherDevicesCommand {
  @IsString()
  @IsNotEmpty()
  readonly userId: string

  @IsString()
  @IsNotEmpty()
  readonly currentSessionId: string

  constructor(userId: string, currentSessionId: string) {
    this.userId = userId
    this.currentSessionId = currentSessionId
  }
}
