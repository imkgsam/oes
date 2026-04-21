import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class LogoutAllCommand {
  @IsString()
  @IsNotEmpty()
  readonly userId: string

  @IsOptional()
  @IsString()
  readonly currentSessionId?: string

  @IsOptional()
  @IsString()
  readonly currentAccountId?: string

  constructor(userId: string, currentSessionId?: string, currentAccountId?: string) {
    this.userId = userId
    this.currentSessionId = currentSessionId || undefined
    this.currentAccountId = currentAccountId || undefined
  }
}
