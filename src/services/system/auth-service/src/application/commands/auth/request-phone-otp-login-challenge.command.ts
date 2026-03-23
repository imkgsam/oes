import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsPhoneNumber } from 'class-validator'

export class RequestPhoneOtpLoginChallengeCommand implements ICommand {
  @IsNotEmpty()
  @IsPhoneNumber()
  readonly phone: string

  constructor(phone: string) {
    this.phone = phone
  }
}
