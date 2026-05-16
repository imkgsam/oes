import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { TerminalLoginFlow } from '@oes/common/auth'
import { PhonePasswordLoginRequestDto } from '@oes/common/dtos'
import { IDENTITY_SERVICE, LoginMethodEnum, LoginMethodType } from '@oes/common/constants'
import { ExceptionFactory, OESExceptionBase } from '@oes/common/exceptions'
import {
  AccountCandidateSummary,
  IIdentityServicePort
} from '../../ports/identity-service.port'
import { AuthAuditService } from '../../services/auth-audit.service'
import { LoginRiskThrottleService } from '../../services/login-risk-throttle.service'
import {
  PdaPrimaryLoginCompletionResult,
  PdaPrimaryLoginCompletionService
} from '../../services/pda-primary-login-completion.service'
import { TerminalLoginPolicyService } from '../../services/terminal-login-policy.service'
import { TenantSessionAccessService } from '../../services/tenant-session-access.service'
import {
  AUTH_LOGIN_TEMPORARILY_LOCKED,
  AUTH_NO_AVAILABLE_ACCOUNT
} from '../../../common/constants/exception-enums'
import { AuthStrategyFactory } from '../../../domain/services/strategies/auth-strategies.factory'
import { normalizeAuthDeviceContext } from '../../services/auth-device-context'
import { LoginWithPhonePasswordCommand } from './login-with-phone-password.command'

export type LoginWithPhonePasswordNextStep = 'ACCOUNT_SELECTION_REQUIRED' | 'MFA_REQUIRED'

export interface LoginWithPhonePasswordAccountSelectionResult {
  userId: string
  method: LoginMethodEnum
  nextStep: 'ACCOUNT_SELECTION_REQUIRED'
  accounts: AccountCandidateSummary[]
}

export type LoginWithPhonePasswordResult =
  | LoginWithPhonePasswordAccountSelectionResult
  | PdaPrimaryLoginCompletionResult

@CommandHandler(LoginWithPhonePasswordCommand)
// Orchestrates phone-password login after enforcing terminal-level login flow policy.
export class LoginWithPhonePasswordHandler
  implements ICommandHandler<LoginWithPhonePasswordCommand, LoginWithPhonePasswordResult>
{
  constructor(
    private readonly authStrategyFactory: AuthStrategyFactory,
    private readonly authAuditService: AuthAuditService,
    private readonly loginRiskThrottleService: LoginRiskThrottleService,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort,
    private readonly tenantSessionAccessService: TenantSessionAccessService,
    private readonly terminalLoginPolicyService: TerminalLoginPolicyService,
    private readonly pdaPrimaryLoginCompletionService?: PdaPrimaryLoginCompletionService
  ) {}

  async execute(command: LoginWithPhonePasswordCommand): Promise<LoginWithPhonePasswordResult> {
    await this.terminalLoginPolicyService.assertFlowAllowed(
      command.terminal || 'WEB',
      TerminalLoginFlow.PhonePassword
    )

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
        const user = await this.identityService.getUserByPhone(command.phone)
        const deviceContext = normalizeAuthDeviceContext({
          deviceName: command.deviceName,
          userAgent: command.userAgent,
          ipAddress: command.ipAddress
        })

        this.authAuditService.emitLoginFailed(command.phone, 'INVALID_CREDENTIALS', {
          method: LoginMethodEnum.PhonePassword,
          userId: user?.userId,
          deviceName: deviceContext.deviceName,
          userAgent: deviceContext.userAgent,
          ipAddress: deviceContext.ipAddress,
          platform: deviceContext.platform,
          browser: deviceContext.browser
        })
      }

      throw error
    }

    await this.loginRiskThrottleService.clearPasswordLoginFailures(
      LoginMethodType.PHONE,
      command.phone
    )

    if (this.isPdaLogin(command.terminal)) {
      return this.pdaPrimaryLoginCompletionService!.complete({
        userId,
        loginMethod: LoginMethodEnum.PhonePassword,
        deviceName: command.deviceName,
        userAgent: command.userAgent,
        ipAddress: command.ipAddress,
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

  private isPdaLogin(terminal?: string): boolean {
    return (terminal || 'WEB').toUpperCase() === 'PDA'
  }
}
