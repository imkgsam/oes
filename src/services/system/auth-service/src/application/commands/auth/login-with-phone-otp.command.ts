import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsPhoneNumber, Length } from 'class-validator'

export class LoginWithPhoneOtpCommand implements ICommand {
  @IsNotEmpty()
  @IsPhoneNumber()
  readonly phone: string

  @IsNotEmpty()
  @Length(4, 8)
  readonly otp: string

  constructor(phone: string, otp: string) {
    this.phone = phone
    this.otp = otp
  }
}
