import { Inject, Injectable, Optional } from '@nestjs/common'

import {
  AppendVisitSessionsInput,
  AppendVisitSessionsResult,
  BROWSER_ACTIVITY_AUDIT_CONTROL_POLL_SECONDS,
  BROWSER_ACTIVITY_ONLINE_PRESENCE_THRESHOLDS,
  BrowserActivityAuditControlInput,
  BrowserActivityAuditControlResult,
  BrowserActivityHeartbeatInput,
  BrowserActivityHeartbeatResult,
  BrowserActivityDisconnectInput,
  BrowserActivityDisconnectResult,
  BrowserActivityOnlinePresenceQuery,
  BrowserActivityOnlinePresenceResponse,
  BrowserActivityOnlineStatus,
  BrowserActivityOperatorContext,
  BrowserActivityPeriod,
  BrowserActivityPeriodQuery,
  BrowserActivityPolicy,
  GetEmployeeAuditGrantsInput,
  GetEmployeeAuditGrantsResponse,
  EmployeeScopedBrowserActivityQuery,
  EmployeeTimelineQuery,
  GetPolicyInput,
  resolveBrowserActivityOnlineStatus,
  UpdateEmployeeAuditGrantInput,
  UpdatePolicyInput,
  UrlSearchQuery
} from '../../application/browser-activity-application'
import { PrismaService } from './prisma.service'

interface StoredVisitSession {
  activeDurationSeconds: number
  clientVisitId: string
  domain: string
  dwellDurationSeconds: number
  employeeAccountId: string
  employeeDisplayName: string
  endedAt: Date
  foregroundDurationSeconds: number
  idleDurationSeconds: number
  pageTitle: string
  startedAt: Date
  url: string
}

const DEFAULT_POLICY: BrowserActivityPolicy = {
  aggregateRetentionDays: 365,
  enabled: false,
  rawRetentionDays: 90
}

export const BROWSER_ACTIVITY_APPLICATION_OPTIONS = Symbol('BROWSER_ACTIVITY_APPLICATION_OPTIONS')

export interface PrismaBrowserActivityApplicationOptions {
  now?: () => number
}

