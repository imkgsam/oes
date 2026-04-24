import { Injectable } from '@nestjs/common'
import { CommonJwtService } from '@oes/common/auth'
import { ExceptionFactory } from '@oes/common/exceptions'
import { AUTH_MFA_STEP_UP_REQUIRED } from '../../../common/constants/exception-enums'
import { TenantMfaScenario } from '../../../domain/entities/tenant-mfa-policy.entity'

export interface StepUpMfaGrantPayload {
  aid: string
  scenario: Exclude<TenantMfaScenario, 'LOGIN' | 'NEW_DEVICE_LOGIN'>
  sub: string
  scopeLevel: 'SYSTEM' | 'TENANT'
  tid?: string
  tokenType: 'mfa_step_up_grant'
}

// Issues and validates short-lived grants that authorize one protected self-service MFA scenario.
@Injectable()
export class StepUpMfaGrantService {
  constructor(private readonly jwtService: CommonJwtService) {}

  issueGrant(input: {
    accountId: string
    scenario: Exclude<TenantMfaScenario, 'LOGIN' | 'NEW_DEVICE_LOGIN'>
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }): { mfaGrantToken: string } {
    const mfaGrantToken = this.jwtService.signAccessToken(
      {
        sub: input.userId,
        aid: input.accountId,
        tid: input.tenantId,
        scopeLevel: input.scopeLevel,
        scenario: input.scenario,
        tokenType: 'mfa_step_up_grant'
      },
      { expiresIn: '3m' }
    )

    return { mfaGrantToken }
  }

  assertGrant(input: {
    accountId: string
    mfaGrantToken?: string
    scenario: Exclude<TenantMfaScenario, 'LOGIN' | 'NEW_DEVICE_LOGIN'>
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }): StepUpMfaGrantPayload {
    if (!input.mfaGrantToken) {
      throw this.createRequiredError(input)
    }

    const payload = this.jwtService.verify<StepUpMfaGrantPayload>(input.mfaGrantToken)
    if (
      payload.tokenType !== 'mfa_step_up_grant'
      || payload.sub !== input.userId
      || payload.aid !== input.accountId
      || payload.scopeLevel !== input.scopeLevel
      || (payload.tid ?? undefined) !== input.tenantId
      || payload.scenario !== input.scenario
    ) {
      throw this.createRequiredError(input)
    }

    return payload
  }

  private createRequiredError(input: {
    accountId: string
    scenario: Exclude<TenantMfaScenario, 'LOGIN' | 'NEW_DEVICE_LOGIN'>
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }) {
    return ExceptionFactory.domain(AUTH_MFA_STEP_UP_REQUIRED, {
      userId: input.userId,
      accountId: input.accountId,
      tenantId: input.tenantId,
      scopeLevel: input.scopeLevel,
      scenario: input.scenario
    })
  }
}
