export type BrowserActivityTerminal = 'BROWSER_EXTENSION' | 'WEB'
export type BrowserActivityOnlineStatus = 'OFFLINE' | 'ONLINE' | 'STALE'
export type BrowserActivityOnlinePresenceStatusFilter = BrowserActivityOnlineStatus | 'ALL'
export type BrowserActivityPeriod =
  | 'LAST_1_DAY'
  | 'LAST_1_HOUR'
  | 'LAST_1_MONTH'
  | 'LAST_1_WEEK'
  | 'LAST_30_DAYS'
  | 'LAST_7_DAYS'

export interface BrowserActivityOperatorContext {
  accountId: string
  displayName?: string
  terminal: BrowserActivityTerminal | string
  userId?: string
}

/** Carries method-owned audit facts derived from verified execution rather than request authority. */
export interface BrowserActivityAuditContext {
  action: string
  operatorAccountId: string
  requestId: string
  sessionId: string
  tenantId: string
  traceId: string
  employeeAccountId?: string
  keyword?: string
}

export interface BrowserActivityPolicy {
  aggregateRetentionDays: number
  enabled: boolean
  rawRetentionDays: number
}

export interface BrowserActivityVisitSessionSummary {
  activeDurationSeconds: number
  clientVisitId: string
  domain: string
  dwellDurationSeconds: number
  endedAt: string
  extensionSessionId: string
  foregroundDurationSeconds: number
  idleDurationSeconds: number
  lastFlushedAt: string
  mergeKey: string
  pageTitle: string
  startedAt: string
  url: string
}

export interface GetPolicyInput {
  tenantId: string
}

export interface UpdatePolicyInput {
  audit: BrowserActivityAuditContext
  operator: BrowserActivityOperatorContext
  policy: BrowserActivityPolicy
  tenantId: string
}

export interface BrowserActivityEmployeeAuditGrant {
  accountId: string
  enabled: boolean
  updatedAt?: string
  updatedBy?: string
}

export interface GetEmployeeAuditGrantsInput {
  accountIds?: string[]
  tenantId: string
}

export interface GetEmployeeAuditGrantsResponse {
  grants: BrowserActivityEmployeeAuditGrant[]
}

export interface UpdateEmployeeAuditGrantInput {
  accountId: string
  enabled: boolean
  operator: BrowserActivityOperatorContext
  tenantId: string
  audit: BrowserActivityAuditContext
}

export interface AppendVisitSessionsInput {
  operator: BrowserActivityOperatorContext
  sessions: BrowserActivityVisitSessionSummary[]
  tenantId: string
}

export interface AppendVisitSessionsResult {
  acceptedCount: number
  policyEnabled: boolean
  reasonCode?: BrowserActivityAuditControlReasonCode
  rejectedCount: number
}

export type BrowserActivityAuditControlReasonCode = 'EMPLOYEE_AUDIT_DISABLED' | 'ENABLED'

export interface BrowserActivityAuditControlInput {
  operator: BrowserActivityOperatorContext
  tenantId: string
}

export interface BrowserActivityAuditControlResult {
  enabled: boolean
  nextPollAfterSeconds: number
  reasonCode: BrowserActivityAuditControlReasonCode
}

export interface BrowserActivityHeartbeatInput {
  extensionSessionId: string
  observedAt: string
  operator: BrowserActivityOperatorContext
  tenantId: string
}

export interface BrowserActivityHeartbeatResult {
  accepted: boolean
  nextHeartbeatAfterSeconds: number
  policyEnabled: boolean
}

export interface BrowserActivityDisconnectInput {
  extensionSessionId: string
  observedAt: string
  operator: BrowserActivityOperatorContext
  tenantId: string
}

export interface BrowserActivityDisconnectResult {
  accepted: boolean
}

export interface BrowserActivityOnlinePresenceQuery {
  includeOfflineWithinMinutes?: number
  status?: BrowserActivityOnlinePresenceStatusFilter
  tenantId: string
}

