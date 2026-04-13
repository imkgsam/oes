import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, Length, Matches } from 'class-validator'

export class LoginWithPhoneOtpCommand implements ICommand {
  @IsNotEmpty()
  @Matches(/^\+?\d{6,20}$/)
  readonly phone: string

  @IsNotEmpty()
  @Length(4, 8)
  readonly otp: string

  constructor(phone: string, otp: string) {
    this.phone = phone
    this.otp = otp
  }
}
