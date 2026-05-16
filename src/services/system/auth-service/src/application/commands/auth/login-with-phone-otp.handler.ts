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
import {
  PdaPrimaryLoginCompletionResult,
  PdaPrimaryLoginCompletionService
} from '../../services/pda-primary-login-completion.service'
import { PhoneOtpLoginService } from '../../services/phone-otp-login.service'
import { TerminalLoginPolicyService } from '../../services/terminal-login-policy.service'
import { TenantSessionAccessService } from '../../services/tenant-session-access.service'
import { AUTH_NO_AVAILABLE_ACCOUNT } from '../../../common/constants/exception-enums'
import { LoginWithPhoneOtpCommand } from './login-with-phone-otp.command'

export type LoginWithPhoneOtpNextStep = 'ACCOUNT_SELECTION_REQUIRED' | 'MFA_REQUIRED'

export interface LoginWithPhoneOtpAccountSelectionResult {
  userId: string
  method: LoginMethodEnum
  nextStep: 'ACCOUNT_SELECTION_REQUIRED'
  accounts: AccountCandidateSummary[]
}

export type LoginWithPhoneOtpResult =
  | LoginWithPhoneOtpAccountSelectionResult
  | PdaPrimaryLoginCompletionResult

@CommandHandler(LoginWithPhoneOtpCommand)
// Orchestrates phone OTP login after enforcing terminal-level login flow policy.
export class LoginWithPhoneOtpHandler
  implements ICommandHandler<LoginWithPhoneOtpCommand, LoginWithPhoneOtpResult>
{
  constructor(
    private readonly phoneOtpLoginService: PhoneOtpLoginService,
    private readonly authAuditService: AuthAuditService,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort,
    private readonly tenantSessionAccessService: TenantSessionAccessService,
    private readonly terminalLoginPolicyService: TerminalLoginPolicyService,
    private readonly pdaPrimaryLoginCompletionService?: PdaPrimaryLoginCompletionService
  ) {}

  async execute(command: LoginWithPhoneOtpCommand): Promise<LoginWithPhoneOtpResult> {
    await this.terminalLoginPolicyService.assertFlowAllowed(
      command.terminal || 'WEB',
      TerminalLoginFlow.PhoneOtp
    )

    const userId = await this.phoneOtpLoginService.authenticate(command.phone, command.otp)

    if (this.isPdaLogin(command.terminal)) {
      return this.pdaPrimaryLoginCompletionService!.complete({
        userId,
        loginMethod: LoginMethodEnum.PhoneOtp,
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
      method: LoginMethodEnum.PhoneOtp,
      nextStep: 'ACCOUNT_SELECTION_REQUIRED',
      accounts
    }
  }

  private isPdaLogin(terminal?: string): boolean {
    return (terminal || 'WEB').toUpperCase() === 'PDA'
  }
}
