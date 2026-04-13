import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, Length, Matches } from 'class-validator'

export class LoginWithPhonePasswordCommand implements ICommand {
  @IsNotEmpty()
  @Matches(/^\+?\d{6,20}$/)
  readonly phone: string

  @IsNotEmpty()
  @Length(6, 30)
  readonly password: string

  constructor(phone: string, password: string) {
    this.phone = phone
    this.password = password
  }
}
