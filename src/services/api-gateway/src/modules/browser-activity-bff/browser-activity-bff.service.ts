import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common'

import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { PermissionProxyService } from '../permission-service/permission-service.service'

export const BROWSER_ACTIVITY_CLIENT = Symbol('BROWSER_ACTIVITY_CLIENT')

export interface BrowserActivityClientPort {
  appendVisitSessions(input: Record<string, unknown>): Promise<unknown>
  disconnect(input: Record<string, unknown>): Promise<unknown>
  getDomainAggregation(input: Record<string, unknown>): Promise<unknown>
  getEmployeeAuditGrants(input: Record<string, unknown>): Promise<unknown>
  getAuditControl(input: Record<string, unknown>): Promise<unknown>
  getEmployeeTimeline(input: Record<string, unknown>): Promise<unknown>
  getOnlinePresence(input: Record<string, unknown>): Promise<unknown>
  getOverview(input: Record<string, unknown>): Promise<unknown>
  getPolicy(input: Record<string, unknown>): Promise<unknown>
  heartbeat(input: Record<string, unknown>): Promise<unknown>
  searchUrls(input: Record<string, unknown>): Promise<unknown>
  updateEmployeeAuditGrant(input: Record<string, unknown>): Promise<unknown>
  updatePolicy(input: Record<string, unknown>): Promise<unknown>
}

type BrowserActivityPeriod =
  | 'LAST_1_DAY'
  | 'LAST_1_HOUR'
  | 'LAST_1_MONTH'
  | 'LAST_1_WEEK'
  | 'LAST_30_DAYS'
  | 'LAST_7_DAYS'

interface BrowserActivityPolicyPayload {
  aggregateRetentionDays: number
  enabled: boolean
  rawRetentionDays: number
}

interface BrowserActivityEmployeeAuditGrantPayload {
  enabled: boolean
}

interface BrowserActivityQuery {
  accountIds?: string | string[]
  employeeAccountId?: string
  includeOfflineWithinMinutes?: number
  keyword?: string
  period?: BrowserActivityPeriod | string
  status?: string
}

// BrowserActivityBffService maps authenticated gateway sessions into trusted browser-activity requests.
@Injectable()
export class BrowserActivityBffService {
  constructor(
    @Inject(BROWSER_ACTIVITY_CLIENT)
    private readonly browserActivityClient: BrowserActivityClientPort,
    private readonly permissionService: PermissionProxyService
  ) {}

  /** appendVisitSessions forwards extension visit summaries after replacing client context with session context. */
  async appendVisitSessions(input: { sessions?: unknown[] }, source: DownstreamRequestSource) {
    const context = resolveExtensionContext(source)

    return this.browserActivityClient.appendVisitSessions({
      audit: {
        reason: 'BROWSER_EXTENSION_INGEST'
      },
      operator: context.operator,
      sessions: input.sessions ?? [],
      tenantId: context.tenantId,
      trace: context.trace
    })
  }

  /** heartbeat forwards authenticated extension heartbeat without trusting client tenant claims. */
  async heartbeat(input: { extensionSessionId: string; observedAt: string }, source: DownstreamRequestSource) {
    const context = resolveExtensionContext(source)

    return this.browserActivityClient.heartbeat({
      extensionSessionId: input.extensionSessionId,
      observedAt: input.observedAt,
      operator: context.operator,
      tenantId: context.tenantId,
      trace: context.trace
    })
  }

  /** disconnect marks the authenticated extension collection session offline without trusting client tenant claims. */
  async disconnect(input: { extensionSessionId: string; observedAt: string }, source: DownstreamRequestSource) {
    const context = resolveExtensionContext(source)

    return this.browserActivityClient.disconnect({
      extensionSessionId: input.extensionSessionId,
      observedAt: input.observedAt,
      operator: context.operator,
      tenantId: context.tenantId,
      trace: context.trace
    })
  }

