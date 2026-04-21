import { Inject, Injectable } from '@nestjs/common'
import { CommonJwtService } from '@oes/common/auth'
import { ExceptionFactory } from '@oes/common/exceptions'
import { LoginMethodEnum, MfaType, REPO } from '../../../common/constants'
import { AUTH_MFA_LOGIN_METHOD_UNAVAILABLE } from '../../../common/constants/exception-enums'
import {
  TenantMfaFactor,
  TenantMfaPolicyEntity
} from '../../../domain/entities/tenant-mfa-policy.entity'
import { TenantMfaPolicyRepository } from '../../../domain/repositories/tenant-mfa-policy.repository'
import { EmailOtpMfaChallengeService } from './email-otp-mfa-challenge.service'
import { MfaChallengeVerificationService } from './mfa-challenge-verification.service'
import { MfaBindingManagementService } from './mfa-binding-management.service'
import { PhoneOtpMfaChallengeService } from './phone-otp-mfa-challenge.service'

export interface LoginMfaFactorOption {
  type: TenantMfaFactor
  label: string
}

export interface SelectedAccountMfaChallenge {
  challengeId: string
  scenario: 'LOGIN'
  defaultFactor: TenantMfaFactor
  availableFactors: LoginMfaFactorOption[]
  factorChallengeId?: string
  destination?: string
  expiresAt?: string
}

export interface SelectedAccountMfaInput {
  accountId: string
  displayName?: string
  ipAddress?: string
  loginMethod: LoginMethodEnum
  scopeLevel: 'SYSTEM' | 'TENANT'
  tenantId: null | string
  userAgent?: string
  userId: string
}

export interface LoginMfaFlowPayload {
  aid: string
  displayName?: string
  iat?: number
  ipAddress?: string
  loginMethod: LoginMethodEnum
  scenario: 'LOGIN'
  scopeLevel: 'SYSTEM' | 'TENANT'
  sub: string
  tid?: string
  tokenType: 'mfa_flow'
  userAgent?: string
}

// Orchestrates login-scene MFA after account selection so tenant policy is resolved against one concrete account context.
@Injectable()
export class LoginMfaOrchestrationService {
  constructor(
    @Inject(REPO.TENANT_MFA_POLICY)
    private readonly tenantMfaPolicyRepository: TenantMfaPolicyRepository,
    private readonly mfaBindingManagementService: MfaBindingManagementService,
    private readonly emailOtpMfaChallengeService: EmailOtpMfaChallengeService,
    private readonly phoneOtpMfaChallengeService: PhoneOtpMfaChallengeService,
    private readonly mfaChallengeVerificationService: MfaChallengeVerificationService,
    private readonly jwtService: CommonJwtService
  ) {}

  async resolveChallengeForSelectedAccount(
    input: SelectedAccountMfaInput
  ): Promise<null | SelectedAccountMfaChallenge> {
    if (input.scopeLevel !== 'TENANT' || !input.tenantId) {
      return null
    }

    const policy = await this.tenantMfaPolicyRepository.getTenantPolicy(input.tenantId)
    if (!policy.isLoginRequired()) {
      return null
    }

    const availableFactors = await this.resolveAvailableFactors(input.userId, policy)
    if (availableFactors.length === 0) {
      throw ExceptionFactory.domain(AUTH_MFA_LOGIN_METHOD_UNAVAILABLE, {
        userId: input.userId,
        tenantId: input.tenantId,
        accountId: input.accountId
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
        scenario: 'LOGIN',
        tokenType: 'mfa_flow',
        userAgent: input.userAgent,
        ipAddress: input.ipAddress
      },
      { expiresIn: '10m' }
    )

    const defaultFactor = availableFactors[0].type
    const factorChallenge = await this.requestFactorChallenge(challengeId, defaultFactor)

    return {
      challengeId,
      scenario: 'LOGIN',
      defaultFactor,
      availableFactors,
      factorChallengeId: factorChallenge.factorChallengeId,
      destination: factorChallenge.destination,
      expiresAt: factorChallenge.expiresAt
    }
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
      throw ExceptionFactory.domain(AUTH_MFA_LOGIN_METHOD_UNAVAILABLE, {
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
    policy: TenantMfaPolicyEntity
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
          label: labelForFactor(factorPolicy.factor)
        }
      })
      .filter((value): value is LoginMfaFactorOption => Boolean(value))
  }

  private async assertFactorAllowed(
    flow: LoginMfaFlowPayload,
    factor: TenantMfaFactor
  ): Promise<void> {
    if (!flow.tid || flow.scopeLevel !== 'TENANT') {
      throw ExceptionFactory.domain(AUTH_MFA_LOGIN_METHOD_UNAVAILABLE, {
        userId: flow.sub,
        factor
      })
    }

    const policy = await this.tenantMfaPolicyRepository.getTenantPolicy(flow.tid)
    const allowedFactors = await this.resolveAvailableFactors(flow.sub, policy)
    if (!allowedFactors.some((item) => item.type === factor)) {
      throw ExceptionFactory.domain(AUTH_MFA_LOGIN_METHOD_UNAVAILABLE, {
        userId: flow.sub,
        factor,
        tenantId: flow.tid
      })
    }
  }
}

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
