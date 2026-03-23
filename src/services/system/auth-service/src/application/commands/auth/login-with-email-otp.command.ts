import { ICommand } from '@nestjs/cqrs'
import { IsEmail, IsNotEmpty, Length } from 'class-validator'

export class LoginWithEmailOtpCommand implements ICommand {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string

  @IsNotEmpty()
  @Length(4, 8)
  readonly otp: string

  constructor(email: string, otp: string) {
    this.email = email
    this.otp = otp
  }
}
