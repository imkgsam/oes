import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsString, Length } from 'class-validator'

// Carries one authenticated first-login password setup request.
export class CompleteFirstLoginPasswordSetupCommand implements ICommand {
  @IsString()
  readonly userId: string

  @IsString()
  @IsNotEmpty()
  @Length(6, 64)
  readonly newPassword: string

  constructor(input: { newPassword: string; userId: string }) {
    this.userId = input.userId
    this.newPassword = input.newPassword
  }
}
