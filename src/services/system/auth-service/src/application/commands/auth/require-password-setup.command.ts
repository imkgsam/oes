import { ICommand } from '@nestjs/cqrs'
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator'

// Carries an administrator request that forces one user to set a new password.
export class RequirePasswordSetupCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsString()
  @MinLength(1)
  readonly requiredBy: string

  @IsString()
  @MinLength(1)
  readonly reason: string

  @IsOptional()
  @IsBoolean()
  readonly revokeSessions?: boolean

  constructor(input: {
    reason?: string
    requiredBy: string
    revokeSessions?: boolean
    userId: string
  }) {
    this.userId = input.userId
    this.requiredBy = input.requiredBy
    this.reason = input.reason?.trim() || 'ADMIN_RESET'
    this.revokeSessions = input.revokeSessions
  }
}
