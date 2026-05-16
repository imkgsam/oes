import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { IDENTITY_SERVICE, PERMISSION_SERVICE } from '@oes/common/constants'
import {
  IdentityAccountSummary,
  IIdentityServicePort
} from '../../ports/identity-service.port'
import {
  AccountSessionEstablishmentService,
  EstablishedAccountSession
} from '../../services/account-session-establishment.service'
import {
  AUTH_ACCOUNT_DISABLED,
  AUTH_ACCOUNT_NOT_FOUND,
  AUTH_ACCOUNT_OWNER_MISMATCH,
  AUTH_TERMINAL_ACCESS_DENIED
} from '../../../common/constants/exception-enums'
import {
  LoginMfaFactorOption,
  LoginMfaOrchestrationService
} from '../../services/mfa/login-mfa-orchestration.service'
import { TenantSessionAccessService } from '../../services/tenant-session-access.service'
import { TenantMfaFactor } from '../../../domain/entities/tenant-mfa-policy.entity'
import { SelectAccountCommand } from './select-account.command'
import { IPermissionServicePort } from '../../ports'
import { AuthAuditService } from '../../services/auth-audit.service'

export type SelectAccountSuccessResult = EstablishedAccountSession

export interface SelectAccountMfaRequiredResult {
  status: 'MFA_REQUIRED'
  userId: string
  accountId: string
  tenantId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
  challengeId: string
  scenario: 'LOGIN' | 'NEW_DEVICE_LOGIN'
  defaultFactor: TenantMfaFactor
  availableFactors: LoginMfaFactorOption[]
  factorChallengeId?: string
  destination?: string
  expiresAt?: string
  displayName?: string
  terminal: string
  allowedTerminals: string[]
  passwordSetupRequired: false
}

export type SelectAccountResult = SelectAccountMfaRequiredResult | SelectAccountSuccessResult

@CommandHandler(SelectAccountCommand)
export class SelectAccountHandler
  implements ICommandHandler<SelectAccountCommand, SelectAccountResult>
{
  constructor(
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort,
    private readonly accountSessionEstablishmentService: AccountSessionEstablishmentService,
    private readonly loginMfaOrchestrationService: LoginMfaOrchestrationService,
    private readonly tenantSessionAccessService: TenantSessionAccessService,
    @Inject(PERMISSION_SERVICE)
    private readonly permissionService: IPermissionServicePort,
    private readonly authAuditService?: AuthAuditService
  ) {}

  async execute(command: SelectAccountCommand): Promise<SelectAccountResult> {
    const account = await this.identityService.getAccountById(command.accountId)
    this.ensureAccountIsUsable(command.userId, command.accountId, account)
    await this.ensureTenantScopeCanStartSession(account)
    const terminalAccess = await this.permissionService.resolveAccountTerminalAccess({
      accountId: account.accountId,
      tenantId: account.tenantId,
      scopeLevel: account.scopeLevel,
      terminal: command.terminal || 'WEB'
    })
    if (!terminalAccess.allowed) {
      this.authAuditService?.emitTerminalAccessDenied({
        accountId: account.accountId,
        userId: command.userId,
        tenantId: account.tenantId,
        scopeLevel: account.scopeLevel,
        terminal: command.terminal || 'WEB',
        reasonCode: terminalAccess.reasonCode,
        phase: 'LOGIN'
      })
      throw ExceptionFactory.domain(AUTH_TERMINAL_ACCESS_DENIED, {
        accountId: account.accountId,
        tenantId: account.tenantId,
        scopeLevel: account.scopeLevel,
        terminal: command.terminal || 'WEB',
        reasonCode: terminalAccess.reasonCode
      })
    }
    const challenge = await this.loginMfaOrchestrationService.resolveChallengeForSelectedAccount({
      userId: command.userId,
      accountId: account.accountId,
      tenantId: account.tenantId,
      scopeLevel: account.scopeLevel,
      displayName: account.displayName,
      loginMethod: command.loginMethod,
      deviceId: command.deviceId,
      deviceName: command.deviceName,
      userAgent: command.userAgent,
      ipAddress: command.ipAddress,
      terminal: command.terminal || 'WEB',
      terminalDeviceId: command.terminalDeviceId,
      deviceBoundTenantId: command.deviceBoundTenantId,
      loginFlow: command.loginFlow
    })
    if (challenge) {
      return {
        status: 'MFA_REQUIRED',
        userId: command.userId,
        accountId: account.accountId,
        tenantId: account.tenantId,
        scopeLevel: account.scopeLevel,
        displayName: account.displayName,
        challengeId: challenge.challengeId,
        scenario: challenge.scenario,
        defaultFactor: challenge.defaultFactor,
        availableFactors: challenge.availableFactors,
        factorChallengeId: challenge.factorChallengeId,
        destination: challenge.destination,
        expiresAt: challenge.expiresAt,
        terminal: command.terminal || 'WEB',
        allowedTerminals: terminalAccess.effectiveAllowedTerminals,
        passwordSetupRequired: false
      }
    }

    return this.accountSessionEstablishmentService.establish({
      userId: command.userId,
      account,
      loginMethod: command.loginMethod,
      currentSessionId: command.currentSessionId,
      deviceId: command.deviceId,
      deviceName: command.deviceName,
      userAgent: command.userAgent,
      ipAddress: command.ipAddress,
      terminal: command.terminal || 'WEB',
      terminalDeviceId: command.terminalDeviceId,
      deviceBoundTenantId: command.deviceBoundTenantId,
      loginFlow: command.loginFlow
    })
  }

  private ensureAccountIsUsable(
    userId: string,
    accountId: string,
    account: IdentityAccountSummary | null
  ) {
    if (!account) {
      throw ExceptionFactory.domain(AUTH_ACCOUNT_NOT_FOUND, { accountId })
    }

    if (account.userId !== userId) {
      throw ExceptionFactory.domain(AUTH_ACCOUNT_OWNER_MISMATCH, {
        accountId,
        userId,
        ownerUserId: account.userId
      })
    }

    if (!account.isEnabled) {
      throw ExceptionFactory.domain(AUTH_ACCOUNT_DISABLED, {
        accountId,
        userId
      })
    }

    if (account.scopeLevel === 'SYSTEM' && account.tenantId) {
      throw ExceptionFactory.domain(AUTH_ACCOUNT_DISABLED, {
        accountId,
        userId,
        reason: 'system account must not bind tenant'
      })
    }

    if (account.scopeLevel === 'TENANT' && !account.tenantId) {
      throw ExceptionFactory.domain(AUTH_ACCOUNT_DISABLED, {
        accountId,
        userId,
        reason: 'tenant account must bind tenant'
      })
    }
  }

  /** ensureTenantScopeCanStartSession blocks inactive tenant accounts before MFA or session creation starts. */
  private async ensureTenantScopeCanStartSession(account: IdentityAccountSummary): Promise<void> {
    if (account.scopeLevel === 'SYSTEM') {
      return
    }

    await this.tenantSessionAccessService.assertAccountCanEstablishSession({
      accountId: account.accountId,
      tenantId: account.tenantId,
      scopeLevel: account.scopeLevel
    })
  }
}
