import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { IDENTITY_SERVICE, LoginMethodEnum } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AccountCandidateSummary,
  IIdentityServicePort
} from 'src/application/ports/identity-service.port'
import { MfaChallengeVerificationService } from 'src/application/services/mfa/mfa-challenge-verification.service'
import { AUTH_NO_AVAILABLE_ACCOUNT, AUTH_OTP_INVALID } from 'src/common/constants/exception-enums'
import { SubmitMfaChallengeCommand } from './submit-mfa-challenge.command'

export interface SubmitMfaChallengeResult {
  userId: string
  method: LoginMethodEnum
  nextStep: 'ACCOUNT_SELECTION_REQUIRED'
  accounts: AccountCandidateSummary[]
}

@CommandHandler(SubmitMfaChallengeCommand)
export class SubmitMfaChallengeHandler
  implements ICommandHandler<SubmitMfaChallengeCommand, SubmitMfaChallengeResult>
{
  constructor(
    private readonly mfaChallengeVerificationService: MfaChallengeVerificationService,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort
  ) {}

  async execute(command: SubmitMfaChallengeCommand): Promise<SubmitMfaChallengeResult> {
    const userId = await this.mfaChallengeVerificationService.verifyChallenge(
      command.challengeId,
      command.code
    )
    if (!userId) {
      throw ExceptionFactory.domain(AUTH_OTP_INVALID)
    }

    const accounts = await this.identityService.getAvailableAccountsByUserId(userId)
    if (accounts.length === 0) {
      throw ExceptionFactory.domain(AUTH_NO_AVAILABLE_ACCOUNT, { userId })
    }

    return {
      userId,
      method: command.loginMethod,
      nextStep: 'ACCOUNT_SELECTION_REQUIRED',
      accounts
    }
  }
}
