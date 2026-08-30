import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AssetGrpcAdapter } from '../../infrastructure/downstream/asset-service/asset-grpc.adapter'
import { IdentityQueryGrpcAdapter } from '../../infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { SessionContextViewModel } from '../../interfaces/http/view-models/session-context.view-model'
import {
  SessionAccessSummaryUseCase,
  SessionNavigationSummary
} from './session-access-summary.use-case'
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
    private readonly assetAdapter?: AssetGrpcAdapter
  ) {}

  async execute(source: DownstreamRequestSource): Promise<SessionContextViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const terminal = normalize(source.user?.terminal) ?? 'WEB'

    if (!self.accountId) {
      throw new UnauthorizedException('authenticated session context is missing account id')
    }

    // PDA shell context uses the Auth-validated active-session snapshot so it does not broaden Identity's WEB-only business surface.
    const useSignedPdaSession = terminal === 'PDA'
    const accountResult = useSignedPdaSession
      ? null
      : await this.identityAdapter.getAccountById(self.accountId, source)
    const accountScope = useSignedPdaSession
      ? self.scopeLevel
      : assertAccountMatchesValidatedSession(accountResult?.account, self)
    const tenantId = self.tenantId

    if (accountScope === 'TENANT' && !tenantId) {
      throw new UnauthorizedException('tenant account context is missing tenant id')
    }

    if (accountScope === 'SYSTEM' && tenantId) {
      throw new UnauthorizedException('system account context must not be bound to tenant id')
    }

    const accountName = useSignedPdaSession
      ? normalize(source.user?.displayName)
      : normalize(accountResult?.account?.displayName)
    const accountAvatar = useSignedPdaSession
      ? undefined
      : await this.resolveAccountAvatar(
          accountResult?.account?.avatarAssetId,
          accountResult?.account?.avatarUrl,
          source
        )
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
              tenantId
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
      ...(source.user?.passwordSetupRequired === true ? { passwordSetupRequired: true } : {})
    }
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

// Confirms the Identity account projection still matches the Auth-validated session snapshot.
function assertAccountMatchesValidatedSession(
  account:
    | {
        id?: string
        tenantId?: string
        scopeLevel?: string
      }
    | undefined,
  session: {
    accountId?: string
    tenantId?: string
    scopeLevel: 'SYSTEM' | 'TENANT'
  }
): 'SYSTEM' | 'TENANT' {
  const accountId = normalize(account?.id)
  if (!accountId || accountId !== session.accountId) {
    throw new UnauthorizedException('account projection does not match authenticated session')
  }

  const projectedScope = normalize(account?.scopeLevel)
  if (
    (projectedScope !== undefined && projectedScope !== 'SYSTEM' && projectedScope !== 'TENANT') ||
    (projectedScope !== undefined && projectedScope !== session.scopeLevel)
  ) {
    throw new UnauthorizedException('account scope does not match authenticated session')
  }
  const accountScope = session.scopeLevel

  const accountTenantId = normalize(account?.tenantId)
  if (accountScope === 'TENANT' && accountTenantId !== session.tenantId) {
    throw new UnauthorizedException('account tenant does not match authenticated session')
  }

  if (accountScope === 'SYSTEM' && (accountTenantId || session.tenantId)) {
    throw new UnauthorizedException('system account context must not be bound to tenant id')
  }

  return accountScope
}

// Normalizes optional string values so the session-context payload can omit unstable blanks.
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
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
    throw new InternalServerErrorException(
      'managed navigation resolver returned incomplete navigation'
    )
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
