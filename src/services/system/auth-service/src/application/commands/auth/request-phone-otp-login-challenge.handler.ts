import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TerminalLoginFlow } from '@oes/common/auth'
import { PhoneOtpLoginService } from '../../services/phone-otp-login.service'
import { TerminalLoginPolicyService } from '../../services/terminal-login-policy.service'
import { RequestPhoneOtpLoginChallengeCommand } from './request-phone-otp-login-challenge.command'

export interface RequestPhoneOtpLoginChallengeResult {
  challengeId: string
  expiresAt: Date
  destination: string
}

@CommandHandler(RequestPhoneOtpLoginChallengeCommand)
// Creates phone OTP login challenges only after enforcing terminal-level login flow policy.
export class RequestPhoneOtpLoginChallengeHandler
  implements
    ICommandHandler<RequestPhoneOtpLoginChallengeCommand, RequestPhoneOtpLoginChallengeResult>
{
  constructor(
    private readonly phoneOtpLoginService: PhoneOtpLoginService,
    private readonly terminalLoginPolicyService: TerminalLoginPolicyService
  ) {}

  async execute(
    command: RequestPhoneOtpLoginChallengeCommand
  ): Promise<RequestPhoneOtpLoginChallengeResult> {
    await this.terminalLoginPolicyService.assertFlowAllowed(
      command.terminal || 'WEB',
      TerminalLoginFlow.PhoneOtp
    )

    return this.phoneOtpLoginService.createChallenge(command.phone)
  }
}
