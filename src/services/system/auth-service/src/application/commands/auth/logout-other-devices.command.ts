import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class LogoutOtherDevicesCommand {
  @IsString()
  @IsNotEmpty()
  readonly userId: string

  @IsString()
  @IsNotEmpty()
  readonly currentSessionId: string

  @IsOptional()
  @IsString()
  readonly currentAccountId?: string

  constructor(userId: string, currentSessionId: string, currentAccountId?: string) {
    this.userId = userId
    this.currentSessionId = currentSessionId
    this.currentAccountId = currentAccountId || undefined
  }
}
