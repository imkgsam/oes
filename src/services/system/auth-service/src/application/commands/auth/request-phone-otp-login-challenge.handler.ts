import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { PhoneOtpLoginService } from 'src/application/services/phone-otp-login.service'
import { RequestPhoneOtpLoginChallengeCommand } from './request-phone-otp-login-challenge.command'

export interface RequestPhoneOtpLoginChallengeResult {
  challengeId: string
  expiresAt: Date
  destination: string
}

@CommandHandler(RequestPhoneOtpLoginChallengeCommand)
export class RequestPhoneOtpLoginChallengeHandler
  implements
    ICommandHandler<RequestPhoneOtpLoginChallengeCommand, RequestPhoneOtpLoginChallengeResult>
{
  constructor(private readonly phoneOtpLoginService: PhoneOtpLoginService) {}

  async execute(
    command: RequestPhoneOtpLoginChallengeCommand
  ): Promise<RequestPhoneOtpLoginChallengeResult> {
    return this.phoneOtpLoginService.createChallenge(command.phone)
  }
}
