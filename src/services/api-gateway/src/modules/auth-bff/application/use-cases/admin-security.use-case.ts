import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { MfaBindingType } from '@oes/common/generated/auth_service'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { IdentityQueryGrpcAdapter } from '../../infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { PartyQueryGrpcAdapter } from '../../infrastructure/downstream/party-service/party-query-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from '../../infrastructure/downstream/tenant-org-service/tenant-org-query-grpc.adapter'
import {
  AdminAccountDirectoryQueryDto,
  AdminAuditEventQueryDto,
  AdminLoginMethodStateMutationDto,
  AdminOnlineUserQueryDto,
  AdminPlatformMfaPolicyMutationDto,
  AdminPlatformTerminalLoginPolicyMutationDto,
  AdminPlatformTerminalMfaPolicyMutationDto,
  AdminRequirePasswordSetupDto,
  AdminTenantMfaPolicyMutationDto,
  AdminTenantTerminalMfaPolicyMutationDto,
  CreateAdminAccountDto,
  AdminTenantOptionQueryDto,
  AdminRevokeSessionDto,
  UpdateAdminAccountBasicInfoDto
} from '../../interfaces/http/dtos/admin-security.dto'
import { AdminUserSearchQueryDto } from '../../interfaces/http/dtos/admin-security.dto'
import {
  AdminAccountDirectoryListViewModel,
  AdminAccountBasicInfoViewModel,
  AdminAccountDirectoryItemViewModel,
  AdminAccountDeletionImpactViewModel,
  AdminAccountDeletionResultViewModel,
  AdminAuditEventListViewModel,
  AdminAuditEventViewModel,
  AdminOnlineUserListViewModel,
  AdminOnlineUserViewModel,
  AdminPlatformMfaPolicyViewModel,
  AdminPlatformTerminalLoginPolicyViewModel,
  AdminPlatformTerminalMfaPolicyViewModel,
  AdminSessionListViewModel,
  AdminSessionMutationViewModel,
  AdminSessionViewModel,
  AdminTenantMfaPolicyViewModel,
  AdminTenantTerminalMfaPolicyViewModel,
  AdminTenantOptionListViewModel,
  AdminUserSearchListViewModel
} from '../../interfaces/http/view-models/admin-security.view-model'
import {
  LoginMethodListViewModel,
  LoginMethodMutationViewModel,
  LoginMethodViewModel,
  PasswordMutationViewModel
} from '../../interfaces/http/view-models/self-security.view-model'
import { PermissionProxyService } from '../../../permission-service/permission-service.service'

type HydratedOnlineUserViewModel = AdminOnlineUserViewModel & {
  searchTerms: string[]
}

@Injectable()
// Executes administrator-facing auth session and audit operations through the auth-service contract.
export class AdminSecurityUseCase {
  constructor(
    private readonly authAdapter: AuthGrpcAdapter,
    private readonly identityAdapter: IdentityQueryGrpcAdapter,
    private readonly permissionService: PermissionProxyService,
    private readonly partyAdapter?: PartyQueryGrpcAdapter,
    private readonly tenantOrgAdapter?: TenantOrgQueryGrpcAdapter
  ) {}

  async listOnlineUsers(
    query: AdminOnlineUserQueryDto,
    source: DownstreamRequestSource
  ): Promise<AdminOnlineUserListViewModel> {
    const result = await this.authAdapter.adminListOnlineUsers(
      {
        tenantId: query.tenantId?.trim() || undefined
      },
      source
    )
    const hydratedItems = await this.hydrateOnlineUsers(result.items ?? [], source)
    const filteredItems = filterOnlineUsers(hydratedItems, query.query)
    const pageSize = query.pageSize ?? 20
    const offset = parseCursor(query.cursor)
    const items = filteredItems.slice(offset, offset + pageSize)
    const localNextCursor =
      offset + pageSize < filteredItems.length ? String(offset + pageSize) : undefined

    return {
      items,
      nextCursor: result.nextCursor ?? localNextCursor
    }
  }

  async listUserSessions(
    userId: string,
    source: DownstreamRequestSource
  ): Promise<AdminSessionListViewModel> {
    const result = await this.authAdapter.adminListUserSessions(userId.trim(), source)
    const accountNameMap = await this.loadAccountNames(result.sessions ?? [], source)

    return {
      sessions: (result.sessions ?? []).map(
        (session): AdminSessionViewModel => ({
          sessionId: session.sessionId ?? '',
          userId: session.userId ?? '',
          accountId: session.accountId ?? undefined,
          accountName: normalize(
            session.accountId ? accountNameMap.get(session.accountId) : undefined
          ),
          tenantId: session.tenantId ?? undefined,
          terminal: session.terminal ?? undefined,
          terminalDeviceId: session.terminalDeviceId ?? undefined,
          deviceBoundTenantId: session.deviceBoundTenantId ?? undefined,
          loginFlow: session.loginFlow ?? undefined,
          status: session.status ?? '',
          loginMethod: session.loginMethod ?? '',
          deviceId: session.deviceId ?? undefined,
          deviceName: session.deviceName ?? undefined,
          userAgent: session.userAgent ?? undefined,
          ipAddress: session.ipAddress ?? undefined,
          platform: session.platform ?? undefined,
          browser: session.browser ?? undefined,
          createdAt: session.createdAt ?? '',
          lastActiveAt: session.lastActiveAt ?? '',
          expiresAt: session.expiresAt ?? '',
          refreshExpiresAt: session.refreshExpiresAt ?? '',
          accessRemainingSeconds: Number(session.accessRemainingSeconds ?? '0'),
          refreshRemainingSeconds: Number(session.refreshRemainingSeconds ?? '0'),
          sessionAgeSeconds: Number(session.sessionAgeSeconds ?? '0'),
          idleSeconds: Number(session.idleSeconds ?? '0'),
          isAccessExpired: Boolean(session.isAccessExpired),
          isRefreshExpired: Boolean(session.isRefreshExpired),
          isRevoked: Boolean(session.isRevoked),
          isAdminControlled: Boolean(session.isAdminControlled),
          adminRevokeReason: session.adminRevokeReason ?? undefined,
          adminRevokeAt: session.adminRevokeAt ?? undefined,
          adminRevokeBy: session.adminRevokeBy ?? undefined
        })
      )
    }
  }

