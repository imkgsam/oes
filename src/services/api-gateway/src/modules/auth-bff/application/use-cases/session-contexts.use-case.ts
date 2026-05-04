import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { IdentityQueryGrpcAdapter } from '../../infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from '../../infrastructure/downstream/tenant-org-service/tenant-org-query-grpc.adapter'
import {
  SessionContextListViewModel,
  SessionContextOptionViewModel
} from '../../interfaces/http/view-models/session-context-switch.view-model'
import { getAuthenticatedSelfContext } from './self-security-context'

@Injectable()
// Lists the authenticated user's available account contexts for post-login switching.
export class SessionContextsUseCase {
  constructor(
    private readonly identityAdapter: IdentityQueryGrpcAdapter,
    private readonly tenantOrgAdapter?: TenantOrgQueryGrpcAdapter
  ) {}

  async execute(source: DownstreamRequestSource): Promise<SessionContextListViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.identityAdapter.getAccountsByUserId(self.userId, source)
    const tenantMap = await this.loadTenants(result.accounts ?? [], source)

    const items = (result.accounts ?? [])
      .filter((account) => normalize(account.accountId))
      .filter((account) => {
        const scopeLevel = normalizeScopeLevel(account.scopeLevel)
        const tenantId = normalize(account.tenantId)
        return scopeLevel === 'SYSTEM' || (tenantId ? tenantMap.get(tenantId)?.isActive === true : false)
      })
      .map<SessionContextOptionViewModel>((account) => {
        const accountId = normalize(account.accountId)!
        const tenantId = normalize(account.tenantId) ?? null
        const scopeLevel = normalizeScopeLevel(account.scopeLevel)

        return {
          accountId,
          scopeLevel,
          displayName: normalize(account.displayName),
          tenantId,
          tenantName: tenantId ? tenantMap.get(tenantId)?.name ?? null : null,
          isCurrent: accountId === self.accountId
        }
      })
      .sort(compareContextOptions)

    return { items }
  }

  private async loadTenants(
    accounts: Array<{ tenantId?: string | undefined }>,
    source: DownstreamRequestSource
  ): Promise<Map<string, { isActive: boolean; name: string | null }>> {
    const tenantIds = [...new Set(accounts.map((account) => normalize(account.tenantId)).filter(Boolean))] as string[]
    const tenantEntries = await Promise.all(
      tenantIds.map(async (tenantId) => {
        const result = await this.requireTenantOrgAdapter().getTenantById(tenantId, source)
        return [
          tenantId,
          {
            isActive: result.tenant?.isActive === true,
            name: normalize(result.tenant?.name) ?? null
          }
        ] as const
      })
    )

    return new Map(tenantEntries)
  }

  private requireTenantOrgAdapter(): TenantOrgQueryGrpcAdapter {
    if (!this.tenantOrgAdapter) {
      throw new Error('tenant-org query adapter is unavailable')
    }

    return this.tenantOrgAdapter
  }
}

function compareContextOptions(a: SessionContextOptionViewModel, b: SessionContextOptionViewModel): number {
  if (a.isCurrent !== b.isCurrent) {
    return a.isCurrent ? -1 : 1
  }

  if (a.scopeLevel !== b.scopeLevel) {
    return a.scopeLevel === 'SYSTEM' ? -1 : 1
  }

  const left = `${a.tenantName ?? ''} ${a.displayName ?? ''}`.trim().toLowerCase()
  const right = `${b.tenantName ?? ''} ${b.displayName ?? ''}`.trim().toLowerCase()
  return left.localeCompare(right)
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeScopeLevel(scopeLevel?: string): 'SYSTEM' | 'TENANT' {
  return scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
}
