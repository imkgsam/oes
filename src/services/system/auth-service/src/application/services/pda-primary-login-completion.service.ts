import { Injectable } from '@nestjs/common'
import { LoginMethodEnum } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AccountSessionEstablishmentService,
  EstablishedAccountSession
} from './account-session-establishment.service'
import {
  LoginMfaFactorOption,
  LoginMfaOrchestrationService
} from './mfa/login-mfa-orchestration.service'
import { PdaAccountResolutionService } from './pda-account-resolution.service'
import { TenantSessionAccessService } from './tenant-session-access.service'
import { AUTH_TERMINAL_ACCESS_DENIED } from '../../common/constants/exception-enums'
import { TenantMfaFactor } from '../../domain/entities/tenant-mfa-policy.entity'

export interface PdaPrimaryLoginCompletionInput {
  userId: string
  loginMethod: LoginMethodEnum
  deviceId?: string
  deviceName?: string
  userAgent?: string
  ipAddress?: string
  terminalDeviceId?: string
  deviceBoundTenantId?: string
  loginFlow?: string
}

export interface PdaPrimaryLoginMfaRequiredResult {
  nextStep: 'MFA_REQUIRED'
  userId: string
  method: LoginMethodEnum
  challengeId: string
  scenario: 'LOGIN' | 'NEW_DEVICE_LOGIN'
  defaultFactor: TenantMfaFactor
  availableFactors: LoginMfaFactorOption[]
  factorChallengeId?: string
  destination?: string
  expiresAt?: string
  terminal: string
  allowedTerminals: string[]
  accounts: []
}

export type PdaPrimaryLoginCompletionResult =
  | EstablishedAccountSession
  | PdaPrimaryLoginMfaRequiredResult

// Completes PDA primary authentication by resolving the device-bound account and then reusing the selected-account MFA/session path.
@Injectable()
export class PdaPrimaryLoginCompletionService {
  constructor(
    private readonly pdaAccountResolutionService: PdaAccountResolutionService,
    private readonly loginMfaOrchestrationService: LoginMfaOrchestrationService,
    private readonly accountSessionEstablishmentService: AccountSessionEstablishmentService,
    private readonly tenantSessionAccessService: TenantSessionAccessService
  ) {}

  // Resolves the PDA-bound account and either creates the session or returns a terminal-scoped MFA challenge.
  async complete(input: PdaPrimaryLoginCompletionInput): Promise<PdaPrimaryLoginCompletionResult> {
    if (!input.deviceBoundTenantId?.trim()) {
      throw ExceptionFactory.domain(AUTH_TERMINAL_ACCESS_DENIED, {
        reasonCode: 'PDA_DEVICE_BOUND_TENANT_REQUIRED',
        userId: input.userId,
        terminal: 'PDA'
      })
    }

    const resolved = await this.pdaAccountResolutionService.resolve({
      userId: input.userId,
      deviceBoundTenantId: input.deviceBoundTenantId
    })
    const account = resolved.account
    if (account.scopeLevel === 'TENANT') {
      await this.tenantSessionAccessService.assertAccountCanEstablishSession({
        accountId: account.accountId,
        tenantId: account.tenantId,
        scopeLevel: account.scopeLevel
      })
    }

    const challenge = await this.loginMfaOrchestrationService.resolveChallengeForSelectedAccount({
      userId: input.userId,
      accountId: account.accountId,
      tenantId: account.tenantId,
      scopeLevel: account.scopeLevel,
      displayName: account.displayName,
      loginMethod: input.loginMethod,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      terminal: 'PDA',
      terminalDeviceId: input.terminalDeviceId,
      deviceBoundTenantId: input.deviceBoundTenantId,
      loginFlow: input.loginFlow
    })

    if (challenge) {
      return {
        nextStep: 'MFA_REQUIRED',
        userId: input.userId,
        method: input.loginMethod,
        challengeId: challenge.challengeId,
        scenario: challenge.scenario,
        defaultFactor: challenge.defaultFactor,
        availableFactors: challenge.availableFactors,
        factorChallengeId: challenge.factorChallengeId,
        destination: challenge.destination,
        expiresAt: challenge.expiresAt,
        terminal: 'PDA',
        allowedTerminals: resolved.terminalAccess.effectiveAllowedTerminals,
        accounts: []
      }
    }

    return this.accountSessionEstablishmentService.establish({
      userId: input.userId,
      account,
      loginMethod: input.loginMethod,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      terminal: 'PDA',
      terminalDeviceId: input.terminalDeviceId,
      deviceBoundTenantId: input.deviceBoundTenantId,
      loginFlow: input.loginFlow
    })
  }
}
