import { ICommand } from '@nestjs/cqrs'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

// Carries one authenticated self-service email binding verification attempt.
export class VerifyEmailBindingCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsEmail()
  readonly email: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  readonly otp: string

  constructor(input: { email: string; otp: string; userId: string }) {
    this.userId = input.userId
    this.email = input.email
    this.otp = input.otp
  }
}