export interface BrowserActivityOnlinePresenceItem {
  accountId: string
  displayName: string
  extensionSessionId: string
  lastHeartbeatAt: string
  lastObservedDomain?: string
  onlineStatus: BrowserActivityOnlineStatus
  sessionStartedAt: string
}

export interface BrowserActivityOnlinePresenceResponse {
  employees: BrowserActivityOnlinePresenceItem[]
  serverTime: string
  summary: {
    offlineCount: number
    onlineCount: number
    staleCount: number
  }
  thresholds: {
    heartbeatIntervalSeconds: number
    onlineWithinSeconds: number
    staleWithinSeconds: number
  }
}

export interface BrowserActivityPeriodQuery {
  period: BrowserActivityPeriod
  tenantId: string
}

export interface EmployeeScopedBrowserActivityQuery extends BrowserActivityPeriodQuery {
  employeeAccountId?: string
}

export interface EmployeeTimelineQuery extends BrowserActivityPeriodQuery {
  employeeAccountId: string
}

export interface UrlSearchQuery extends BrowserActivityPeriodQuery {
  keyword: string
}

interface StoredVisitSession extends BrowserActivityVisitSessionSummary {
  employeeAccountId: string
  employeeDisplayName: string
}

interface StoredOnlinePresence {
  accountId: string
  displayName: string
  extensionSessionId: string
  lastHeartbeatAt: string
  lastObservedDomain?: string
  sessionStartedAt: string
}

export interface BrowserActivityApplicationOptions {
  now?: () => number
}

export const BROWSER_ACTIVITY_ONLINE_PRESENCE_THRESHOLDS = {
  heartbeatIntervalSeconds: 60,
  onlineWithinSeconds: 90,
  staleWithinSeconds: 180
} as const
export const BROWSER_ACTIVITY_AUDIT_CONTROL_POLL_SECONDS = 60

const DEFAULT_POLICY: BrowserActivityPolicy = {
  aggregateRetentionDays: 365,
  enabled: false,
  rawRetentionDays: 90
}

// BrowserActivityApplication coordinates P1 policy and visit-summary use cases for tests and adapters.
export class BrowserActivityApplication {
  private readonly employeeAuditGrants = new Map<
    string,
    Map<string, BrowserActivityEmployeeAuditGrant>
  >()
  private readonly policies = new Map<string, BrowserActivityPolicy>()
  private readonly presence = new Map<string, Map<string, StoredOnlinePresence>>()
  private readonly now: () => number
  private readonly visitSessions = new Map<string, StoredVisitSession[]>()

  constructor(options: BrowserActivityApplicationOptions = {}) {
    this.now = options.now ?? (() => Date.now())
  }

  // getPolicy returns the tenant policy or the disabled-by-default P1 policy.
  async getPolicy(input: GetPolicyInput): Promise<BrowserActivityPolicy> {
    return { ...(this.policies.get(input.tenantId) ?? DEFAULT_POLICY) }
  }

  // updatePolicy stores one tenant policy after enforcing P1 retention bounds.
  async updatePolicy(input: UpdatePolicyInput): Promise<BrowserActivityPolicy> {
    assertWebOperator(input.operator)
    assertTrustedAudit(input.audit)
    assertAuditMatchesTenant(input.audit, input.tenantId)
    assertAuditMatchesWrite(input.audit, input.operator, input.tenantId)
    assertPolicyRetention(input.policy)
    const policy = { ...input.policy }
    this.policies.set(input.tenantId, policy)
    return policy
  }

  // getEmployeeAuditGrants returns account-level collection grants and defaults requested accounts to disabled.
  async getEmployeeAuditGrants(
    input: GetEmployeeAuditGrantsInput
  ): Promise<GetEmployeeAuditGrantsResponse> {
    const tenantGrants =
      this.employeeAuditGrants.get(input.tenantId) ??
      new Map<string, BrowserActivityEmployeeAuditGrant>()
    const accountIds = input.accountIds?.length ? input.accountIds : [...tenantGrants.keys()]
    return {
      grants: accountIds.map((accountId) => ({
        accountId,
        enabled: tenantGrants.get(accountId)?.enabled ?? false,
        updatedAt: tenantGrants.get(accountId)?.updatedAt,
        updatedBy: tenantGrants.get(accountId)?.updatedBy
      }))
    }
  }

