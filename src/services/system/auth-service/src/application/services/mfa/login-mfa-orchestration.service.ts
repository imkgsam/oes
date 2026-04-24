import { Inject, Injectable } from '@nestjs/common'
import { CommonJwtService } from '@oes/common/auth'
import { ExceptionFactory } from '@oes/common/exceptions'
import { LoginMethodEnum, MfaType, REPO } from '../../../common/constants'
import {
  AUTH_MFA_INVALID_CODE,
  AUTH_MFA_LOGIN_METHOD_UNAVAILABLE
} from '../../../common/constants/exception-enums'
import {
  PlatformMfaPolicyEntity
} from '../../../domain/entities/platform-mfa-policy.entity'
import {
  TenantMfaFactor,
  TenantMfaScenario,
  TenantMfaPolicyEntity
} from '../../../domain/entities/tenant-mfa-policy.entity'
import { PlatformMfaPolicyRepository } from '../../../domain/repositories/platform-mfa-policy.repository'
import { TenantMfaPolicyRepository } from '../../../domain/repositories/tenant-mfa-policy.repository'
import { EmailOtpMfaChallengeService } from './email-otp-mfa-challenge.service'
import { MfaChallengeVerificationService } from './mfa-challenge-verification.service'
import { MfaBindingManagementService } from './mfa-binding-management.service'
import { PhoneOtpMfaChallengeService } from './phone-otp-mfa-challenge.service'
import { TrustedDeviceService } from '../trusted-device.service'

export interface LoginMfaFactorOption {
  type: TenantMfaFactor
  label: string
  priority: number
}

export interface SelectedAccountMfaChallenge {
  challengeId: string
  scenario: TenantMfaScenario
  defaultFactor: TenantMfaFactor
  availableFactors: LoginMfaFactorOption[]
  factorChallengeId?: string
  destination?: string
  expiresAt?: string
}

export interface SelectedAccountLoginFlowChallenge
  extends Omit<SelectedAccountMfaChallenge, 'scenario'> {
  scenario: 'LOGIN' | 'NEW_DEVICE_LOGIN'
}

export interface AccountMfaChallengeInput {
  accountId: string
  deviceId?: string
  deviceName?: string
  displayName?: string
  ipAddress?: string
  loginMethod?: LoginMethodEnum
  scenario: TenantMfaScenario
  scopeLevel: 'SYSTEM' | 'TENANT'
  tenantId: null | string
  userAgent?: string
  userId: string
}

export interface LoginMfaFlowPayload {
  aid: string
  deviceId?: string
  deviceName?: string
  displayName?: string
  iat?: number
  ipAddress?: string
  loginMethod?: LoginMethodEnum
  scenario: TenantMfaScenario
  scopeLevel: 'SYSTEM' | 'TENANT'
  sub: string
  tid?: string
  tokenType: 'mfa_flow'
  userAgent?: string
}

// Orchestrates one account-scoped MFA challenge flow so login and step-up scenarios reuse the same factor resolution path.
@Injectable()
export class LoginMfaOrchestrationService {
  constructor(
    @Inject(REPO.PLATFORM_MFA_POLICY)
    private readonly platformMfaPolicyRepository: PlatformMfaPolicyRepository,
    @Inject(REPO.TENANT_MFA_POLICY)
    private readonly tenantMfaPolicyRepository: TenantMfaPolicyRepository,
    private readonly mfaBindingManagementService: MfaBindingManagementService,
    private readonly emailOtpMfaChallengeService: EmailOtpMfaChallengeService,
    private readonly phoneOtpMfaChallengeService: PhoneOtpMfaChallengeService,
    private readonly mfaChallengeVerificationService: MfaChallengeVerificationService,
    private readonly jwtService: CommonJwtService,
    private readonly trustedDeviceService: TrustedDeviceService
  ) {}

  async resolveChallengeForSelectedAccount(
    input: Omit<AccountMfaChallengeInput, 'scenario'>
  ): Promise<null | SelectedAccountLoginFlowChallenge> {
    if (input.loginMethod === LoginMethodEnum.ContextSwitch) {
      return null
    }

    const policy = await this.resolvePolicy(input.scopeLevel, input.tenantId)
    if (!policy) {
      return null
    }
    const selectedScenario = await this.resolveSelectedAccountScenario(input, policy)
    if (!selectedScenario) {
      return null
    }

    const challenge = await this.buildChallengeForScenario(
      {
        ...input,
        scenario: selectedScenario
      },
      policy
    )

    if (!challenge) {
      return null
    }

    return {
      ...challenge,
      scenario: selectedScenario
    }
  }

  async resolveChallengeForAccount(
    input: AccountMfaChallengeInput
  ): Promise<null | SelectedAccountMfaChallenge> {
    const policy = await this.resolvePolicy(input.scopeLevel, input.tenantId)
    if (!policy) {
      return null
    }
    return this.buildChallengeForScenario(input, policy)
  }

  async requestFactorChallenge(
    challengeId: string,
    factor: TenantMfaFactor
  ): Promise<{
    factorChallengeId?: string
    destination?: string
    expiresAt?: string
  }> {
    const flow = await this.verifyFlowToken(challengeId)
    await this.assertFactorAllowed(flow, factor)

    switch (factor) {
      case MfaType.EMAIL_OTP: {
        const challenge = await this.emailOtpMfaChallengeService.createChallenge(flow.sub)
        return {
          factorChallengeId: challenge.challengeId,
          destination: challenge.destination,
          expiresAt: challenge.expiresAt.toISOString()
        }
      }
      case MfaType.SMS_OTP: {
        const challenge = await this.phoneOtpMfaChallengeService.createChallenge(flow.sub)
        return {
          factorChallengeId: challenge.challengeId,
          destination: challenge.destination,
          expiresAt: challenge.expiresAt.toISOString()
        }
      }
      default:
        return {}
    }
  }