  async searchUsers(
    query: AdminUserSearchQueryDto,
    source: DownstreamRequestSource
  ): Promise<AdminUserSearchListViewModel> {
    const keyword = normalize(query.keyword)

    if (!keyword) {
      return { items: [] }
    }

    const candidates = await this.findSearchCandidates(keyword, source)
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 10)
    const items = (
      await Promise.all(candidates.slice(0, limit).map((user) => this.buildSearchItem(user, source)))
    ).filter(Boolean)

    return {
      items
    }
  }

  async listAccounts(
    query: AdminAccountDirectoryQueryDto,
    source: DownstreamRequestSource
  ): Promise<AdminAccountDirectoryListViewModel> {
    const page = Math.max(query.page ?? 1, 1)
    const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100)
    const result = await this.identityAdapter.listAccounts(
      {
        keyword: normalize(query.keyword),
        page,
        pageSize,
        scopeLevel: query.scopeLevel?.trim() || undefined,
        status: query.status?.trim() || undefined,
        tenantId: normalize(query.tenantId)
      },
      source
    )

    const tenantNameMap = await this.loadTenantNames(
      [...new Set((result.accounts ?? []).map((account) => normalize(account.tenantId)).filter(Boolean))] as string[],
      source
    )

    return {
      items: (result.accounts ?? []).map((account) => ({
        accountId: account.accountId ?? '',
        userId: account.userId ?? '',
        tenantId: normalize(account.tenantId),
        tenantName: normalize(account.tenantId)
          ? tenantNameMap.get(normalize(account.tenantId)!)
          : undefined,
        accountDisplayName: normalize(account.displayName),
        userDisplayName: normalize(account.userDisplayName),
        scopeLevel: account.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT',
        isEnabled: Boolean(account.isEnabled)
      })),
      page,
      pageSize,
      total: Number(result.total ?? 0)
    }
  }

  async getAccountBasicInfo(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<AdminAccountBasicInfoViewModel> {
    const accountResult = await this.identityAdapter.getAccountById(accountId.trim(), source)
    const account = accountResult.account
    if (!account?.id || !account.userId) {
      throw new NotFoundException('Account not found')
    }

    const userResult = await this.identityAdapter.getUserById(account.userId, source)
    const user = userResult.user
    const tenantName =
      account.scopeLevel === 'TENANT' && account.tenantId
        ? normalize((await this.requireTenantOrgAdapter().getTenantById(account.tenantId, source)).tenant?.name)
        : undefined

    return {
      accountId: account.id,
      userId: account.userId,
      displayName: normalize(account.displayName),
      email: normalize(user?.personalEmail),
      phone: normalize(user?.personalPhone),
      tenantId: normalize(account.tenantId),
      tenantName,
      scopeLevel: account.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT',
      isEnabled: Boolean(account.isEnabled)
    }
  }

  async getAccountDeletionImpact(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<AdminAccountDeletionImpactViewModel> {
    await this.getRequiredAccount(accountId, source)
    const result = await this.identityAdapter.getAccountDeletionImpact(accountId.trim(), source)

    return {
      accountId: result.accountId ?? accountId.trim(),
      canDelete: Boolean(result.canDelete),
      userRetained: Boolean(result.userRetained),
      cleanupPlan: {
        willDeleteSessions: Boolean(result.cleanupPlan?.willDeleteSessions),
        willClearRoles: Boolean(result.cleanupPlan?.willClearRoles),
        willDeleteContactAssets: Boolean(result.cleanupPlan?.willDeleteContactAssets)
      },
      blockingReasons: (result.blockingReasons ?? []).map((reason) => ({
        resourceType: reason.resourceType ?? '',
        resourceCount: Number(reason.resourceCount ?? 0),
        message: reason.message ?? ''
      })),
      contactAssetCount: Number(result.contactAssetCount ?? 0)
    }
  }

  async listAccountLoginMethods(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<LoginMethodListViewModel> {
    const account = await this.getRequiredAccount(accountId, source)
    const result = await this.authAdapter.listLoginMethods(account.userId, source)

    return {
      loginMethods: (result.loginMethods ?? []).map(toLoginMethodViewModel),
      passwordSetupRequired: Boolean(result.passwordSetupRequired)
    }
  }

  async requireAccountPasswordSetup(
    accountId: string,
    dto: AdminRequirePasswordSetupDto,
    source: DownstreamRequestSource
  ): Promise<PasswordMutationViewModel> {
    const account = await this.getRequiredAccount(accountId, source)
    const result = await this.authAdapter.requirePasswordSetup(
      {
        userId: account.userId,
        reason: normalize(dto.reason),
        revokeSessions: dto.revokeSessions
      },
      source
    )

    return {
      success: Boolean(result.success),
      passwordSetupRequired: Boolean(result.passwordSetupRequired)
    }
  }

  async setAccountLoginMethodEnabled(
    accountId: string,
    methodId: string,
    enabled: boolean,
    dto: AdminLoginMethodStateMutationDto,
    source: DownstreamRequestSource
  ): Promise<LoginMethodMutationViewModel> {
    const account = await this.getRequiredAccount(accountId, source)
    const result = await this.authAdapter.setLoginMethodEnabled(
      {
        userId: account.userId,
        methodId: methodId.trim(),
        enabled,
        reason: normalize(dto.reason)
      },
      source
    )

    return {
      success: Boolean(result.success),
      loginMethod: toLoginMethodViewModel(result.loginMethod)
    }
  }

  async getTenantMfaPolicy(source: DownstreamRequestSource): Promise<AdminTenantMfaPolicyViewModel> {
    const tenantId = this.resolveTenantAdminTenantId(source)
    const result = await this.authAdapter.getTenantMfaPolicy(tenantId, source)
    return toTenantMfaPolicyViewModel(result)
  }

  async getPlatformMfaPolicy(
    source: DownstreamRequestSource
  ): Promise<AdminPlatformMfaPolicyViewModel> {
    const result = await this.authAdapter.getPlatformMfaPolicy(source)
    return toPlatformMfaPolicyViewModel(result)
  }

  async updateTenantMfaPolicy(
    dto: AdminTenantMfaPolicyMutationDto,
    source: DownstreamRequestSource
  ): Promise<AdminTenantMfaPolicyViewModel> {
    const tenantId = this.resolveTenantAdminTenantId(source)
    const result = await this.authAdapter.updateTenantMfaPolicy(
      {
        tenantId,
        loginRequired: dto.loginRequired,
        scenarioRequirements: dto.scenarioRequirements,
        factors: dto.factors.map((factor) => ({
          factor: factor.factor,
          enabled: factor.enabled,
          priority: factor.priority
        }))
      },
      source
    )

    return toTenantMfaPolicyViewModel(result)
  }

  async updatePlatformMfaPolicy(
    dto: AdminPlatformMfaPolicyMutationDto,
    source: DownstreamRequestSource
  ): Promise<AdminPlatformMfaPolicyViewModel> {
    const result = await this.authAdapter.updatePlatformMfaPolicy(
      {
        loginRequired: dto.loginRequired,
        scenarioRequirements: dto.scenarioRequirements,
        factors: dto.factors.map((factor) => ({
          factor: factor.factor,
          enabled: factor.enabled,
          priority: factor.priority
        }))
      },
      source
    )

    return toPlatformMfaPolicyViewModel(result)
  }

  async getPlatformTerminalLoginPolicy(
    source: DownstreamRequestSource
  ): Promise<AdminPlatformTerminalLoginPolicyViewModel> {
    const result = await this.authAdapter.getPlatformTerminalLoginPolicy(source)
    return toPlatformTerminalLoginPolicyViewModel(result)
  }

  async updatePlatformTerminalLoginPolicy(
    dto: AdminPlatformTerminalLoginPolicyMutationDto,
    source: DownstreamRequestSource
  ): Promise<AdminPlatformTerminalLoginPolicyViewModel> {
    const result = await this.authAdapter.updatePlatformTerminalLoginPolicy(
      {
        entries: dto.entries.map((entry) => ({
          terminal: entry.terminal,
          enabledLoginFlows: entry.enabledLoginFlows
        }))
      },
      source
    )

    return toPlatformTerminalLoginPolicyViewModel(result)
  }

  async getPlatformTerminalMfaPolicy(
    source: DownstreamRequestSource
  ): Promise<AdminPlatformTerminalMfaPolicyViewModel> {
    const result = await this.authAdapter.getPlatformDefaultTerminalMfaPolicy(source)
    return toPlatformTerminalMfaPolicyViewModel(result)
  }

  async updatePlatformTerminalMfaPolicy(
    dto: AdminPlatformTerminalMfaPolicyMutationDto,
    source: DownstreamRequestSource
  ): Promise<AdminPlatformTerminalMfaPolicyViewModel> {
    assertTerminalMfaOperationalImpactConfirmed(dto)
    const result = await this.authAdapter.updatePlatformDefaultTerminalMfaPolicy(
      {
        entries: dto.entries.map(toTerminalMfaMutationEntry)
      },
      source
    )

    return toPlatformTerminalMfaPolicyViewModel(result)
  }

  async getTenantTerminalMfaPolicy(
    source: DownstreamRequestSource
  ): Promise<AdminTenantTerminalMfaPolicyViewModel> {
    const tenantId = this.resolveTenantAdminTenantId(source)
    const result = await this.authAdapter.getTenantTerminalMfaPolicy(tenantId, source)
    return toTenantTerminalMfaPolicyViewModel(result)
  }

  async updateTenantTerminalMfaPolicy(
    dto: AdminTenantTerminalMfaPolicyMutationDto,
    source: DownstreamRequestSource
  ): Promise<AdminTenantTerminalMfaPolicyViewModel> {
    assertTerminalMfaOperationalImpactConfirmed(dto)
    const tenantId = this.resolveTenantAdminTenantId(source)
    const result = await this.authAdapter.updateTenantTerminalMfaPolicy(
      {
        tenantId,
        entries: dto.entries.map(toTerminalMfaMutationEntry)
      },
      source
    )

    return toTenantTerminalMfaPolicyViewModel(result)
  }

  async createAccount(
    dto: CreateAdminAccountDto,
    source: DownstreamRequestSource
  ): Promise<AdminAccountDirectoryItemViewModel> {
    const operatorScope = source.user?.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
    const scopeLevel = dto.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'

    if (operatorScope !== 'SYSTEM' && scopeLevel === 'SYSTEM') {
      throw new ForbiddenException('Forbidden resource')
    }

    const tenantId =
      operatorScope === 'SYSTEM'
        ? scopeLevel === 'TENANT'
          ? normalize(dto.tenantId)
          : undefined
        : source.user?.tid

    const displayName = dto.displayName.trim()
    const userDisplayName = normalize(dto.username) ?? displayName
    const created = await this.identityAdapter.createUserAccount(
      {
        scopeLevel,
        tenantId,
        displayName,
        username: userDisplayName,
        email: normalize(dto.email),
        phone: normalize(dto.phone)
      },
      source
    )

    const account = created.account
    if (!account?.id) {
      throw new ForbiddenException('Account creation failed')
    }

    await this.authAdapter.bootstrapUserLoginMethods(
      {
        userId: account.userId ?? '',
        accountId: account.id,
        displayName: account.displayName ?? displayName,
        email: normalize(dto.email),
        phone: normalize(dto.phone)
      },
      source
    )

    if ((dto.initialRoleIds ?? []).length > 0) {
      await this.permissionService.setAccountRoles(
        {
          accountId: account.id,
          accountType: 'USER',
          tenantId: tenantId ?? '',
          scopeLevel,
          roleIds: dto.initialRoleIds
        },
        source
      )
    }

    return {
      accountId: account.id,
      userId: account.userId ?? '',
      tenantId: normalize(account.tenantId),
      tenantName: undefined,
      accountDisplayName: normalize(account.displayName),
      userDisplayName,
      scopeLevel: account.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT',
      isEnabled: Boolean(account.isEnabled)
    }
  }

  async deleteAccount(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<AdminAccountDeletionResultViewModel> {
    const currentAccountId = normalize(source.user?.aid)
    if (currentAccountId && currentAccountId === accountId.trim()) {
      throw new BadRequestException('Current login account cannot be deleted')
    }

    const account = await this.getRequiredAccount(accountId, source)
    const impact = await this.getAccountDeletionImpact(accountId, source)
    if (!impact.canDelete) {
      throw new BadRequestException('Account deletion is blocked by business relations')
    }

    const roleResult = await this.permissionService.listAccountRoles(
      {
        accountId: account.id,
        scopeLevel: account.scopeLevel,
        tenantId: account.tenantId ?? ''
      },
      source
    )
    const clearedRoleCount = (roleResult.roles ?? []).length

    const sessionResult = await this.authAdapter.adminDeleteAccountSessions(
      {
        userId: account.userId,
        accountId: account.id,
        reason: '账号删除时自动清理会话'
      },
      source
    )

    await this.permissionService.setAccountRoles(
      {
        accountId: account.id,
        accountType: 'USER',
        tenantId: account.tenantId ?? '',
        scopeLevel: account.scopeLevel,
        roleIds: []
      },
      source
    )
    const deletedPolicyCount = await this.disableAccountPolicyInstances(
      account.id,
      account.tenantId ?? undefined,
      source
    )

    const deleteResult = await this.identityAdapter.deleteAccount(
      {
        accountId: account.id,
        deletedSessionCount: Number(sessionResult.deletedSessionCount ?? 0),
        clearedRoleCount,
        deletedPolicyCount
      },
      source
    )

    return {
      accountId: deleteResult.accountId ?? account.id,
      success: true,
      deletedSessionCount: Number(sessionResult.deletedSessionCount ?? 0),
      clearedRoleCount,
      deletedPolicyCount,
      deletedContactAssetCount: Number(deleteResult.deletedContactAssetCount ?? 0),
      userRetained: Boolean(deleteResult.userRetained)
    }
  }

  private async disableAccountPolicyInstances(
    accountId: string,
    tenantId: string | undefined,
    source: DownstreamRequestSource
  ): Promise<number> {
    const pageSize = 100
    let page = 1
    const policyInstanceIds: string[] = []

    while (true) {
      const result = await this.permissionService.listPolicyInstances(
        {
          page,
          pageSize,
          tenantId,
          subjectSelectorType: 'ACCOUNT',
          subjectSelectorValue: accountId,
          hasEnabledFilter: true,
          enabled: true
        },
        source
      )
      const ids = (result.policyInstances ?? [])
        .map((policyInstance) => policyInstance.id)
        .filter((policyInstanceId): policyInstanceId is string => Boolean(policyInstanceId))

      policyInstanceIds.push(...ids)

      if (policyInstanceIds.length >= Number(result.total ?? 0) || ids.length < pageSize) {
        break
      }

      page += 1
    }

    await Promise.all(
      policyInstanceIds.map((id) =>
        this.permissionService.setPolicyInstanceEnabled({ id, enabled: false }, source)
      )
    )

    return policyInstanceIds.length
  }

  async listTenantOptions(
    query: AdminTenantOptionQueryDto,
    source: DownstreamRequestSource
  ): Promise<AdminTenantOptionListViewModel> {
    const result = await this.requireTenantOrgAdapter().listTenants(
      {
        keyword: normalize(query.keyword),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 50)
      },
      source
    )

    return {
      items: (result.tenants ?? []).map((tenant) => ({
        id: tenant.id ?? '',
        code: tenant.code ?? '',
        name: tenant.name ?? '',
        isActive: Boolean(tenant.isActive)
      }))
    }
  }

  async updateAccountBasicInfo(
    accountId: string,
    dto: UpdateAdminAccountBasicInfoDto,
    source: DownstreamRequestSource
  ): Promise<AdminAccountBasicInfoViewModel> {
    const current = await this.getAccountBasicInfo(accountId, source)
    const displayName = dto.displayName.trim()
    const requestedEnabled = dto.isEnabled ?? current.isEnabled
    const currentDisplayName = normalize(current.displayName) ?? ''
    const profileChanged = displayName !== currentDisplayName
    const statusChanged = requestedEnabled !== current.isEnabled

    if (profileChanged) {
      if (!displayName) {
        throw new BadRequestException('displayName is required')
      }
    }

    if (!profileChanged && !statusChanged) {
      return current
    }

    await this.identityAdapter.updateAccountProfile(
      {
        accountId: current.accountId,
        displayName: profileChanged ? displayName : undefined,
        isEnabled: statusChanged ? requestedEnabled : undefined
      },
      source
    )

    if (statusChanged && !requestedEnabled) {
      await this.authAdapter.adminDeleteAccountSessions(
        {
          userId: current.userId,
          accountId: current.accountId,
          reason: 'ACCOUNT_DISABLED'
        },
        source
      )
    }

    return this.getAccountBasicInfo(current.accountId, source)
  }

  async revokeSession(
    sessionId: string,
    dto: AdminRevokeSessionDto,
    source: DownstreamRequestSource
  ): Promise<AdminSessionMutationViewModel> {
    if (source.user?.sid && source.user.sid === sessionId.trim()) {
      throw new ForbiddenException('CANNOT_REVOKE_CURRENT_SESSION')
    }

    const result = await this.authAdapter.adminRevokeSession(
      sessionId.trim(),
      dto.reason.trim(),
      source
    )

    return {
      success: Boolean(result.success),
      sessionId: result.sessionId ?? sessionId.trim()
    }
  }

  async listAuditEvents(
    query: AdminAuditEventQueryDto,
    source: DownstreamRequestSource
  ): Promise<AdminAuditEventListViewModel> {
    const result = await this.authAdapter.listAuditEvents(
      {
        service: query.service?.trim(),
        module: query.module?.trim(),
        eventType: query.eventType?.trim(),
        result: query.result?.trim(),
        operatorId: query.operatorId?.trim(),
        tenantId: query.tenantId?.trim(),
        orgId: query.orgId?.trim(),
        resourceType: query.resourceType?.trim(),
        resourceId: query.resourceId?.trim(),
        occurredAtFrom: query.occurredAtFrom?.trim(),
        occurredAtTo: query.occurredAtTo?.trim(),
        cursor: query.cursor?.trim(),
        pageSize: query.pageSize
      },
      source
    )

    return {
      items: (result.items ?? []).map(
        (item): AdminAuditEventViewModel => ({
          eventId: item.eventId ?? '',
          service: item.service ?? undefined,
          module: item.module ?? undefined,
          eventType: item.eventType ?? undefined,
          occurredAt: item.occurredAt ?? undefined,
          result: item.result ?? undefined,
          operatorId: item.operatorId ?? undefined,
          operatorType: item.operatorType ?? undefined,
          tenantId: item.tenantId ?? undefined,
          orgId: item.orgId ?? undefined,
          traceId: item.traceId ?? undefined,
          resourceType: item.resourceType ?? undefined,
          resourceId: item.resourceId ?? undefined,
          detailsJson: item.detailsJson ?? undefined
        })
      ),
      nextCursor: result.nextCursor ?? undefined
    }
  }

  private async hydrateOnlineUsers(
    items: Array<{
      userId?: string
      tenantId?: string
      activeSessionCount?: string | number
      lastActiveAt?: string
    }>,
    source: DownstreamRequestSource
  ): Promise<HydratedOnlineUserViewModel[]> {
    const aggregatedItems = await this.aggregateOnlineUsers(items, source)
    const userIds = aggregatedItems.map((item) => item.userId)
    const tenantIds = [
      ...new Set(aggregatedItems.flatMap((item) => item.tenantIds).filter(Boolean))
    ] as string[]
    const [userEntries, tenantEntries] = await Promise.all([
      Promise.all(
        userIds.map(async (userId) => {
          const result = await this.identityAdapter.getUserById(userId, source)
          return [userId, normalize(result.user?.username)] as const
        })
      ),
      Promise.all(
        tenantIds.map(async (tenantId) => {
          const result = await this.requireTenantOrgAdapter().getTenantById(tenantId, source)
          return [tenantId, normalize(result.tenant?.name)] as const
        })
      )
    ])
    const userNameMap = new Map(
      await Promise.all(
        userEntries.map(async ([userId, username]) => {
          return [userId, { displayName: username, username }] as const
        })
      )
    )
    const tenantNameMap = new Map(tenantEntries)

    return aggregatedItems.map((item): HydratedOnlineUserViewModel => {
      const tenantNames = item.tenantIds
        .map((tenantId) => tenantNameMap.get(tenantId))
        .filter(Boolean) as string[]
      const userInfo = userNameMap.get(item.userId)

      return {
        userId: item.userId,
        displayName: userInfo?.displayName ?? undefined,
        tenantId: item.tenantIds.length === 1 ? item.tenantIds[0] : undefined,
        tenantName:
          item.tenantIds.length === 1
            ? tenantNameMap.get(item.tenantIds[0]) ?? item.tenantIds[0] ?? null
            : null,
        tenantNames,
        visibleTenantCount: item.tenantIds.length,
        activeAccountCount: item.activeAccountCount,
        activeSessionCount: item.activeSessionCount,
        lastActiveAt: item.lastActiveAt,
        searchTerms: [userInfo?.displayName, userInfo?.username, item.userId, ...tenantNames].filter(
          Boolean
        ) as string[]
      }
    })
  }

  // Aggregates raw online-session rows into one user-centric summary with active account and tenant coverage.
  private async aggregateOnlineUsers(
    items: Array<{
      userId?: string
      tenantId?: string
      activeSessionCount?: string | number
      lastActiveAt?: string
    }>,
    source: DownstreamRequestSource
  ): Promise<
    Array<{
      userId: string
      tenantIds: string[]
      activeAccountCount: number
      activeSessionCount: number
      lastActiveAt: string
    }>
  > {
    const userIds = [...new Set(items.map((item) => normalize(item.userId)).filter(Boolean))] as string[]
    const activeSessionMap = new Map(
      userIds.map((userId) => [
        userId,
        items
          .filter((item) => normalize(item.userId) === userId)
          .reduce((total, item) => total + Number(item.activeSessionCount ?? '0'), 0)
      ])
    )
    const lastActiveMap = new Map(
      userIds.map((userId) => [
        userId,
        items
          .filter((item) => normalize(item.userId) === userId)
          .reduce((latest, item) => {
            const candidate = item.lastActiveAt ?? ''
            return candidate > latest ? candidate : latest
          }, '')
      ])
    )
    const sessionEntries = await Promise.all(
      userIds.map(async (userId) => {
        const result = await this.authAdapter.adminListUserSessions(userId, source)
        return [userId, result.sessions ?? []] as const
      })
    )
    const activeSessionEntries = sessionEntries.map(([userId, sessions]) => {
      const activeSessions = sessions.filter(
        (session) => !Boolean(session.isRevoked) && !Boolean(session.isAccessExpired)
      )
      const tenantIds = [
        ...new Set(activeSessions.map((session) => normalize(session.tenantId)).filter(Boolean))
      ] as string[]
      const accountIds = [
        ...new Set(activeSessions.map((session) => normalize(session.accountId)).filter(Boolean))
      ] as string[]

      return [
        userId,
        {
          activeAccountCount: accountIds.length,
          activeSessionCount: activeSessionMap.get(userId) ?? activeSessions.length,
          lastActiveAt: lastActiveMap.get(userId) ?? '',
          tenantIds
        }
      ] as const
    })

    return activeSessionEntries
      .map(([userId, item]) => ({
        userId,
        tenantIds: item.tenantIds,
        activeAccountCount: item.activeAccountCount,
        activeSessionCount: item.activeSessionCount,
        lastActiveAt: item.lastActiveAt
      }))
      .sort((left, right) => right.lastActiveAt.localeCompare(left.lastActiveAt))
  }

  // Resolves account display names so the UI can group user sessions under human-readable account labels.
  private async loadAccountNames(
    sessions: Array<{
      accountId?: string
    }>,
    source: DownstreamRequestSource
  ): Promise<Map<string, string | undefined>> {
    const accountIds = [
      ...new Set(sessions.map((session) => normalize(session.accountId)).filter(Boolean))
    ] as string[]
    const accountEntries = await Promise.all(
      accountIds.map(async (accountId) => {
        const result = await this.identityAdapter.getAccountById(accountId, source)
        return [accountId, normalize(result.account?.displayName)] as const
      })
    )

    return new Map(accountEntries)
  }

  // Resolves the identity account boundary before admin auth mutations target a user-level credential.
  private async getRequiredAccount(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<{ id: string; userId: string; tenantId?: string; scopeLevel: 'SYSTEM' | 'TENANT' }> {
    const accountResult = await this.identityAdapter.getAccountById(accountId.trim(), source)
    const account = accountResult.account
    if (!account?.id || !account.userId) {
      throw new NotFoundException('Account not found')
    }

    return {
      id: account.id,
      userId: account.userId,
      tenantId: normalize(account.tenantId),
      scopeLevel: account.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
    }
  }

  private resolveTenantAdminTenantId(source: DownstreamRequestSource): string {
    const tenantId = normalize(source.user?.tenantId || source.user?.tid)
    if (!tenantId) {
      throw new ForbiddenException('当前账号不在租户上下文中，无法管理租户登录 MFA 策略。')
    }

    return tenantId
  }

  // Resolves at most one identity user candidate from the supported admin-search keyword types.
  private async findSearchCandidates(
    keyword: string,
    source: DownstreamRequestSource
  ): Promise<Array<{ id: string; username?: string; personalEmail?: string; personalPhone?: string }>> {
    const candidates: Array<{
      id: string
      username?: string
      personalEmail?: string
      personalPhone?: string
    }> = []
    const seen = new Set<string>()
    const pushCandidate = (user?: {
      id?: string
      username?: string
      personalEmail?: string
      personalPhone?: string
    }) => {
      const userId = normalize(user?.id)
      if (!userId || seen.has(userId)) {
        return
      }

      seen.add(userId)
      candidates.push({
        id: userId,
        username: normalize(user?.username),
        personalEmail: normalize(user?.personalEmail),
        personalPhone: normalize(user?.personalPhone)
      })
    }

    if (looksLikeUserId(keyword)) {
      pushCandidate((await this.identityAdapter.getUserById(keyword, source)).user)
    }

    if (keyword.includes('@')) {
      pushCandidate((await this.identityAdapter.getUserByEmail(keyword, source)).user)
    }

    if (looksLikePhone(keyword)) {
      pushCandidate((await this.identityAdapter.getUserByPhone(keyword, source)).user)
    }

    return candidates
  }

  // Builds one admin-search row by joining identity facts, tenant labels, and visible session counts.
  private async buildSearchItem(
    user: {
      id: string
      username?: string
      personalEmail?: string
      personalPhone?: string
    },
    source: DownstreamRequestSource
  ): Promise<AdminUserSearchListViewModel['items'][number] | null> {
    const visibleTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)
    const isTenantScope = source.user?.scopeLevel !== 'SYSTEM'
    const accountsResult = await this.identityAdapter.getAccountsByUserId(user.id, source)
    const accountSummaries = (accountsResult.accounts ?? []).filter((account) => {
      if (!isTenantScope) {
        return true
      }

      return normalize(account.tenantId) === visibleTenantId
    })

    if (accountSummaries.length === 0) {
      return null
    }

    const tenantIds = [...new Set(accountSummaries.map((account) => normalize(account.tenantId)).filter(Boolean))] as string[]
    const tenantEntries = await Promise.all(
      tenantIds.map(async (tenantId) => {
        const result = await this.requireTenantOrgAdapter().getTenantById(tenantId, source)
        return [tenantId, normalize(result.tenant?.name)] as const
      })
    )
    const tenantNameMap = new Map(tenantEntries)
    const sessionsResult = await this.authAdapter.adminListUserSessions(user.id, source)
    const activeSessions = (sessionsResult.sessions ?? []).filter((session) => {
      if (Boolean(session.isRevoked) || Boolean(session.isAccessExpired)) {
        return false
      }

      if (!isTenantScope) {
        return true
      }

      return normalize(session.tenantId) === visibleTenantId
    })

    return {
      userId: user.id,
      displayName: normalize(accountSummaries[0]?.displayName) ?? user.username ?? user.id,
      emailMasked: maskEmail(user.personalEmail),
      phoneMasked: maskPhone(user.personalPhone),
      accountSummaries: accountSummaries.map((account) => ({
        accountId: account.accountId ?? '',
        accountDisplayName: normalize(account.displayName),
        tenantId: normalize(account.tenantId),
        tenantName: normalize(account.tenantId)
          ? tenantNameMap.get(normalize(account.tenantId)!) ?? normalize(account.tenantId)
          : undefined,
        scopeLevel: account.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
      })),
      isOnline: activeSessions.length > 0,
      activeSessionCount: activeSessions.length
    }
  }

  // Loads tenant names from tenant-org-service so identity account-directory rows stay tenant-truth free.
  private async loadTenantNames(
    tenantIds: string[],
    source: DownstreamRequestSource
  ): Promise<Map<string, string>> {
    const entries = await Promise.all(
      tenantIds.map(async (tenantId) => {
        const result = await this.requireTenantOrgAdapter().getTenantById(tenantId, source)
        return [tenantId, normalize(result.tenant?.name)] as const
      })
    )

    return new Map(entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])))
  }

  private requireTenantOrgAdapter(): TenantOrgQueryGrpcAdapter {
    if (!this.tenantOrgAdapter) {
      throw new Error('tenant-org query adapter is unavailable')
    }

    return this.tenantOrgAdapter
  }
}