// PrismaBrowserActivityApplication persists browser activity policy and visit facts in the service-owned database.
@Injectable()
export class PrismaBrowserActivityApplication {
  private readonly now: () => number

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(BROWSER_ACTIVITY_APPLICATION_OPTIONS)
    options: PrismaBrowserActivityApplicationOptions = {}
  ) {
    this.now = options.now ?? (() => Date.now())
  }

  // getPolicy returns a tenant policy or the disabled-by-default P1 policy.
  async getPolicy(input: GetPolicyInput): Promise<BrowserActivityPolicy> {
    const policy = await this.prisma.browserActivityPolicy.findUnique({
      where: { tenantId: input.tenantId }
    })

    return policy
      ? {
          aggregateRetentionDays: policy.aggregateRetentionDays,
          enabled: policy.enabled,
          rawRetentionDays: policy.rawRetentionDays
        }
      : { ...DEFAULT_POLICY }
  }

  // updatePolicy upserts one tenant policy after enforcing administrator terminal and retention bounds.
  async updatePolicy(input: UpdatePolicyInput): Promise<BrowserActivityPolicy> {
    assertWebOperator(input.operator)
    assertPolicyRetention(input.policy)
    const policy = await this.prisma.browserActivityPolicy.upsert({
      create: {
        aggregateRetentionDays: input.policy.aggregateRetentionDays,
        enabled: input.policy.enabled,
        rawRetentionDays: input.policy.rawRetentionDays,
        tenantId: input.tenantId,
        updatedBy: input.operator.accountId
      },
      update: {
        aggregateRetentionDays: input.policy.aggregateRetentionDays,
        enabled: input.policy.enabled,
        rawRetentionDays: input.policy.rawRetentionDays,
        updatedBy: input.operator.accountId
      },
      where: { tenantId: input.tenantId }
    })

    return {
      aggregateRetentionDays: policy.aggregateRetentionDays,
      enabled: policy.enabled,
      rawRetentionDays: policy.rawRetentionDays
    }
  }

  // getEmployeeAuditGrants returns persisted account-level collection grants and defaults requested accounts to disabled.
  async getEmployeeAuditGrants(input: GetEmployeeAuditGrantsInput): Promise<GetEmployeeAuditGrantsResponse> {
    const records = await this.prisma.browserActivityEmployeeAuditGrant.findMany({
      where: {
        tenantId: input.tenantId,
        ...(input.accountIds?.length ? { accountId: { in: input.accountIds } } : {})
      }
    })
    const byAccount = new Map(records.map((record) => [record.accountId, record]))
    const accountIds = input.accountIds?.length ? input.accountIds : records.map((record) => record.accountId)

    return {
      grants: accountIds.map((accountId) => {
        const record = byAccount.get(accountId)
        return record
          ? {
              accountId,
              enabled: record.enabled,
              updatedAt: record.updatedAt.toISOString(),
              updatedBy: record.updatedBy
            }
          : {
              accountId,
              enabled: false
            }
      })
    }
  }

  // updateEmployeeAuditGrant replaces one tenant-account browser activity collection grant.
  async updateEmployeeAuditGrant(input: UpdateEmployeeAuditGrantInput) {
    assertWebOperator(input.operator)
    const grant = await this.prisma.browserActivityEmployeeAuditGrant.upsert({
      create: {
        accountId: requiredAccountId(input.accountId),
        enabled: input.enabled,
        tenantId: input.tenantId,
        updatedBy: input.operator.accountId
      },
      update: {
        enabled: input.enabled,
        updatedBy: input.operator.accountId
      },
      where: {
        tenantId_accountId: {
          accountId: requiredAccountId(input.accountId),
          tenantId: input.tenantId
        }
      }
    })

    return {
      accountId: grant.accountId,
      enabled: grant.enabled,
      updatedAt: grant.updatedAt.toISOString(),
      updatedBy: grant.updatedBy
    }
  }

  // appendVisitSessions accepts extension visit summaries only when the employee audit grant is enabled.
  async appendVisitSessions(input: AppendVisitSessionsInput): Promise<AppendVisitSessionsResult> {
    assertExtensionOperator(input.operator)
    const grant = await this.getEmployeeGrant(input.tenantId, input.operator.accountId)
    if (!grant.enabled) {
      return {
        acceptedCount: 0,
        policyEnabled: false,
        reasonCode: 'EMPLOYEE_AUDIT_DISABLED',
        rejectedCount: input.sessions.length
      }
    }

    await this.prisma.$transaction(
      input.sessions.map((session) =>
        this.prisma.browserActivityVisitSession.upsert({
          create: {
            activeDurationSeconds: session.activeDurationSeconds,
            clientVisitId: session.clientVisitId,
            domain: session.domain,
            dwellDurationSeconds: session.dwellDurationSeconds,
            employeeAccountId: input.operator.accountId,
            employeeDisplayName: input.operator.displayName ?? input.operator.accountId,
            endedAt: parseDate(session.endedAt),
            extensionSessionId: session.extensionSessionId,
            foregroundDurationSeconds: session.foregroundDurationSeconds,
            idleDurationSeconds: session.idleDurationSeconds,
            lastFlushedAt: parseDate(session.lastFlushedAt),
            mergeKey: session.mergeKey,
            pageTitle: session.pageTitle,
            startedAt: parseDate(session.startedAt),
            tenantId: input.tenantId,
            url: session.url
          },
          update: {
            activeDurationSeconds: session.activeDurationSeconds,
            domain: session.domain,
            dwellDurationSeconds: session.dwellDurationSeconds,
            employeeDisplayName: input.operator.displayName ?? input.operator.accountId,
            endedAt: parseDate(session.endedAt),
            foregroundDurationSeconds: session.foregroundDurationSeconds,
            idleDurationSeconds: session.idleDurationSeconds,
            lastFlushedAt: parseDate(session.lastFlushedAt),
            pageTitle: session.pageTitle,
            startedAt: parseDate(session.startedAt),
            url: session.url
          },
          where: {
            tenantId_employeeAccountId_clientVisitId: {
              clientVisitId: session.clientVisitId,
              employeeAccountId: input.operator.accountId,
              tenantId: input.tenantId
            }
          }
        })
      )
    )
    const lastDomain = input.sessions.at(-1)?.domain
    if (lastDomain) {
      await this.prisma.browserActivityOnlinePresence.updateMany({
        data: { lastObservedDomain: lastDomain },
        where: {
          accountId: input.operator.accountId,
          tenantId: input.tenantId
        }
      })
    }

    return {
      acceptedCount: input.sessions.length,
      policyEnabled: true,
      rejectedCount: 0
    }
  }

  // getAuditControl reads account-level collection authorization without writing heartbeat or visit facts.
  async getAuditControl(input: BrowserActivityAuditControlInput): Promise<BrowserActivityAuditControlResult> {
    assertExtensionOperator(input.operator)
    const grant = await this.getEmployeeGrant(input.tenantId, input.operator.accountId)
    return {
      enabled: grant.enabled,
      nextPollAfterSeconds: BROWSER_ACTIVITY_AUDIT_CONTROL_POLL_SECONDS,
      reasonCode: grant.enabled ? 'ENABLED' : 'EMPLOYEE_AUDIT_DISABLED'
    }
  }

  // heartbeat records extension liveness without accepting unauthenticated or web terminal callers.
  async heartbeat(input: BrowserActivityHeartbeatInput): Promise<BrowserActivityHeartbeatResult> {
    assertExtensionOperator(input.operator)
    const grant = await this.getEmployeeGrant(input.tenantId, input.operator.accountId)
    if (grant.enabled) {
      const observedAt = parseDate(input.observedAt)
      const existing = await this.prisma.browserActivityOnlinePresence.findUnique({
        where: {
          tenantId_accountId: {
            accountId: input.operator.accountId,
            tenantId: input.tenantId
          }
        }
      })
      const sessionStartedAt =
        existing?.extensionSessionId === input.extensionSessionId ? existing.sessionStartedAt : observedAt
      await this.prisma.$transaction([
        this.prisma.browserActivityHeartbeat.create({
          data: {
            accountId: input.operator.accountId,
            extensionSessionId: input.extensionSessionId,
            observedAt,
            tenantId: input.tenantId
          }
        }),
        this.prisma.browserActivityOnlinePresence.upsert({
          create: {
            accountId: input.operator.accountId,
            displayName: input.operator.displayName ?? input.operator.accountId,
            extensionSessionId: input.extensionSessionId,
            lastHeartbeatAt: observedAt,
            sessionStartedAt,
            tenantId: input.tenantId
          },
          update: {
            displayName: input.operator.displayName ?? input.operator.accountId,
            extensionSessionId: input.extensionSessionId,
            lastHeartbeatAt: observedAt,
            sessionStartedAt
          },
          where: {
            tenantId_accountId: {
              accountId: input.operator.accountId,
              tenantId: input.tenantId
            }
          }
        })
      ])
    }

    return {
      accepted: grant.enabled,
      nextHeartbeatAfterSeconds: 60,
      policyEnabled: grant.enabled
    }
  }

  // disconnect removes one authenticated extension session from online presence immediately on logout.
  async disconnect(input: BrowserActivityDisconnectInput): Promise<BrowserActivityDisconnectResult> {
    assertExtensionOperator(input.operator)
    parseDate(input.observedAt)
    await this.prisma.browserActivityOnlinePresence.deleteMany({
      where: {
        accountId: input.operator.accountId,
        extensionSessionId: input.extensionSessionId,
        tenantId: input.tenantId
      }
    })

    return { accepted: true }
  }

  // getOverview returns tenant-level factual duration metrics and employee ranking.
  async getOverview(input: BrowserActivityPeriodQuery) {
    const visits = await this.listVisits(input.tenantId, input.period)
    const presence = await this.getOnlinePresence({ tenantId: input.tenantId, status: 'ALL' })
    const presenceByAccount = new Map(presence.employees.map((employee) => [employee.accountId, employee]))
    const employees = [...groupBy(visits, (visit) => visit.employeeAccountId).entries()]
      .map(([accountId, employeeVisits]) => ({
        accountId,
        activeDurationSeconds: sum(employeeVisits, 'activeDurationSeconds'),
        displayName: employeeVisits[0]?.employeeDisplayName ?? accountId,
        foregroundDurationSeconds: sum(employeeVisits, 'foregroundDurationSeconds'),
        idleDurationSeconds: sum(employeeVisits, 'idleDurationSeconds'),
        lastHeartbeatAt: presenceByAccount.get(accountId)?.lastHeartbeatAt,
        onlineStatus: presenceByAccount.get(accountId)?.onlineStatus ?? 'OFFLINE',
        onlineDurationSeconds: sum(employeeVisits, 'dwellDurationSeconds'),
        pageViewCount: employeeVisits.length
      }))
      .sort((left, right) => right.activeDurationSeconds - left.activeDurationSeconds)

    return {
      employees,
      metrics: {
        activeDurationSeconds: sum(visits, 'activeDurationSeconds'),
        employeeCount: employees.length,
        foregroundDurationSeconds: sum(visits, 'foregroundDurationSeconds'),
        idleDurationSeconds: sum(visits, 'idleDurationSeconds'),
        onlineEmployeeCount: presence.summary.onlineCount,
        onlineDurationSeconds: sum(visits, 'dwellDurationSeconds'),
        staleEmployeeCount: presence.summary.staleCount,
        urlCount: new Set(visits.map((visit) => visit.url)).size
      },
      period: input.period,
      policy: await this.getPolicy({ tenantId: input.tenantId })
    }
  }

  // getEmployeeTimeline returns chronological visit facts for one employee account.
  async getEmployeeTimeline(input: EmployeeTimelineQuery) {
    const visits = (await this.listVisits(input.tenantId, input.period))
      .filter((visit) => visit.employeeAccountId === input.employeeAccountId)
      .sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime())

    return {
      employeeAccountId: input.employeeAccountId,
      visits: visits.map((visit) => ({
        activeDurationSeconds: visit.activeDurationSeconds,
        domain: visit.domain,
        dwellDurationSeconds: visit.dwellDurationSeconds,
        endedAt: visit.endedAt.toISOString(),
        foregroundDurationSeconds: visit.foregroundDurationSeconds,
        idleDurationSeconds: visit.idleDurationSeconds,
        pageTitle: visit.pageTitle,
        startedAt: visit.startedAt.toISOString(),
        url: visit.url,
        visitId: visit.clientVisitId
      }))
    }
  }

  // getDomainAggregation returns domain-level aggregates for the tenant or selected employee.
  async getDomainAggregation(input: EmployeeScopedBrowserActivityQuery) {
    const visits = (await this.listVisits(input.tenantId, input.period)).filter(
      (visit) => !input.employeeAccountId || visit.employeeAccountId === input.employeeAccountId
    )
    const domains = [...groupBy(visits, (visit) => visit.domain).entries()].map(([domain, domainVisits]) => ({
      activeDurationSeconds: sum(domainVisits, 'activeDurationSeconds'),
      domain,
      employeeCount: new Set(domainVisits.map((visit) => visit.employeeAccountId)).size,
      foregroundDurationSeconds: sum(domainVisits, 'foregroundDurationSeconds'),
      idleDurationSeconds: sum(domainVisits, 'idleDurationSeconds'),
      urlCount: new Set(domainVisits.map((visit) => visit.url)).size,
      visitCount: domainVisits.length
    }))

    return {
      domains: domains.sort((left, right) => right.activeDurationSeconds - left.activeDurationSeconds)
    }
  }

  // searchUrls records a sensitive read audit and returns URL/title matches.
  async searchUrls(input: UrlSearchQuery & { operator?: BrowserActivityOperatorContext; reason?: string; traceId?: string }) {
    const keyword = input.keyword.trim().toLowerCase()
    if (!keyword) {
      throw new Error('URL search keyword is required')
    }

    await this.prisma.browserActivityReadAudit.create({
      data: {
        action: 'URL_SEARCH',
        keyword: input.keyword,
        operatorAccountId: input.operator?.accountId ?? 'UNKNOWN',
        reason: input.reason ?? null,
        tenantId: input.tenantId,
        traceId: input.traceId ?? null
      }
    })

    const visits = (await this.listVisits(input.tenantId, input.period)).filter((visit) =>
      `${visit.url} ${visit.domain} ${visit.pageTitle}`.toLowerCase().includes(keyword)
    )
    const results = [...groupBy(visits, (visit) => `${visit.employeeAccountId}:${visit.url}`).values()].map(
      (urlVisits) => {
        const latest = [...urlVisits].sort(
          (left, right) => right.endedAt.getTime() - left.endedAt.getTime()
        )[0]!

        return {
          activeDurationSeconds: sum(urlVisits, 'activeDurationSeconds'),
          domain: latest.domain,
          employeeDisplayName: latest.employeeDisplayName,
          lastVisitedAt: latest.endedAt.toISOString(),
          pageTitle: latest.pageTitle,
          url: latest.url,
          visitCount: urlVisits.length
        }
      }
    )

    return {
      results: results.sort((left, right) => new Date(right.lastVisitedAt).getTime() - new Date(left.lastVisitedAt).getTime())
    }
  }

  // getOnlinePresence returns heartbeat-derived collection-channel status for tenant accounts.
  async getOnlinePresence(input: BrowserActivityOnlinePresenceQuery): Promise<BrowserActivityOnlinePresenceResponse> {
    const serverTimeMs = this.now()
    const records = await this.prisma.browserActivityOnlinePresence.findMany({
      where: { tenantId: input.tenantId }
    })
    const employees = records
      .map((record) => ({
        accountId: record.accountId,
        displayName: record.displayName,
        extensionSessionId: record.extensionSessionId,
        lastHeartbeatAt: record.lastHeartbeatAt.toISOString(),
        lastObservedDomain: record.lastObservedDomain ?? undefined,
        onlineStatus: resolveBrowserActivityOnlineStatus(
          record.lastHeartbeatAt.toISOString(),
          serverTimeMs
        ),
        sessionStartedAt: record.sessionStartedAt.toISOString()
      }))
      .filter((presence) => shouldIncludePresence(presence, input, serverTimeMs))
      .sort((left, right) => comparePresence(left.onlineStatus, right.onlineStatus) || left.displayName.localeCompare(right.displayName))

    return {
      employees,
      serverTime: new Date(serverTimeMs).toISOString(),
      summary: {
        offlineCount: employees.filter((employee) => employee.onlineStatus === 'OFFLINE').length,
        onlineCount: employees.filter((employee) => employee.onlineStatus === 'ONLINE').length,
        staleCount: employees.filter((employee) => employee.onlineStatus === 'STALE').length
      },
      thresholds: BROWSER_ACTIVITY_ONLINE_PRESENCE_THRESHOLDS
    }
  }

  // listVisits loads privacy-bounded visit facts inside the selected rolling monitoring period.
  private async listVisits(tenantId: string, period: BrowserActivityPeriod): Promise<StoredVisitSession[]> {
    const records = await this.prisma.browserActivityVisitSession.findMany({
      orderBy: { startedAt: 'asc' },
      where: {
        endedAt: {
          gte: resolvePeriodStart(period, this.now())
        },
        tenantId
      }
    })
    return records.map((record) => ({
      activeDurationSeconds: record.activeDurationSeconds,
      clientVisitId: record.clientVisitId,
      domain: record.domain,
      dwellDurationSeconds: record.dwellDurationSeconds,
      employeeAccountId: record.employeeAccountId,
      employeeDisplayName: record.employeeDisplayName,
      endedAt: record.endedAt,
      foregroundDurationSeconds: record.foregroundDurationSeconds,
      idleDurationSeconds: record.idleDurationSeconds,
      pageTitle: record.pageTitle,
      startedAt: record.startedAt,
      url: record.url
    }))
  }

  // getEmployeeGrant resolves one account grant without falling back to tenant policy.
  private async getEmployeeGrant(tenantId: string, accountId: string) {
    const result = await this.getEmployeeAuditGrants({ accountIds: [accountId], tenantId })
    return result.grants[0] ?? { accountId, enabled: false }
  }
}

