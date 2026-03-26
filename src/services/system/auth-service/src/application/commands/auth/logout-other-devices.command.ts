import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class LogoutOtherDevicesCommand {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly userId: string

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly currentSessionId: string

  constructor(userId: string, currentSessionId: string) {
    this.userId = userId
    this.currentSessionId = currentSessionId
  }
}