function toLoginMethodViewModel(method?: {
  methodId?: string
  userId?: string
  type?: string
  identifier?: string
  maskedIdentifier?: string
  verified?: boolean
  enabled?: boolean
  hasPassword?: boolean
  createdAt?: string
  updatedAt?: string
}): LoginMethodViewModel {
  return {
    methodId: method?.methodId ?? '',
    userId: method?.userId ?? '',
    type: method?.type ?? '',
    identifier: method?.identifier ?? undefined,
    maskedIdentifier: method?.maskedIdentifier ?? undefined,
    verified: Boolean(method?.verified),
    enabled: Boolean(method?.enabled),
    hasPassword: Boolean(method?.hasPassword),
    createdAt: method?.createdAt ?? undefined,
    updatedAt: method?.updatedAt ?? undefined
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function toTenantMfaPolicyViewModel(result: {
  factors?: Array<{ enabled?: boolean; factor?: MfaBindingType; priority?: number }>
  loginRequired?: boolean
  scenarioRequirements?: Array<{ required?: boolean; scenario?: number }>
  tenantId?: string
}): AdminTenantMfaPolicyViewModel {
  return {
    tenantId: result.tenantId ?? '',
    loginRequired: Boolean(result.loginRequired),
    scenarioRequirements: (result.scenarioRequirements ?? [])
      .map((item) => {
        const scenario = toTenantMfaScenario(item.scenario)
        if (!scenario) {
          return null
        }

        return {
          scenario,
          required: Boolean(item.required)
        }
      })
      .filter(
        (
          item
        ): item is AdminTenantMfaPolicyViewModel['scenarioRequirements'][number] => Boolean(item)
      ),
    factors: (result.factors ?? [])
      .map((factor) => {
        const type = toTenantMfaFactor(factor.factor)
        if (!type) {
          return null
        }

        return {
          factor: type,
          enabled: Boolean(factor.enabled),
          priority: Number(factor.priority ?? 0)
        }
      })
      .filter((factor): factor is AdminTenantMfaPolicyViewModel['factors'][number] => Boolean(factor))
      .sort((left, right) => left.priority - right.priority)
  }
}

function toPlatformMfaPolicyViewModel(result: {
  factors?: Array<{ enabled?: boolean; factor?: MfaBindingType; priority?: number }>
  loginRequired?: boolean
  scenarioRequirements?: Array<{ required?: boolean; scenario?: number }>
}): AdminPlatformMfaPolicyViewModel {
  return {
    loginRequired: Boolean(result.loginRequired),
    scenarioRequirements: (result.scenarioRequirements ?? [])
      .map((item) => {
        const scenario = toTenantMfaScenario(item.scenario)
        if (!scenario) {
          return null
        }

        return {
          scenario,
          required: Boolean(item.required)
        }
      })
      .filter(
        (
          item
        ): item is AdminPlatformMfaPolicyViewModel['scenarioRequirements'][number] => Boolean(item)
      ),
    factors: (result.factors ?? [])
      .map((factor) => {
        const type = toTenantMfaFactor(factor.factor)
        if (!type) {
          return null
        }

        return {
          factor: type,
          enabled: Boolean(factor.enabled),
          priority: Number(factor.priority ?? 0)
        }
      })
      .filter((factor): factor is AdminPlatformMfaPolicyViewModel['factors'][number] => Boolean(factor))
      .sort((left, right) => left.priority - right.priority)
  }
}

function toPlatformTerminalLoginPolicyViewModel(result: {
  entries?: Array<{
    enabledLoginFlows?: string[]
    supportedLoginFlows?: string[]
    terminal?: string
  }>
}): AdminPlatformTerminalLoginPolicyViewModel {
  return {
    entries: (result.entries ?? []).map((entry) => ({
      terminal: entry.terminal ?? '',
      enabledLoginFlows: entry.enabledLoginFlows ?? [],
      supportedLoginFlows: entry.supportedLoginFlows ?? []
    }))
  }
}

function toPlatformTerminalMfaPolicyViewModel(result: {
  entries?: Array<{
    allowedFactors?: MfaBindingType[]
    factorPriority?: MfaBindingType[]
    loginMfaRequired?: boolean
    newDeviceMfaRequired?: boolean
    source?: string
    terminal?: string
  }>
}): AdminPlatformTerminalMfaPolicyViewModel {
  return {
    entries: (result.entries ?? []).map(toTerminalMfaPolicyEntryViewModel)
  }
}

function toTenantTerminalMfaPolicyViewModel(result: {
  entries?: Array<{
    allowedFactors?: MfaBindingType[]
    factorPriority?: MfaBindingType[]
    loginMfaRequired?: boolean
    newDeviceMfaRequired?: boolean
    source?: string
    terminal?: string
  }>
  tenantId?: string
}): AdminTenantTerminalMfaPolicyViewModel {
  return {
    tenantId: result.tenantId ?? '',
    entries: (result.entries ?? []).map(toTerminalMfaPolicyEntryViewModel)
  }
}

function toTerminalMfaPolicyEntryViewModel(entry: {
  allowedFactors?: MfaBindingType[]
  factorPriority?: MfaBindingType[]
  loginMfaRequired?: boolean
  newDeviceMfaRequired?: boolean
  source?: string
  terminal?: string
}): AdminPlatformTerminalMfaPolicyViewModel['entries'][number] {
  return {
    terminal: entry.terminal ?? '',
    loginMfaRequired: Boolean(entry.loginMfaRequired),
    newDeviceMfaRequired: Boolean(entry.newDeviceMfaRequired),
    allowedFactors: (entry.allowedFactors ?? []).map(toTenantMfaFactor).filter(isMfaFactor),
    factorPriority: (entry.factorPriority ?? []).map(toTenantMfaFactor).filter(isMfaFactor),
    source: normalize(entry.source)
  }
}

function toTerminalMfaMutationEntry(entry: {
  allowedFactors: Array<'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'>
  factorPriority: Array<'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'>
  loginMfaRequired: boolean
  newDeviceMfaRequired: boolean
  terminal: string
}): {
  allowedFactors: Array<'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'>
  factorPriority: Array<'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'>
  loginMfaRequired: boolean
  newDeviceMfaRequired: boolean
  terminal: string
} {
  return {
    terminal: entry.terminal,
    loginMfaRequired: entry.loginMfaRequired,
    newDeviceMfaRequired: entry.newDeviceMfaRequired,
    allowedFactors: entry.allowedFactors,
    factorPriority: entry.factorPriority
  }
}

function assertTerminalMfaOperationalImpactConfirmed(input: {
  confirmOperationalImpact?: boolean
  entries: Array<{
    loginMfaRequired: boolean
    newDeviceMfaRequired: boolean
    terminal: string
  }>
}): void {
  const enablesHighThroughputTerminalMfa = input.entries.some((entry) => {
    const terminal = entry.terminal.trim().toUpperCase()
    return (
      (terminal === 'PDA' || terminal === 'KIOSK') &&
      (entry.loginMfaRequired || entry.newDeviceMfaRequired)
    )
  })

  if (enablesHighThroughputTerminalMfa && !input.confirmOperationalImpact) {
    throw new BadRequestException('Enabling MFA for PDA or KIOSK requires operational impact confirmation')
  }
}

function isMfaFactor(
  factor?: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP'
): factor is 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP' {
  return Boolean(factor)
}

function toTenantMfaFactor(
  factor?: MfaBindingType
): 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP' | undefined {
  switch (factor) {
    case MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP:
      return 'EMAIL_OTP'
    case MfaBindingType.MFA_BINDING_TYPE_SMS_OTP:
      return 'SMS_OTP'
    case MfaBindingType.MFA_BINDING_TYPE_TOTP:
      return 'TOTP'
    case MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE:
      return 'BACKUP_CODE'
    default:
      return undefined
  }
}