// assertExtensionOperator fails closed when ingest is not backed by an extension session.
function assertExtensionOperator(operator: BrowserActivityOperatorContext): void {
  if (operator.terminal !== 'BROWSER_EXTENSION') {
    throw new Error('BROWSER_EXTENSION terminal is required')
  }
}

// assertWebOperator keeps policy management on authenticated web administrator flows.
function assertWebOperator(operator: BrowserActivityOperatorContext): void {
  if (operator.terminal !== 'WEB') {
    throw new Error('WEB terminal is required')
  }
}

// assertPolicyRetention enforces the P1 tenant-level retention bounds.
function assertPolicyRetention(policy: BrowserActivityPolicy): void {
  if (policy.rawRetentionDays < 30 || policy.rawRetentionDays > 365) {
    throw new Error('Raw retention days must be between 30 and 365')
  }

  if (policy.aggregateRetentionDays < 90 || policy.aggregateRetentionDays > 1095) {
    throw new Error('Aggregate retention days must be between 90 and 1095')
  }
}

// requiredAccountId prevents blank employee grant records from being persisted.
function requiredAccountId(value: string): string {
  const normalized = value.trim()
  if (!normalized) {
    throw new Error('Browser activity employee account id is required')
  }
  return normalized
}

// parseDate converts required ISO timestamp fields into Date objects.
function parseDate(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid browser activity timestamp')
  }
  return date
}

