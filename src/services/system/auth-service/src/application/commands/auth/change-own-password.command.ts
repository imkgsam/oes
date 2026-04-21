import { ICommand } from '@nestjs/cqrs'
import { IsString, MinLength } from 'class-validator'

// Carries a self-service password change request for the authenticated user.
export class ChangeOwnPasswordCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsString()
  @MinLength(1)
  readonly currentPassword: string

  @IsString()
  @MinLength(8)
  readonly newPassword: string

  constructor(input: { currentPassword: string; newPassword: string; userId: string }) {
    this.userId = input.userId
    this.currentPassword = input.currentPassword
    this.newPassword = input.newPassword
  }
}