  /** getAuditControl lets the extension poll collection authorization without writing audit heartbeat facts. */
  async getAuditControl(_input: Record<string, never>, source: DownstreamRequestSource) {
    const context = resolveExtensionContext(source)

    return this.browserActivityClient.getAuditControl({
      operator: context.operator,
      tenantId: context.tenantId,
      trace: context.trace
    })
  }

  /** getPolicy reads the tenant browser-activity policy from trusted web administrator context. */
  async getPolicy(source: DownstreamRequestSource) {
    const context = resolveWebContext(source, 'browser activity policy read requires web terminal')

    return this.browserActivityClient.getPolicy(context)
  }

  /** updatePolicy updates the tenant browser-activity policy without accepting client tenant claims. */
  async updatePolicy(input: BrowserActivityPolicyPayload, source: DownstreamRequestSource) {
    const context = resolveWebContext(source, 'browser activity policy update requires web terminal')

    return this.browserActivityClient.updatePolicy({
      audit: {
        reason: 'BROWSER_ACTIVITY_POLICY_UPDATE'
      },
      operator: context.operator,
      policy: {
        aggregateRetentionDays: input.aggregateRetentionDays,
        enabled: input.enabled,
        rawRetentionDays: input.rawRetentionDays
      },
      tenantId: context.tenantId,
      trace: context.trace
    })
  }

  /** getOverview reads tenant browser-activity overview facts for tenant-web administrators. */
  async getOverview(query: BrowserActivityQuery, source: DownstreamRequestSource) {
    const context = resolveWebContext(source, 'browser activity overview requires web terminal')

    const overview = await this.browserActivityClient.getOverview({
      ...context,
      period: normalizePeriod(query.period)
    }) as { employees?: Array<Record<string, unknown>> }

    return this.enrichOverviewEmployees(overview, context, source)
  }

  /** updateEmployeeAuditGrant enables or disables one employee collection grant after terminal access validation. */
  async getEmployeeAuditGrants(query: BrowserActivityQuery, source: DownstreamRequestSource) {
    const context = resolveWebContext(source, 'browser activity employee grant read requires web terminal')
    const accountIds = normalizeAccountIds(query.accountIds)
    const grantsResult = await this.browserActivityClient.getEmployeeAuditGrants({
      ...context,
      accountIds
    }) as { grants?: Array<{ accountId?: string; enabled?: boolean; updatedAt?: string; updatedBy?: string }> }
    const terminalAccessByAccount = new Map(
      await Promise.all(
        accountIds.map(async (accountId) => [
          accountId,
          await this.getAccountTerminalAccess(accountId, context.tenantId, source)
        ] as const)
      )
    )

    return {
      grants: (grantsResult.grants ?? []).map((grant) => {
        const accountId = String(grant.accountId ?? '')
        return {
          ...grant,
          browserExtensionLoginAllowed:
            hasBrowserExtensionTerminalAccess(terminalAccessByAccount.get(accountId))
        }
      })
    }
  }

  /** updateEmployeeAuditGrant enables or disables one employee collection grant after terminal access validation. */
  async updateEmployeeAuditGrant(
    employeeAccountId: string,
    input: BrowserActivityEmployeeAuditGrantPayload,
    source: DownstreamRequestSource
  ) {
    const context = resolveWebContext(source, 'browser activity employee grant update requires web terminal')
    const accountId = normalize(employeeAccountId)
    if (!accountId) {
      throw new BadRequestException('employee account id is required')
    }
    if (input.enabled) {
      const terminalAccess = await this.getAccountTerminalAccess(accountId, context.tenantId, source)
      if (!hasBrowserExtensionTerminalAccess(terminalAccess)) {
        throw new BadRequestException('Browser Extension terminal access is required before enabling audit collection')
      }
    }

    return this.browserActivityClient.updateEmployeeAuditGrant({
      audit: {
        reason: 'BROWSER_ACTIVITY_EMPLOYEE_GRANT_UPDATE'
      },
      accountId,
      enabled: input.enabled,
      operator: context.operator,
      tenantId: context.tenantId,
      trace: context.trace
    })
  }