  // updateEmployeeAuditGrant replaces one account-level browser activity collection grant.
  async updateEmployeeAuditGrant(
    input: UpdateEmployeeAuditGrantInput
  ): Promise<BrowserActivityEmployeeAuditGrant> {
    assertWebOperator(input.operator)
    assertTrustedAudit(input.audit)
    assertAuditMatchesTenant(input.audit, input.tenantId)
    assertAuditMatchesWrite(input.audit, input.operator, input.tenantId)
    const tenantGrants =
      this.employeeAuditGrants.get(input.tenantId) ??
      new Map<string, BrowserActivityEmployeeAuditGrant>()
    const grant = {
      accountId: requiredAccountId(input.accountId),
      enabled: input.enabled,
      updatedAt: new Date(this.now()).toISOString(),
      updatedBy: input.operator.accountId
    }
    tenantGrants.set(grant.accountId, grant)
    this.employeeAuditGrants.set(input.tenantId, tenantGrants)
    return grant
  }

  // getAuditControl returns the extension control-plane decision without writing heartbeat or visit facts.
  async getAuditControl(
    input: BrowserActivityAuditControlInput
  ): Promise<BrowserActivityAuditControlResult> {
    assertExtensionOperator(input.operator)
    const grant = await this.getEmployeeGrant(input.tenantId, input.operator.accountId)
    return toAuditControlResult(grant.enabled)
  }

  // appendVisitSessions accepts visit summaries only from authenticated browser-extension terminal context.
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

    const existing = this.visitSessions.get(input.tenantId) ?? []
    const storedSessions = input.sessions.map((session) => ({
      ...session,
      employeeAccountId: input.operator.accountId,
      employeeDisplayName: input.operator.displayName ?? input.operator.accountId
    }))
    existing.push(...storedSessions)
    this.visitSessions.set(input.tenantId, existing)
    this.updateLastObservedDomain(
      input.tenantId,
      input.operator.accountId,
      storedSessions.at(-1)?.domain
    )

