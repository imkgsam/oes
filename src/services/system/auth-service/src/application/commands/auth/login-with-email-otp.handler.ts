import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { IDENTITY_SERVICE, LoginMethodEnum } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AccountCandidateSummary,
  IIdentityServicePort
} from 'src/application/ports/identity-service.port'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import { EmailOtpLoginService } from 'src/application/services/email-otp-login.service'
import { PhoneOtpMfaChallengeService } from 'src/application/services/mfa/phone-otp-mfa-challenge.service'
import { AUTH_NO_AVAILABLE_ACCOUNT } from 'src/common/constants/exception-enums'
import { LoginWithEmailOtpCommand } from './login-with-email-otp.command'

export type LoginWithEmailOtpNextStep = 'ACCOUNT_SELECTION_REQUIRED' | 'MFA_REQUIRED'

export interface LoginWithEmailOtpResult {
  userId: string
  method: LoginMethodEnum
  nextStep: LoginWithEmailOtpNextStep
  accounts: AccountCandidateSummary[]
  challengeId?: string
}

@CommandHandler(LoginWithEmailOtpCommand)
export class LoginWithEmailOtpHandler
  implements ICommandHandler<LoginWithEmailOtpCommand, LoginWithEmailOtpResult>
{
  constructor(
    private readonly emailOtpLoginService: EmailOtpLoginService,
    private readonly phoneOtpMfaChallengeService: PhoneOtpMfaChallengeService,
    private readonly authAuditService: AuthAuditService,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort
  ) {}

  async execute(command: LoginWithEmailOtpCommand): Promise<LoginWithEmailOtpResult> {
    const userId = await this.emailOtpLoginService.authenticate(command.email, command.otp)

    if (await this.phoneOtpMfaChallengeService.hasActiveBinding(userId)) {
      const challenge = await this.phoneOtpMfaChallengeService.createChallenge(userId)
      this.authAuditService.emitMfaChallengeCreated(userId, challenge.challengeId, 'SMS_OTP')
      return {
        userId,
        method: LoginMethodEnum.EmailOtp,
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
      method: LoginMethodEnum.EmailOtp,
      nextStep: 'ACCOUNT_SELECTION_REQUIRED',
      accounts
    }
  }
}