  /** getOnlinePresence reads heartbeat-derived extension collection-channel status for tenant employees. */
  async getOnlinePresence(query: BrowserActivityQuery, source: DownstreamRequestSource) {
    const context = resolveWebContext(source, 'browser activity online presence requires web terminal')

    return this.browserActivityClient.getOnlinePresence({
      ...context,
      includeOfflineWithinMinutes: normalizePositiveInteger(query.includeOfflineWithinMinutes),
      status: normalizePresenceStatus(query.status)
    })
  }

  /** getEmployeeTimeline reads one employee visit timeline through trusted web administrator context. */
  async getEmployeeTimeline(
    employeeAccountId: string,
    query: BrowserActivityQuery,
    source: DownstreamRequestSource
  ) {
    const context = resolveWebContext(source, 'browser activity employee timeline requires web terminal')

    return this.browserActivityClient.getEmployeeTimeline({
      ...context,
      employeeAccountId,
      period: normalizePeriod(query.period)
    })
  }

  /** getDomainAggregation reads domain aggregates for the tenant or selected employee. */
  async getDomainAggregation(query: BrowserActivityQuery, source: DownstreamRequestSource) {
    const context = resolveWebContext(source, 'browser activity domain aggregation requires web terminal')

    return this.browserActivityClient.getDomainAggregation({
      ...context,
      employeeAccountId: normalize(query.employeeAccountId),
      period: normalizePeriod(query.period)
    })
  }

  /** searchUrls reads sensitive URL detail facts and records a dedicated read-audit reason. */
  async searchUrls(query: BrowserActivityQuery, source: DownstreamRequestSource) {
    const context = resolveWebContext(source, 'browser activity URL search requires web terminal')
    const keyword = normalize(query.keyword)
    if (!keyword) {
      throw new BadRequestException('URL search keyword is required')
    }

    return this.browserActivityClient.searchUrls({
      audit: {
        reason: 'BROWSER_ACTIVITY_URL_DETAIL_SEARCH'
      },
      ...context,
      keyword,
      period: normalizePeriod(query.period)
    })
  }

  // enrichOverviewEmployees adds account-level audit grant and plugin-login eligibility without moving ownership.
  private async enrichOverviewEmployees(
    overview: { employees?: Array<Record<string, unknown>> },
    context: ReturnType<typeof resolveWebContext>,
    source: DownstreamRequestSource
  ) {
    const employees = overview.employees ?? []
    const accountIds = employees.map((employee) => normalize(String(employee.accountId ?? ''))).filter(Boolean) as string[]
    if (accountIds.length === 0) {
      return overview
    }

    const grantsResult = await this.browserActivityClient.getEmployeeAuditGrants({
      ...context,
      accountIds
    }) as { grants?: Array<{ accountId?: string; enabled?: boolean }> }
    const grantsByAccount = new Map((grantsResult.grants ?? []).map((grant) => [grant.accountId, grant]))
    const terminalAccessByAccount = new Map(
      await Promise.all(
        accountIds.map(async (accountId) => [
          accountId,
          await this.getAccountTerminalAccess(accountId, context.tenantId, source)
        ] as const)
      )
    )

    return {
      ...overview,
      employees: employees.map((employee) => {
        const accountId = String(employee.accountId ?? '')
        const terminalAccess = terminalAccessByAccount.get(accountId)
        return {
          ...employee,
          auditEnabled: grantsByAccount.get(accountId)?.enabled === true,
          browserExtensionLoginAllowed: hasBrowserExtensionTerminalAccess(terminalAccess)
        }
      })
    }
  }

  // getAccountTerminalAccess reads permission-service's source of truth for plugin login eligibility.
  private async getAccountTerminalAccess(accountId: string, tenantId: string, source: DownstreamRequestSource) {
    return this.permissionService.getAccountTerminalAccess({
      accountId,
      scopeLevel: 'TENANT',
      tenantId
    }, source)
  }
}