    return {
      acceptedCount: input.sessions.length,
      policyEnabled: true,
      rejectedCount: 0
    }
  }

  // heartbeat records extension liveness only after authenticated extension context is present.
  async heartbeat(input: BrowserActivityHeartbeatInput): Promise<BrowserActivityHeartbeatResult> {
    assertExtensionOperator(input.operator)
    const grant = await this.getEmployeeGrant(input.tenantId, input.operator.accountId)
    if (grant.enabled) {
      this.upsertPresence({
        accountId: input.operator.accountId,
        displayName: input.operator.displayName ?? input.operator.accountId,
        extensionSessionId: input.extensionSessionId,
        observedAt: input.observedAt,
        tenantId: input.tenantId
      })
    }

    return {
      accepted: grant.enabled,
      nextHeartbeatAfterSeconds: 60,
      policyEnabled: grant.enabled
    }
  }

  // disconnect removes the authenticated extension session from online presence immediately on logout.
  async disconnect(
    input: BrowserActivityDisconnectInput
  ): Promise<BrowserActivityDisconnectResult> {
    assertExtensionOperator(input.operator)
    parseDate(input.observedAt)
    const tenantPresence = this.presence.get(input.tenantId)
    const presence = tenantPresence?.get(input.operator.accountId)
    if (presence?.extensionSessionId === input.extensionSessionId) {
      tenantPresence?.delete(input.operator.accountId)
    }

    return { accepted: true }
  }

  // getOverview returns tenant-level factual metrics and employee ranking by active browsing duration.
  async getOverview(input: BrowserActivityPeriodQuery) {
    const visits = this.listVisits(input.tenantId, input.period)
    const presence = await this.getOnlinePresence({ tenantId: input.tenantId, status: 'ALL' })
    const presenceByAccount = new Map(
      presence.employees.map((employee) => [employee.accountId, employee])
    )
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

  // getEmployeeTimeline returns chronological URL visit facts for one employee account.
  async getEmployeeTimeline(input: EmployeeTimelineQuery & { audit: BrowserActivityAuditContext }) {
    assertTrustedAudit(input.audit)
    assertAuditMatchesTenant(input.audit, input.tenantId)
    const visits = this.listVisits(input.tenantId, input.period)
      .filter((visit) => visit.employeeAccountId === input.employeeAccountId)
      .sort(
        (left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime()
      )

    return {
      employeeAccountId: input.employeeAccountId,
      visits: visits.map((visit) => ({
        activeDurationSeconds: visit.activeDurationSeconds,
        domain: visit.domain,
        dwellDurationSeconds: visit.dwellDurationSeconds,
        endedAt: visit.endedAt,
        foregroundDurationSeconds: visit.foregroundDurationSeconds,
        idleDurationSeconds: visit.idleDurationSeconds,
        pageTitle: visit.pageTitle,
        startedAt: visit.startedAt,
        url: visit.url,
        visitId: visit.clientVisitId
      }))
    }
  }

  // getDomainAggregation returns domain-level factual aggregates for a tenant or selected employee.
  async getDomainAggregation(
    input: EmployeeScopedBrowserActivityQuery & { audit: BrowserActivityAuditContext }
  ) {
    assertTrustedAudit(input.audit)
    assertAuditMatchesTenant(input.audit, input.tenantId)
    const visits = this.listVisits(input.tenantId, input.period).filter(
      (visit) => !input.employeeAccountId || visit.employeeAccountId === input.employeeAccountId
    )
    const domains = [...groupBy(visits, (visit) => visit.domain).entries()].map(
      ([domain, domainVisits]) => ({
        activeDurationSeconds: sum(domainVisits, 'activeDurationSeconds'),
        domain,
        employeeCount: new Set(domainVisits.map((visit) => visit.employeeAccountId)).size,
        foregroundDurationSeconds: sum(domainVisits, 'foregroundDurationSeconds'),
        idleDurationSeconds: sum(domainVisits, 'idleDurationSeconds'),
        urlCount: new Set(domainVisits.map((visit) => visit.url)).size,
        visitCount: domainVisits.length
      })
    )

    return {
      domains: domains.sort(
        (left, right) => right.activeDurationSeconds - left.activeDurationSeconds
      )
    }
  }

  // searchUrls returns URL/title matches without classifying site purpose or performance impact.
  async searchUrls(input: UrlSearchQuery & { audit: BrowserActivityAuditContext }) {
    assertTrustedAudit(input.audit)
    assertAuditMatchesTenant(input.audit, input.tenantId)
    const keyword = input.keyword.trim().toLowerCase()
    if (!keyword) {
      throw new Error('URL search keyword is required')
    }

    const visits = this.listVisits(input.tenantId, input.period).filter((visit) =>
      `${visit.url} ${visit.domain} ${visit.pageTitle}`.toLowerCase().includes(keyword)
    )

    const results = [
      ...groupBy(visits, (visit) => `${visit.employeeAccountId}:${visit.url}`).values()
    ].map((urlVisits) => {
      const latest = [...urlVisits].sort(
        (left, right) => new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime()
      )[0]!

      return {
        activeDurationSeconds: sum(urlVisits, 'activeDurationSeconds'),
        domain: latest.domain,
        employeeDisplayName: latest.employeeDisplayName,
        lastVisitedAt: latest.endedAt,
        pageTitle: latest.pageTitle,
        url: latest.url,
        visitCount: urlVisits.length
      }
    })

    return {
      results: results.sort(
        (left, right) =>
          new Date(right.lastVisitedAt).getTime() - new Date(left.lastVisitedAt).getTime()
      )
    }
  }

  // getOnlinePresence returns heartbeat-derived collection-channel status for tenant accounts.
  async getOnlinePresence(
    input: BrowserActivityOnlinePresenceQuery
  ): Promise<BrowserActivityOnlinePresenceResponse> {
    const serverTimeMs = this.now()
    const employees = [...(this.presence.get(input.tenantId)?.values() ?? [])]
      .map((presence) => ({
        ...presence,
        onlineStatus: resolveBrowserActivityOnlineStatus(presence.lastHeartbeatAt, serverTimeMs)
      }))
      .filter((presence) => shouldIncludePresence(presence, input, serverTimeMs))
      .sort(
        (left, right) =>
          comparePresence(left.onlineStatus, right.onlineStatus) ||
          left.displayName.localeCompare(right.displayName)
      )

    return {
      employees,
      serverTime: new Date(serverTimeMs).toISOString(),
      summary: {
        offlineCount: employees.filter((employee) => employee.onlineStatus === 'OFFLINE').length,
        onlineCount: employees.filter((employee) => employee.onlineStatus === 'ONLINE').length,
        staleCount: employees.filter((employee) => employee.onlineStatus === 'STALE').length
      },
      thresholds: {
        heartbeatIntervalSeconds:
          BROWSER_ACTIVITY_ONLINE_PRESENCE_THRESHOLDS.heartbeatIntervalSeconds,
        onlineWithinSeconds: BROWSER_ACTIVITY_ONLINE_PRESENCE_THRESHOLDS.onlineWithinSeconds,
        staleWithinSeconds: BROWSER_ACTIVITY_ONLINE_PRESENCE_THRESHOLDS.staleWithinSeconds
      }
    }
  }

  // listVisits returns tenant-local visit facts inside the selected rolling monitoring period.
  private listVisits(tenantId: string, period: BrowserActivityPeriod): StoredVisitSession[] {
    const periodStartMs = resolvePeriodStart(period, this.now())
    return (this.visitSessions.get(tenantId) ?? []).filter(
      (visit) => parseDate(visit.endedAt).getTime() >= periodStartMs
    )
  }

  // getEmployeeGrant resolves one account grant without falling back to tenant-level policy state.
  private async getEmployeeGrant(
    tenantId: string,
    accountId: string
  ): Promise<BrowserActivityEmployeeAuditGrant> {
    const result = await this.getEmployeeAuditGrants({ accountIds: [accountId], tenantId })
    return result.grants[0] ?? { accountId, enabled: false }
  }

  // updateLastObservedDomain records the latest accepted visit domain on an existing presence row only.
  private updateLastObservedDomain(
    tenantId: string,
    accountId: string,
    domain: string | undefined
  ): void {
    if (!domain) {
      return
    }
    const tenantPresence = this.presence.get(tenantId)
    const presence = tenantPresence?.get(accountId)
    if (presence) {
      tenantPresence?.set(accountId, { ...presence, lastObservedDomain: domain })
    }
  }

  // upsertPresence stores the latest authenticated extension heartbeat for one tenant account.
  private upsertPresence(input: {
    accountId: string
    displayName: string
    extensionSessionId: string
    observedAt: string
    tenantId: string
  }): void {
    const observedAt = parseDate(input.observedAt).toISOString()
    const tenantPresence =
      this.presence.get(input.tenantId) ?? new Map<string, StoredOnlinePresence>()
    const existing = tenantPresence.get(input.accountId)
    const sessionStartedAt =
      existing?.extensionSessionId === input.extensionSessionId
        ? existing.sessionStartedAt
        : observedAt
    tenantPresence.set(input.accountId, {
      accountId: input.accountId,
      displayName: input.displayName,
      extensionSessionId: input.extensionSessionId,
      lastHeartbeatAt: observedAt,
      lastObservedDomain: existing?.lastObservedDomain,
      sessionStartedAt
    })
    this.presence.set(input.tenantId, tenantPresence)
  }
}

// toAuditControlResult maps account-level grant state into the extension control-plane contract.
function toAuditControlResult(enabled: boolean): BrowserActivityAuditControlResult {
  return {
    enabled,
    nextPollAfterSeconds: BROWSER_ACTIVITY_AUDIT_CONTROL_POLL_SECONDS,
    reasonCode: enabled ? 'ENABLED' : 'EMPLOYEE_AUDIT_DISABLED'
  }
}

// resolvePeriodStart calculates rolling lower bounds for browser monitoring period filters.
function resolvePeriodStart(period: BrowserActivityPeriod, nowMs: number): number {
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
  return nowMs - durations[period]
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

// requiredAccountId prevents blank account grant keys from creating tenant-wide accidental grants.
function requiredAccountId(value: string): string {
  const normalized = value.trim()
  if (!normalized) {
    throw new Error('Browser activity employee account id is required')
  }
  return normalized
}

/** Rejects incomplete audit envelopes before a sensitive read or management mutation can proceed. */
function assertTrustedAudit(audit: BrowserActivityAuditContext): void {
  for (const [label, value] of Object.entries({
    action: audit?.action,
    operator: audit?.operatorAccountId,
    request: audit?.requestId,
    session: audit?.sessionId,
    tenant: audit?.tenantId,
    trace: audit?.traceId
  })) {
    if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
      throw new Error(`Trusted browser activity audit ${label} is required`)
    }
  }
}

/** Binds write audit attribution to the already-authenticated operator and tenant inputs. */
function assertAuditMatchesWrite(
  audit: BrowserActivityAuditContext,
  operator: BrowserActivityOperatorContext,
  tenantId: string
): void {
  if (audit.operatorAccountId !== operator.accountId || audit.tenantId !== tenantId) {
    throw new Error('Trusted browser activity audit does not match the execution context')
  }
}

/** Rejects direct callers that try to separate a sensitive query from its trusted tenant audit fact. */
function assertAuditMatchesTenant(audit: BrowserActivityAuditContext, tenantId: string): void {
  if (audit.tenantId !== tenantId) {
    throw new Error('Trusted browser activity audit does not match the execution context')
  }
}

// parseDate rejects malformed timestamps before they become audit facts.
function parseDate(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid browser activity timestamp')
  }
  return date
}

