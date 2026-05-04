import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TENANT_LIFECYCLE_ACCESS_PORT } from '../../common/constants/injection-tokens'
import {
  TenantLifecycleAccessPort,
  TenantLifecycleStatus
} from '../ports/tenant-lifecycle-access.port'
import { AccountCandidateSummary } from '../ports/identity-service.port'
import { AUTH_TENANT_NOT_ACTIVE } from '../../common/constants/exception-enums'

interface TenantScopedAccessInput {
  accountId?: string
  sessionId?: string
  tenantId?: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
}

/** TenantSessionAccessService enforces tenant lifecycle truth before auth sessions are created or reused. */
@Injectable()
export class TenantSessionAccessService {
  constructor(
    @Inject(TENANT_LIFECYCLE_ACCESS_PORT)
    private readonly tenantLifecycleAccessPort: TenantLifecycleAccessPort
  ) {}

  async assertAccountCanEstablishSession(input: TenantScopedAccessInput): Promise<void> {
    await this.assertTenantActive(input)
  }

  async assertSessionCanContinue(input: TenantScopedAccessInput): Promise<void> {
    await this.assertTenantActive(input)
  }

  /** filterActiveAccountCandidates keeps identity account facts while applying tenant-org lifecycle truth. */
  async filterActiveAccountCandidates(
    accounts: AccountCandidateSummary[]
  ): Promise<AccountCandidateSummary[]> {
    const checks = await Promise.all(
      accounts.map(async (account) => ({
        account,
        active: await this.isCandidateTenantActive(account)
      }))
    )

    return checks.filter((check) => check.active).map((check) => check.account)
  }

  /** assertTenantActive treats tenant-org ACTIVE as the only tenant-scope admission state. */
  private async assertTenantActive(input: TenantScopedAccessInput): Promise<void> {
    if (input.scopeLevel === 'SYSTEM') {
      return
    }

    const tenantId = input.tenantId?.trim()
    if (!tenantId) {
      throw this.tenantNotActive(input, null)
    }

    const status = await this.tenantLifecycleAccessPort.getTenantStatus(tenantId)
    if (status !== 'ACTIVE') {
      throw this.tenantNotActive(input, status)
    }
  }

  /** tenantNotActive creates the stable auth-domain error for denied tenant lifecycle admission. */
  private tenantNotActive(input: TenantScopedAccessInput, status: TenantLifecycleStatus | null) {
    return ExceptionFactory.domain(AUTH_TENANT_NOT_ACTIVE, {
      accountId: input.accountId,
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      scopeLevel: input.scopeLevel,
      tenantStatus: status
    })
  }

  /** isCandidateTenantActive allows SYSTEM accounts and only ACTIVE tenant accounts into selection lists. */
  private async isCandidateTenantActive(account: AccountCandidateSummary): Promise<boolean> {
    if (account.scopeLevel === 'SYSTEM') {
      return !account.tenantId
    }

    const tenantId = account.tenantId?.trim()
    if (!tenantId) {
      return false
    }

    return (await this.tenantLifecycleAccessPort.getTenantStatus(tenantId)) === 'ACTIVE'
  }
}
