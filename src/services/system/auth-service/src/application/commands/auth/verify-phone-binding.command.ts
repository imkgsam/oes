import { ICommand } from '@nestjs/cqrs'
import { IsString, Matches, MaxLength, MinLength } from 'class-validator'

// Carries one authenticated self-service phone binding verification attempt.
export class VerifyPhoneBindingCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsString()
  @Matches(/^\+\d{6,20}$/)
  readonly phone: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  readonly otp: string

  constructor(input: { phone: string; otp: string; userId: string }) {
    this.userId = input.userId
    this.phone = input.phone
    this.otp = input.otp
  }
}
