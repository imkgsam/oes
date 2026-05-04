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
import { TenantSessionAccessService } from '../../services/tenant-session-access.service'
import {
  AUTH_LOGIN_TEMPORARILY_LOCKED,
  AUTH_NO_AVAILABLE_ACCOUNT
} from '../../../common/constants/exception-enums'
import { AuthStrategyFactory } from '../../../domain/services/strategies/auth-strategies.factory'
import { normalizeAuthDeviceContext } from '../../services/auth-device-context'
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
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort,
    private readonly tenantSessionAccessService: TenantSessionAccessService
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
        const user = await this.identityService.getUserByEmail(command.email)
        const deviceContext = normalizeAuthDeviceContext({
          deviceName: command.deviceName,
          userAgent: command.userAgent,
          ipAddress: command.ipAddress
        })

        this.authAuditService.emitLoginFailed(command.email, 'INVALID_CREDENTIALS', {
          method: LoginMethodEnum.EmailPassword,
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
      LoginMethodType.EMAIL,
      command.email
    )

    const accounts = await this.tenantSessionAccessService.filterActiveAccountCandidates(
      await this.identityService.getAvailableAccountsByUserId(userId)
    )
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
