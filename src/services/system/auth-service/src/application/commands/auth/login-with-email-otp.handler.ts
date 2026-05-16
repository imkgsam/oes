import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { TerminalLoginFlow } from '@oes/common/auth'
import { IDENTITY_SERVICE, LoginMethodEnum } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AccountCandidateSummary,
  IIdentityServicePort
} from '../../ports/identity-service.port'
import { AuthAuditService } from '../../services/auth-audit.service'
import { EmailOtpLoginService } from '../../services/email-otp-login.service'
import {
  PdaPrimaryLoginCompletionResult,
  PdaPrimaryLoginCompletionService
} from '../../services/pda-primary-login-completion.service'
import { TerminalLoginPolicyService } from '../../services/terminal-login-policy.service'
import { TenantSessionAccessService } from '../../services/tenant-session-access.service'
import { AUTH_NO_AVAILABLE_ACCOUNT } from '../../../common/constants/exception-enums'
import { LoginWithEmailOtpCommand } from './login-with-email-otp.command'

export type LoginWithEmailOtpNextStep = 'ACCOUNT_SELECTION_REQUIRED' | 'MFA_REQUIRED'

export interface LoginWithEmailOtpAccountSelectionResult {
  userId: string
  method: LoginMethodEnum
  nextStep: 'ACCOUNT_SELECTION_REQUIRED'
  accounts: AccountCandidateSummary[]
}

export type LoginWithEmailOtpResult =
  | LoginWithEmailOtpAccountSelectionResult
  | PdaPrimaryLoginCompletionResult

@CommandHandler(LoginWithEmailOtpCommand)
// Orchestrates email OTP login after enforcing terminal-level login flow policy.
export class LoginWithEmailOtpHandler
  implements ICommandHandler<LoginWithEmailOtpCommand, LoginWithEmailOtpResult>
{
  constructor(
    private readonly emailOtpLoginService: EmailOtpLoginService,
    private readonly authAuditService: AuthAuditService,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort,
    private readonly tenantSessionAccessService: TenantSessionAccessService,
    private readonly terminalLoginPolicyService: TerminalLoginPolicyService,
    private readonly pdaPrimaryLoginCompletionService?: PdaPrimaryLoginCompletionService
  ) {}

  async execute(command: LoginWithEmailOtpCommand): Promise<LoginWithEmailOtpResult> {
    await this.terminalLoginPolicyService.assertFlowAllowed(
      command.terminal || 'WEB',
      TerminalLoginFlow.EmailOtp
    )

    const userId = await this.emailOtpLoginService.authenticate(command.email, command.otp)

    if (this.isPdaLogin(command.terminal)) {
      return this.pdaPrimaryLoginCompletionService!.complete({
        userId,
        loginMethod: LoginMethodEnum.EmailOtp,
        terminalDeviceId: command.terminalDeviceId,
        deviceBoundTenantId: command.deviceBoundTenantId,
        loginFlow: command.loginFlow
      })
    }

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

  private isPdaLogin(terminal?: string): boolean {
    return (terminal || 'WEB').toUpperCase() === 'PDA'
  }
}
