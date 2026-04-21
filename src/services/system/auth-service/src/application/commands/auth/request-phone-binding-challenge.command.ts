import { ICommand } from '@nestjs/cqrs'
import { IsString, Matches, MinLength } from 'class-validator'

// Carries one authenticated self-service phone binding challenge request.
export class RequestPhoneBindingChallengeCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsString()
  @Matches(/^\+\d{6,20}$/)
  readonly phone: string

  constructor(input: { phone: string; userId: string }) {
    this.userId = input.userId
    this.phone = input.phone
  }
}