// resolveBrowserActivityOnlineStatus applies the frozen P1.1 heartbeat thresholds to one presence row.
export function resolveBrowserActivityOnlineStatus(
  lastHeartbeatAt: string,
  serverTimeMs: number
): BrowserActivityOnlineStatus {
  const ageSeconds = Math.max(
    0,
    Math.floor((serverTimeMs - parseDate(lastHeartbeatAt).getTime()) / 1000)
  )
  if (ageSeconds <= BROWSER_ACTIVITY_ONLINE_PRESENCE_THRESHOLDS.onlineWithinSeconds) {
    return 'ONLINE'
  }
  if (ageSeconds <= BROWSER_ACTIVITY_ONLINE_PRESENCE_THRESHOLDS.staleWithinSeconds) {
    return 'STALE'
  }
  return 'OFFLINE'
}

// shouldIncludePresence applies status and recent-offline filters without inventing missing employees.
function shouldIncludePresence(
  presence: BrowserActivityOnlinePresenceItem,
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

// comparePresence keeps active collection-channel states first in administrator lists.
function comparePresence(
  left: BrowserActivityOnlineStatus,
  right: BrowserActivityOnlineStatus
): number {
  const rank: Record<BrowserActivityOnlineStatus, number> = {
    ONLINE: 0,
    STALE: 1,
    OFFLINE: 2
  }
  return rank[left] - rank[right]
}

// groupBy builds small in-memory read models for application-level tests and adapters.
function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }

  return grouped
}

// sum totals one numeric visit duration field.
function sum<T extends Record<K, number>, K extends keyof T>(items: T[], field: K): number {
  return items.reduce((total, item) => total + item[field], 0)
}