  async verifySelectedFactor(input: {
    challengeId: string
    factor: TenantMfaFactor
    code: string
    factorChallengeId?: string
  }): Promise<LoginMfaFlowPayload> {
    const flow = await this.verifyFlowToken(input.challengeId)
    await this.assertFactorAllowed(flow, input.factor)
    const isValid = await this.mfaChallengeVerificationService.verifySelectedFactor({
      userId: flow.sub,
      factor: input.factor,
      code: input.code,
      factorChallengeId: input.factorChallengeId
    })

    if (!isValid) {
      throw ExceptionFactory.domain(AUTH_MFA_INVALID_CODE, {
        userId: flow.sub,
        factor: input.factor
      })
    }

    return flow
  }

  async verifyFlowToken(challengeId: string): Promise<LoginMfaFlowPayload> {
    return this.jwtService.verify<LoginMfaFlowPayload>(challengeId)
  }

  private async resolveAvailableFactors(
    userId: string,
    policy: ManagedMfaPolicy
  ): Promise<LoginMfaFactorOption[]> {
    const bindings = await this.mfaBindingManagementService.listBindings(userId)
    const bindingMap = new Map(bindings.map((binding) => [binding.type, binding]))

    return policy
      .getFactors()
      .filter((factorPolicy) => factorPolicy.enabled)
      .map((factorPolicy) => {
        const binding = bindingMap.get(factorPolicy.factor)
        if (!binding || !binding.enabled || !binding.available) {
          return null
        }
        return {
          type: factorPolicy.factor,
          label: labelForFactor(factorPolicy.factor),
          priority: factorPolicy.priority
        }
      })
      .filter((value): value is LoginMfaFactorOption => Boolean(value))
  }

  private async resolveSelectedAccountScenario(
    input: Omit<AccountMfaChallengeInput, 'scenario'>,
    policy: ManagedMfaPolicy
  ): Promise<null | 'LOGIN' | 'NEW_DEVICE_LOGIN'> {
    if (
      policy.isScenarioRequired('NEW_DEVICE_LOGIN') &&
      !(await this.trustedDeviceService.isTrustedDevice({
        userId: input.userId,
        scopeLevel: input.scopeLevel,
        tenantId: input.tenantId,
        deviceId: input.deviceId
      }))
    ) {
      return 'NEW_DEVICE_LOGIN'
    }

    return policy.isScenarioRequired('LOGIN') ? 'LOGIN' : null
  }

  private async buildChallengeForScenario(
    input: AccountMfaChallengeInput,
    policy: ManagedMfaPolicy
  ): Promise<null | SelectedAccountMfaChallenge> {
    if (!policy.isScenarioRequired(input.scenario)) {
      return null
    }

    const availableFactors = await this.resolveAvailableFactors(input.userId, policy)
    if (availableFactors.length === 0) {
      throw ExceptionFactory.domain(AUTH_MFA_LOGIN_METHOD_UNAVAILABLE, {
        userId: input.userId,
        tenantId: input.tenantId,
        accountId: input.accountId,
        scenario: input.scenario
      })
    }

    const challengeId = this.jwtService.signAccessToken(
      {
        sub: input.userId,
        aid: input.accountId,
        tid: input.tenantId,
        scopeLevel: input.scopeLevel,
        displayName: input.displayName,
        loginMethod: input.loginMethod,
        scenario: input.scenario,
        tokenType: 'mfa_flow',
        deviceId: input.deviceId,
        deviceName: input.deviceName,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress
      },
      { expiresIn: '10m' }
    )

    return {
      challengeId,
      scenario: input.scenario,
      defaultFactor: availableFactors[0].type,
      availableFactors
    }
  }

  private async assertFactorAllowed(
    flow: LoginMfaFlowPayload,
    factor: TenantMfaFactor
  ): Promise<void> {
    const policy = await this.resolvePolicy(flow.scopeLevel, flow.tid)
    if (!policy) {
      throw ExceptionFactory.domain(AUTH_MFA_LOGIN_METHOD_UNAVAILABLE, {
        userId: flow.sub,
        factor
      })
    }
    const allowedFactors = await this.resolveAvailableFactors(flow.sub, policy)
    if (!allowedFactors.some((item) => item.type === factor)) {
      throw ExceptionFactory.domain(AUTH_MFA_LOGIN_METHOD_UNAVAILABLE, {
        userId: flow.sub,
        factor,
        tenantId: flow.tid,
        scopeLevel: flow.scopeLevel
      })
    }
  }

  private async resolvePolicy(
    scopeLevel: 'SYSTEM' | 'TENANT',
    tenantId: null | string
  ): Promise<ManagedMfaPolicy | null> {
    if (scopeLevel === 'SYSTEM') {
      return this.platformMfaPolicyRepository.getPlatformPolicy()
    }

    if (!tenantId) {
      return null
    }

    return this.tenantMfaPolicyRepository.getTenantPolicy(tenantId)
  }
}

type ManagedMfaPolicy = Pick<
  PlatformMfaPolicyEntity | TenantMfaPolicyEntity,
  'getFactors' | 'isScenarioRequired'
>

function labelForFactor(factor: TenantMfaFactor): string {
  switch (factor) {
    case MfaType.EMAIL_OTP:
      return '邮箱验证码'
    case MfaType.SMS_OTP:
      return '手机验证码'
    case MfaType.TOTP:
      return '认证器 App'
    case MfaType.BACKUP_CODE:
      return '恢复码'
  }
}
