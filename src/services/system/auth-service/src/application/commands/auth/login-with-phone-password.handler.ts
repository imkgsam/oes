import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { PhonePasswordLoginRequestDto } from '@oes/common/dtos'
import { IDENTITY_SERVICE, LoginMethodEnum, LoginMethodType } from '@oes/common/constants'
import { ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
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
import { LoginWithPhonePasswordCommand } from './login-with-phone-password.command'

export type LoginWithPhonePasswordNextStep = 'ACCOUNT_SELECTION_REQUIRED' | 'MFA_REQUIRED'

export interface LoginWithPhonePasswordResult {
  userId: string
  method: LoginMethodEnum
  nextStep: LoginWithPhonePasswordNextStep
  accounts: AccountCandidateSummary[]
  challengeId?: string
}

@CommandHandler(LoginWithPhonePasswordCommand)
export class LoginWithPhonePasswordHandler
  implements ICommandHandler<LoginWithPhonePasswordCommand, LoginWithPhonePasswordResult>
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

  async execute(command: LoginWithPhonePasswordCommand): Promise<LoginWithPhonePasswordResult> {
    try {
      await this.loginRiskThrottleService.assertPasswordLoginAllowed(
        LoginMethodType.PHONE,
        command.phone
      )
    } catch (error) {
      if (this.isLoginTemporarilyLockedError(error)) {
        this.authAuditService.emitLoginBlocked(command.phone, AUTH_LOGIN_TEMPORARILY_LOCKED.code)
      }

      throw error
    }

    const strategy = this.authStrategyFactory.get(LoginMethodEnum.PhonePassword)
    let userId: string

    try {
      userId = await strategy.authenticate({
        phone: command.phone,
        password: command.password
      } as PhonePasswordLoginRequestDto)
    } catch (error) {
      if (this.isInvalidCredentialError(error)) {
        await this.loginRiskThrottleService.recordPasswordLoginFailure(
          LoginMethodType.PHONE,
          command.phone
        )
        this.authAuditService.emitLoginFailed(command.phone, 'INVALID_CREDENTIALS')
      }

      throw error
    }

    await this.loginRiskThrottleService.clearPasswordLoginFailures(
      LoginMethodType.PHONE,
      command.phone
    )

    if (await this.totpMfaChallengeService.hasActiveBinding(userId)) {
      const challenge = await this.totpMfaChallengeService.createChallenge(userId)
      this.authAuditService.emitMfaChallengeCreated(userId, challenge.challengeId, 'TOTP')
      return {
        userId,
        method: LoginMethodEnum.PhonePassword,
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
        method: LoginMethodEnum.PhonePassword,
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
        method: LoginMethodEnum.PhonePassword,
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
      method: LoginMethodEnum.PhonePassword,
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
