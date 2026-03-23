import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { EmailOtpLoginService } from 'src/application/services/email-otp-login.service'
import { RequestEmailOtpLoginChallengeCommand } from './request-email-otp-login-challenge.command'

export interface RequestEmailOtpLoginChallengeResult {
  challengeId: string
  expiresAt: Date
  destination: string
}

@CommandHandler(RequestEmailOtpLoginChallengeCommand)
export class RequestEmailOtpLoginChallengeHandler
  implements
    ICommandHandler<RequestEmailOtpLoginChallengeCommand, RequestEmailOtpLoginChallengeResult>
{
  constructor(private readonly emailOtpLoginService: EmailOtpLoginService) {}

  async execute(
    command: RequestEmailOtpLoginChallengeCommand
  ): Promise<RequestEmailOtpLoginChallengeResult> {
    return this.emailOtpLoginService.createChallenge(command.email)
  }
}
