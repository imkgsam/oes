import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { IDENTITY_SERVICE, LoginMethodEnum, LoginMethodType } from '@oes/common/constants'
import { ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
import { EmailPasswordLoginRequestDto } from '@oes/common/dtos'
import {
  AccountCandidateSummary,
  IIdentityServicePort
} from '../../ports/identity-service.port'
import { AuthAuditService } from '../../services/auth-audit.service'
import { LoginRiskThrottleService } from '../../services/login-risk-throttle.service'
import { EmailOtpMfaChallengeService } from '../../services/mfa/email-otp-mfa-challenge.service'
import { PhoneOtpMfaChallengeService } from '../../services/mfa/phone-otp-mfa-challenge.service'
import { TotpMfaChallengeService } from '../../services/mfa/totp-mfa-challenge.service'
import {
  AUTH_LOGIN_TEMPORARILY_LOCKED,
  AUTH_NO_AVAILABLE_ACCOUNT
} from '../../../common/constants/exception-enums'
import { AuthStrategyFactory } from '../../../domain/services/strategies/auth-strategies.factory'
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
    private readonly totpMfaChallengeService: TotpMfaChallengeService,
    private readonly emailOtpMfaChallengeService: EmailOtpMfaChallengeService,
    private readonly phoneOtpMfaChallengeService: PhoneOtpMfaChallengeService,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort
  ) {}

  async execute(
    command: LoginWithEmailPasswordCommand
  ): Promise<LoginWithEmailPasswordResult> {
    try {
      await this.loginRiskThrottleService.assertPasswordLoginAllowed(
        LoginMethodType.EMAIL,
        command.email
      )
    } catch (error) {
      if (this.isLoginTemporarilyLockedError(error)) {
        this.authAuditService.emitLoginBlocked(command.email, AUTH_LOGIN_TEMPORARILY_LOCKED.code)
      }

      throw error
    }

    const strategy = this.authStrategyFactory.get(LoginMethodEnum.EmailPassword)
    let userId: string

    try {
      userId = await strategy.authenticate({
        email: command.email,
        password: command.password
      } as EmailPasswordLoginRequestDto)
    } catch (error) {
      if (this.isInvalidCredentialError(error)) {
        await this.loginRiskThrottleService.recordPasswordLoginFailure(
          LoginMethodType.EMAIL,
          command.email
        )
        this.authAuditService.emitLoginFailed(command.email, 'INVALID_CREDENTIALS')
      }

      throw error
    }

    await this.loginRiskThrottleService.clearPasswordLoginFailures(
      LoginMethodType.EMAIL,
      command.email
    )

    if (await this.totpMfaChallengeService.hasActiveBinding(userId)) {
      const challenge = await this.totpMfaChallengeService.createChallenge(userId)
      this.authAuditService.emitMfaChallengeCreated(userId, challenge.challengeId, 'TOTP')
      return {
        userId,
        method: LoginMethodEnum.EmailPassword,
        nextStep: 'MFA_REQUIRED',
        accounts: [],
        challengeId: challenge.challengeId
      }
    }

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

    if (await this.phoneOtpMfaChallengeService.hasActiveBinding(userId)) {
      const challenge = await this.phoneOtpMfaChallengeService.createChallenge(userId)
      this.authAuditService.emitMfaChallengeCreated(userId, challenge.challengeId, 'SMS_OTP')
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

  private isLoginTemporarilyLockedError(error: unknown): boolean {
    return error instanceof OESExceptionBase && error.getCode() === AUTH_LOGIN_TEMPORARILY_LOCKED.code
  }
}
