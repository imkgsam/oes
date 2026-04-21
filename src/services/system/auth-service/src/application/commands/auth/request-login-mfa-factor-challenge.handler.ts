import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { LoginMfaOrchestrationService } from '../../services/mfa/login-mfa-orchestration.service'
import { RequestLoginMfaFactorChallengeCommand } from './request-login-mfa-factor-challenge.command'

export interface LoginMfaFactorChallengeResult {
  destination?: string
  expiresAt?: string
  factorChallengeId?: string
}

@CommandHandler(RequestLoginMfaFactorChallengeCommand)
// Requests one factor-specific challenge so login MFA can switch between enabled factors without restarting primary auth.
export class RequestLoginMfaFactorChallengeHandler
  implements
    ICommandHandler<RequestLoginMfaFactorChallengeCommand, LoginMfaFactorChallengeResult>
{
  constructor(
    private readonly loginMfaOrchestrationService: LoginMfaOrchestrationService
  ) {}

  async execute(
    command: RequestLoginMfaFactorChallengeCommand
  ): Promise<LoginMfaFactorChallengeResult> {
    return this.loginMfaOrchestrationService.requestFactorChallenge(
      command.challengeId,
      command.factor
    )
  }
}