// resolvePeriodStart calculates rolling lower bounds for browser monitoring period filters.
function resolvePeriodStart(period: BrowserActivityPeriod, nowMs: number): Date {
  const hour = 60 * 60 * 1000
  const day = 24 * hour
  const durations: Record<BrowserActivityPeriod, number> = {
    LAST_1_DAY: day,
    LAST_1_HOUR: hour,
    LAST_1_MONTH: 30 * day,
    LAST_1_WEEK: 7 * day,
    LAST_30_DAYS: 30 * day,
    LAST_7_DAYS: 7 * day
  }
  return new Date(nowMs - durations[period])
}

// shouldIncludePresence applies status and recent-offline filters to persisted presence rows.
function shouldIncludePresence(
  presence: { lastHeartbeatAt: string; onlineStatus: BrowserActivityOnlineStatus },
  query: BrowserActivityOnlinePresenceQuery,
  serverTimeMs: number
): boolean {
  if (query.status && query.status !== 'ALL' && presence.onlineStatus !== query.status) {
    return false
  }
  if (presence.onlineStatus !== 'OFFLINE' || query.includeOfflineWithinMinutes === undefined) {
    return true
  }
  const ageMs = serverTimeMs - parseDate(presence.lastHeartbeatAt).getTime()
  return ageMs <= query.includeOfflineWithinMinutes * 60 * 1000
}

// comparePresence keeps active collection-channel states before delayed and offline states.
function comparePresence(left: BrowserActivityOnlineStatus, right: BrowserActivityOnlineStatus): number {
  const rank: Record<BrowserActivityOnlineStatus, number> = {
    ONLINE: 0,
    STALE: 1,
    OFFLINE: 2
  }
  return rank[left] - rank[right]
}

// groupBy groups visit facts for aggregate read models.
function groupBy<T>(items: T[], getKey: (item: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const item of items) {
    const key = getKey(item)
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }
  return grouped
}

// sum totals one numeric visit metric.
function sum<T>(items: T[], key: keyof T): number {
  return items.reduce((total, item) => total + Number((item as Record<string, unknown>)[String(key)] ?? 0), 0)
}
