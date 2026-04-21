import { ICommand } from '@nestjs/cqrs'
import { IsEmail, IsString, MinLength } from 'class-validator'

// Carries one authenticated self-service email binding challenge request.
export class RequestEmailBindingChallengeCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsEmail()
  readonly email: string

  constructor(input: { email: string; userId: string }) {
    this.userId = input.userId
    this.email = input.email
  }
}
