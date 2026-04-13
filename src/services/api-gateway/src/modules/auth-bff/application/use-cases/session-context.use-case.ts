import { Injectable, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { IdentityQueryGrpcAdapter } from '../../infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { SessionContextViewModel } from '../../interfaces/http/view-models/session-context.view-model'
import { getAuthenticatedSelfContext } from './self-security-context'

const DEFAULT_HOME_PATH = '/workbench/home'
const SYSTEM_HOME_PATH = '/platform/home'
const TENANT_DEFAULT_ENTRY = 'workbench.home'
const SYSTEM_DEFAULT_ENTRY = 'platform.home'

@Injectable()
// Builds the minimal authenticated shell context needed for the front-end to enter the workbench.
export class SessionContextUseCase {
  constructor(private readonly identityAdapter: IdentityQueryGrpcAdapter) {}

  async execute(source: DownstreamRequestSource): Promise<SessionContextViewModel> {
    const self = getAuthenticatedSelfContext(source)

    if (!self.accountId) {
      throw new UnauthorizedException('authenticated session context is missing account id')
    }

    const accountResult = await this.identityAdapter.getAccountById(self.accountId, source)
    const accountScope = normalizeScopeLevel(accountResult.account?.scopeLevel ?? self.scopeLevel)
    const tenantId = normalize(accountResult.account?.tenantId) ?? self.tenantId

    if (accountScope === 'TENANT' && !tenantId) {
      throw new UnauthorizedException('tenant account context is missing tenant id')
    }

    if (accountScope === 'SYSTEM' && tenantId) {
      throw new UnauthorizedException('system account context must not be bound to tenant id')
    }

    const tenantResult =
      accountScope === 'TENANT' && tenantId
        ? await this.identityAdapter.getTenantById(tenantId, source)
        : null

    const accountName = normalize(accountResult.account?.displayName)
    const tenantName = normalize(tenantResult?.tenant?.name)
    const defaultEntry = accountScope === 'SYSTEM' ? SYSTEM_DEFAULT_ENTRY : TENANT_DEFAULT_ENTRY

    return {
      operator: {
        userId: self.userId,
        displayName: accountName,
        scopeLevel: accountScope
      },
      account: {
        accountId: self.accountId,
        name: accountName,
        scopeLevel: accountScope
      },
      tenant:
        accountScope === 'TENANT' && tenantId
          ? {
              tenantId,
              name: tenantName
            }
          : null,
      org: null,
      navigation: {
        defaultEntry,
        visibleEntries: [defaultEntry],
        defaultHomePath: accountScope === 'SYSTEM' ? SYSTEM_HOME_PATH : DEFAULT_HOME_PATH,
        menus: []
      },
      access: {
        actionCodes: []
      },
      scopeLevel: accountScope
    }
  }
}

// Normalizes optional string values so the session-context payload can omit unstable blanks.
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

// Normalizes account scope while preserving backward-compatible tenant behavior for old tokens.
function normalizeScopeLevel(scopeLevel?: string): 'SYSTEM' | 'TENANT' {
  return scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
}
