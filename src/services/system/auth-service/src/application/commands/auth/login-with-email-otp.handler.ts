import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { IDENTITY_SERVICE, LoginMethodEnum } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AccountCandidateSummary,
  IIdentityServicePort
} from '../../ports/identity-service.port'
import { AuthAuditService } from '../../services/auth-audit.service'
import { EmailOtpLoginService } from '../../services/email-otp-login.service'
import { TenantSessionAccessService } from '../../services/tenant-session-access.service'
import { AUTH_NO_AVAILABLE_ACCOUNT } from '../../../common/constants/exception-enums'
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
    private readonly authAuditService: AuthAuditService,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort,
    private readonly tenantSessionAccessService: TenantSessionAccessService
  ) {}

  async execute(command: LoginWithEmailOtpCommand): Promise<LoginWithEmailOtpResult> {
    const userId = await this.emailOtpLoginService.authenticate(command.email, command.otp)

    const accounts = await this.tenantSessionAccessService.filterActiveAccountCandidates(
      await this.identityService.getAvailableAccountsByUserId(userId)
    )
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
