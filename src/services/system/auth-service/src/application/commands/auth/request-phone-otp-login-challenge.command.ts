import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, Matches } from 'class-validator'

export class RequestPhoneOtpLoginChallengeCommand implements ICommand {
  @IsNotEmpty()
  @Matches(/^\+?\d{6,20}$/)
  readonly phone: string

  constructor(phone: string) {
    this.phone = phone
  }
}
