import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { IDENTITY_SERVICE, LoginMethodEnum } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AccountCandidateSummary,
  IIdentityServicePort
} from '../../ports/identity-service.port'
import { AuthAuditService } from '../../services/auth-audit.service'
import { PhoneOtpLoginService } from '../../services/phone-otp-login.service'
import { AUTH_NO_AVAILABLE_ACCOUNT } from '../../../common/constants/exception-enums'
import { LoginWithPhoneOtpCommand } from './login-with-phone-otp.command'

export type LoginWithPhoneOtpNextStep = 'ACCOUNT_SELECTION_REQUIRED' | 'MFA_REQUIRED'

export interface LoginWithPhoneOtpResult {
  userId: string
  method: LoginMethodEnum
  nextStep: LoginWithPhoneOtpNextStep
  accounts: AccountCandidateSummary[]
  challengeId?: string
}

@CommandHandler(LoginWithPhoneOtpCommand)
export class LoginWithPhoneOtpHandler
  implements ICommandHandler<LoginWithPhoneOtpCommand, LoginWithPhoneOtpResult>
{
  constructor(
    private readonly phoneOtpLoginService: PhoneOtpLoginService,
    private readonly authAuditService: AuthAuditService,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort
  ) {}

  async execute(command: LoginWithPhoneOtpCommand): Promise<LoginWithPhoneOtpResult> {
    const userId = await this.phoneOtpLoginService.authenticate(command.phone, command.otp)

    const accounts = await this.identityService.getAvailableAccountsByUserId(userId)
    if (accounts.length === 0) {
      throw ExceptionFactory.domain(AUTH_NO_AVAILABLE_ACCOUNT, { userId })
    }

    return {
      userId,
      method: LoginMethodEnum.PhoneOtp,
      nextStep: 'ACCOUNT_SELECTION_REQUIRED',
      accounts
    }
  }
}
