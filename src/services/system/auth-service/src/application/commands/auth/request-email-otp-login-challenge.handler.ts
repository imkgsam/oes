import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TerminalLoginFlow } from '@oes/common/auth'
import { EmailOtpLoginService } from '../../services/email-otp-login.service'
import { TerminalLoginPolicyService } from '../../services/terminal-login-policy.service'
import { RequestEmailOtpLoginChallengeCommand } from './request-email-otp-login-challenge.command'

export interface RequestEmailOtpLoginChallengeResult {
  challengeId: string
  expiresAt: Date
  destination: string
}

@CommandHandler(RequestEmailOtpLoginChallengeCommand)
// Creates email OTP login challenges only after enforcing terminal-level login flow policy.
export class RequestEmailOtpLoginChallengeHandler
  implements
    ICommandHandler<RequestEmailOtpLoginChallengeCommand, RequestEmailOtpLoginChallengeResult>
{
  constructor(
    private readonly emailOtpLoginService: EmailOtpLoginService,
    private readonly terminalLoginPolicyService: TerminalLoginPolicyService
  ) {}

  async execute(
    command: RequestEmailOtpLoginChallengeCommand
  ): Promise<RequestEmailOtpLoginChallengeResult> {
    await this.terminalLoginPolicyService.assertFlowAllowed(
      command.terminal || 'WEB',
      TerminalLoginFlow.EmailOtp
    )

    return this.emailOtpLoginService.createChallenge(command.email)
  }
}
