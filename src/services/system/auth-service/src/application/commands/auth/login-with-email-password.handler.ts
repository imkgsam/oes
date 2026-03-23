import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { IDENTITY_SERVICE, LoginMethodEnum } from '@oes/common/constants'
import { ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
import { EmailPasswordLoginRequestDto } from '@oes/common/dtos'
import {
  AccountCandidateSummary,
  IIdentityServicePort
} from 'src/application/ports/identity-service.port'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import { LoginRiskThrottleService } from 'src/application/services/login-risk-throttle.service'
import { EmailOtpMfaChallengeService } from 'src/application/services/mfa/email-otp-mfa-challenge.service'
import { AUTH_NO_AVAILABLE_ACCOUNT } from 'src/common/constants/exception-enums'
import { AuthStrategyFactory } from 'src/domain/services/strategies/auth-strategies.factory'
import { LoginWithEmailPasswordCommand } from './login-with-email-password.command'

export type LoginWithEmailPasswordNextStep = 'ACCOUNT_SELECTION_REQUIRED' | 'MFA_REQUIRED'

export interface LoginWithEmailPasswordResult {
  userId: string
  method: LoginMethodEnum
  nextStep: LoginWithEmailPasswordNextStep
  accounts: AccountCandidateSummary[]
  challengeId?: string
}

@CommandHandler(LoginWithEmailPasswordCommand)
export class LoginWithEmailPasswordHandler
  implements ICommandHandler<LoginWithEmailPasswordCommand, LoginWithEmailPasswordResult>
{
  constructor(
    private readonly authStrategyFactory: AuthStrategyFactory,
    private readonly authAuditService: AuthAuditService,
    private readonly loginRiskThrottleService: LoginRiskThrottleService,
    private readonly emailOtpMfaChallengeService: EmailOtpMfaChallengeService,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort
  ) {}

  async execute(
    command: LoginWithEmailPasswordCommand
  ): Promise<LoginWithEmailPasswordResult> {
    await this.loginRiskThrottleService.assertPasswordLoginAllowed(command.email)

    const strategy = this.authStrategyFactory.get(LoginMethodEnum.EmailPassword)
    let userId: string

    try {
      userId = await strategy.authenticate({
        email: command.email,
        password: command.password
      } as EmailPasswordLoginRequestDto)
    } catch (error) {
      if (this.isInvalidCredentialError(error)) {
        await this.loginRiskThrottleService.recordPasswordLoginFailure(command.email)
        this.authAuditService.emitLoginFailed(command.email, 'INVALID_CREDENTIALS')
      }

      throw error
    }

    await this.loginRiskThrottleService.clearPasswordLoginFailures(command.email)

    if (await this.emailOtpMfaChallengeService.hasActiveBinding(userId)) {
      const challenge = await this.emailOtpMfaChallengeService.createChallenge(userId)
      this.authAuditService.emitMfaChallengeCreated(userId, challenge.challengeId, 'EMAIL_OTP')
      return {
        userId,
        method: LoginMethodEnum.EmailPassword,
        nextStep: 'MFA_REQUIRED',
        accounts: [],
        challengeId: challenge.challengeId
      }
    }

    const accounts = await this.identityService.getAvailableAccountsByUserId(userId)
    if (accounts.length === 0) {
      throw ExceptionFactory.domain(AUTH_NO_AVAILABLE_ACCOUNT, { userId })
    }

    return {
      userId,
      method: LoginMethodEnum.EmailPassword,
      nextStep: 'ACCOUNT_SELECTION_REQUIRED',
      accounts
    }
  }

  private isInvalidCredentialError(error: unknown): boolean {
    return error instanceof OESExceptionBase && error.getCode() === 'AUTH_INVALID_CREDENTIALS'
  }
}