function toTenantMfaScenario(
  scenario?: number
): 'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'LOGIN' | 'NEW_DEVICE_LOGIN' | undefined {
  switch (scenario) {
    case 1:
      return 'LOGIN'
    case 2:
      return 'NEW_DEVICE_LOGIN'
    case 3:
      return 'CHANGE_PASSWORD'
    case 4:
      return 'CHANGE_CONTACT'
    default:
      return undefined
  }
}

function parseCursor(cursor?: string): number {
  const parsed = Number.parseInt(cursor ?? '0', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function filterOnlineUsers(
  items: HydratedOnlineUserViewModel[],
  query?: string
): AdminOnlineUserViewModel[] {
  const keyword = normalize(query)?.toLowerCase()

  if (!keyword) {
    return items.map(stripOnlineUserSearchTerms)
  }

  return items
    .filter((item) => item.searchTerms.some((value) => value.toLowerCase().includes(keyword)))
    .map(stripOnlineUserSearchTerms)
}

function stripOnlineUserSearchTerms(item: HydratedOnlineUserViewModel): AdminOnlineUserViewModel {
  return {
    userId: item.userId,
    displayName: item.displayName,
    tenantId: item.tenantId,
    tenantName: item.tenantName,
    tenantNames: item.tenantNames,
    visibleTenantCount: item.visibleTenantCount,
    activeAccountCount: item.activeAccountCount,
    activeSessionCount: item.activeSessionCount,
    lastActiveAt: item.lastActiveAt
  }
}

function looksLikeUserId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function looksLikePhone(value: string): boolean {
  const compact = value.replace(/[\s()-]/g, '')
  return /^\+?\d{6,20}$/.test(compact)
}

function maskEmail(value?: string): string | undefined {
  const normalized = normalize(value)
  if (!normalized) {
    return undefined
  }

  const [local, domain] = normalized.split('@')
  if (!local || !domain) {
    return undefined
  }

  return `${local[0]}***@${domain}`
}

function maskPhone(value?: string): string | undefined {
  const normalized = normalize(value)
  if (!normalized) {
    return undefined
  }

  const digitsOnly = normalized.replace(/\D/g, '')
  if (digitsOnly.length < 4) {
    return undefined
  }

  const prefix = normalized.startsWith('+') ? `+${digitsOnly[0]}` : digitsOnly.slice(0, 1)
  return `${prefix}*******${digitsOnly.slice(-3)}`
}
