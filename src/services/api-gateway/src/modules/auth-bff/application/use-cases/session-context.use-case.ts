import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AssetGrpcAdapter } from '../../infrastructure/downstream/asset-service/asset-grpc.adapter'
import { IdentityQueryGrpcAdapter } from '../../infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from '../../infrastructure/downstream/tenant-org-service/tenant-org-query-grpc.adapter'
import { SessionContextViewModel } from '../../interfaces/http/view-models/session-context.view-model'
import { SessionAccessSummaryUseCase, SessionNavigationSummary } from './session-access-summary.use-case'
import { getAuthenticatedSelfContext } from './self-security-context'

const DEFAULT_HOME_PATH = '/workbench/home'
const SYSTEM_HOME_PATH = '/platform/home'
const PDA_FOUNDATION_ENTRY = 'pda.foundation'

@Injectable()
// Builds the minimal authenticated shell context needed for the front-end to enter the workbench.
export class SessionContextUseCase {
  constructor(
    private readonly identityAdapter: IdentityQueryGrpcAdapter,
    private readonly sessionAccessSummaryUseCase: SessionAccessSummaryUseCase,
    private readonly tenantOrgAdapter?: TenantOrgQueryGrpcAdapter,
    private readonly assetAdapter?: AssetGrpcAdapter
  ) {}

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
        ? await this.requireTenantOrgAdapter().getTenantById(tenantId, source)
        : null

    const accountName = normalize(accountResult.account?.displayName)
    const tenantName = normalize(tenantResult?.tenant?.name)
    const accountAvatar = await this.resolveAccountAvatar(
      accountResult.account?.avatarAssetId,
      accountResult.account?.avatarUrl,
      source
    )
    const terminal = normalize(source.user?.terminal) ?? 'WEB'
    const navigation = await resolveManagedNavigation(
      this.sessionAccessSummaryUseCase,
      source,
      terminal
    )

    return {
      operator: {
        userId: self.userId,
        displayName: accountName,
        scopeLevel: accountScope
      },
      account: {
        accountId: self.accountId,
        name: accountName,
        ...(accountAvatar ? { avatar: accountAvatar } : {}),
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
        defaultEntry: navigation.defaultEntry,
        visibleEntries: navigation.visibleEntries,
        defaultHomePath: accountScope === 'SYSTEM' ? SYSTEM_HOME_PATH : DEFAULT_HOME_PATH,
        menus: []
      },
      access: {
        actionCodes: []
      },
      scopeLevel: accountScope,
      terminal,
      allowedTerminals: normalizeStringArray(source.user?.allowedTerminals),
      ...(source.user?.passwordSetupRequired === true
        ? { passwordSetupRequired: true }
        : {})
    }
  }

  private requireTenantOrgAdapter(): TenantOrgQueryGrpcAdapter {
    if (!this.tenantOrgAdapter) {
      throw new InternalServerErrorException('tenant-org query adapter is unavailable')
    }

    return this.tenantOrgAdapter
  }

  // resolveAccountAvatar turns the stored account avatar asset reference into the shell display URL.
  private async resolveAccountAvatar(
    avatarAssetId: string | undefined,
    legacyAvatarUrl: string | undefined,
    source: DownstreamRequestSource
  ): Promise<string | undefined> {
    const assetId = normalize(avatarAssetId)
    if (!assetId) {
      return normalize(legacyAvatarUrl)
    }

    if (!this.assetAdapter) {
      throw new InternalServerErrorException('asset adapter is unavailable')
    }

    const result = await this.assetAdapter.resolveAssetPublicUrl({ assetId }, source)
    return normalize(result.publicUrl) ?? normalize(legacyAvatarUrl)
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

// Resolves managed navigation and fails closed when the role navigation truth is unavailable.
async function resolveManagedNavigation(
  useCase: SessionAccessSummaryUseCase,
  source: DownstreamRequestSource,
  terminal: string
): Promise<SessionNavigationSummary> {
  const resolver = (useCase as any).resolveNavigation
  if (typeof resolver !== 'function') {
    throw new InternalServerErrorException('managed navigation resolver is unavailable')
  }

  let navigation: SessionNavigationSummary

  try {
    navigation = await resolver.call(useCase, source, terminal)
  } catch {
    throw new InternalServerErrorException('managed navigation resolver failed')
  }

  if (!useManagedNavigation(navigation) && terminal === 'PDA') {
    return buildPdaFoundationNavigation()
  }

  if (!useManagedNavigation(navigation)) {
    throw new InternalServerErrorException('managed navigation resolver returned incomplete navigation')
  }

  return navigation
}

function normalizeStringArray(values?: string[]): string[] {
  if (!Array.isArray(values)) {
    return []
  }

  return values.map((value) => normalize(value)).filter(Boolean) as string[]
}

// Provides a safe Phase 1 PDA shell entry before managed PDA navigation is configured.
function buildPdaFoundationNavigation(): SessionNavigationSummary {
  return {
    defaultEntry: PDA_FOUNDATION_ENTRY,
    visibleEntries: [PDA_FOUNDATION_ENTRY],
    fallbackReason: 'PDA_FOUNDATION_NAVIGATION'
  }
}

// Accepts managed navigation only when it is complete enough for current tenant-web rendering.
function useManagedNavigation(
  navigation: SessionNavigationSummary | null
): navigation is SessionNavigationSummary {
  return Boolean(
    navigation?.defaultEntry &&
      navigation.visibleEntries.length > 0 &&
      navigation.visibleEntries.includes(navigation.defaultEntry)
  )
}
