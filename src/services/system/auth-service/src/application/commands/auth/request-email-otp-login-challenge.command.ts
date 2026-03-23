import { ICommand } from '@nestjs/cqrs'
import { IsEmail, IsNotEmpty } from 'class-validator'

export class RequestEmailOtpLoginChallengeCommand implements ICommand {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string

  constructor(email: string) {
    this.email = email
  }
}