// resolveExtensionContext extracts the trusted tenant and operator context from gateway auth claims.
function resolveExtensionContext(source: DownstreamRequestSource) {
  if (source.user?.terminal !== 'BROWSER_EXTENSION') {
    throw new ForbiddenException('browser activity ingest requires browser extension terminal')
  }

  const tenantId = normalize(source.user.tenantId) ?? normalize(source.user.tid)
  const accountId = normalize(source.user.aid) ?? normalize(source.user.id) ?? normalize(source.user.sub)
  if (!tenantId || !accountId) {
    throw new ForbiddenException('browser activity ingest requires tenant account context')
  }

  return {
    operator: {
      accountId,
      displayName: normalize(source.user.displayName) ?? '',
      terminal: 'BROWSER_EXTENSION',
      userId: normalize(source.user.userId) ?? normalize(source.user.sub) ?? ''
    },
    tenantId,
    trace: {
      requestId: normalize(source.requestId) ?? '',
      traceId: normalize(source.traceId) ?? ''
    }
  }
}

// resolveWebContext extracts tenant and operator context for tenant-web administrator reads and writes.
function resolveWebContext(source: DownstreamRequestSource, message: string) {
  if (source.user?.terminal !== 'WEB') {
    throw new ForbiddenException(message)
  }

  const tenantId = normalize(source.user.tenantId) ?? normalize(source.user.tid)
  const accountId = normalize(source.user.aid) ?? normalize(source.user.id) ?? normalize(source.user.sub)
  if (!tenantId || !accountId) {
    throw new ForbiddenException('browser activity admin access requires tenant account context')
  }

  return {
    operator: {
      accountId,
      displayName: normalize(source.user.displayName) ?? '',
      terminal: 'WEB',
      userId: normalize(source.user.userId) ?? normalize(source.user.sub) ?? ''
    },
    tenantId,
    trace: {
      requestId: normalize(source.requestId) ?? '',
      traceId: normalize(source.traceId) ?? ''
    }
  }
}

// normalizePeriod keeps reads on supported browser monitoring periods while preserving legacy callers.
function normalizePeriod(value?: string): BrowserActivityPeriod {
  if (
    value === 'LAST_1_HOUR' ||
    value === 'LAST_1_DAY' ||
    value === 'LAST_1_WEEK' ||
    value === 'LAST_1_MONTH' ||
    value === 'LAST_7_DAYS' ||
    value === 'LAST_30_DAYS'
  ) {
    return value
  }
  return 'LAST_1_DAY'
}

// normalizePresenceStatus keeps status filters on heartbeat-derived collection-channel states.
function normalizePresenceStatus(value?: string): 'ALL' | 'OFFLINE' | 'ONLINE' | 'STALE' | undefined {
  if (value === 'ALL' || value === 'ONLINE' || value === 'STALE' || value === 'OFFLINE') {
    return value
  }
  return undefined
}

// normalizePositiveInteger prevents blank query values from becoming misleading presence filters.
function normalizePositiveInteger(value?: number): number | undefined {
  return Number.isInteger(value) && value > 0 ? value : undefined
}

// normalize trims optional claim values and treats blank strings as absent.
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized || undefined
}

// hasBrowserExtensionTerminalAccess normalizes permission-service terminal access responses at the BFF boundary.
function hasBrowserExtensionTerminalAccess(value: unknown): boolean {
  const candidate = value as { effectiveAllowedTerminals?: unknown } | undefined
  return normalizeStringArray(candidate?.effectiveAllowedTerminals).includes('BROWSER_EXTENSION')
}

// normalizeStringArray treats omitted proto repeated fields as empty arrays.
function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

// normalizeAccountIds accepts repeated or comma-separated query values from tenant-web.
function normalizeAccountIds(value?: string | string[]): string[] {
  const values = Array.isArray(value) ? value : value?.split(',') ?? []
  return [...new Set(values.map((item) => normalize(item)).filter(Boolean))] as string[]
}
