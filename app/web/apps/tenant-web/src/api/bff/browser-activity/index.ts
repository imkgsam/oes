import { requestClient } from '#/api/request'

type BrowserActivityReadConfig = Parameters<typeof requestClient.get>[1] & {
  suppressErrorMessage?: boolean
}

const previewFallbackReadConfig: BrowserActivityReadConfig = {
  suppressErrorMessage: true
}

// withPreviewFallback marks optional P1 read endpoints as locally handled so preview mode owns the UX.
function withPreviewFallback(
  params?: BrowserActivityApi.OnlinePresenceQuery | BrowserActivityApi.Query | BrowserActivityApi.UrlSearchQuery
) {
  return {
    ...previewFallbackReadConfig,
    ...(params ? { params } : {})
  }
}

export namespace BrowserActivityApi {
  export type ActivityPeriod = 'LAST_1_HOUR' | 'LAST_1_DAY' | 'LAST_1_WEEK' | 'LAST_1_MONTH'
  export type OnlineStatus = 'OFFLINE' | 'ONLINE' | 'STALE'
  export type OnlinePresenceStatusFilter = 'ALL' | OnlineStatus

  export interface Policy {
    aggregateRetentionDays: number
    enabled: boolean
    rawRetentionDays: number
  }

  export interface PolicyUpdatePayload {
    aggregateRetentionDays: number
    enabled: boolean
    rawRetentionDays: number
  }

  export interface Query {
    employeeAccountId?: string
    period?: ActivityPeriod
  }

  export interface UrlSearchQuery {
    keyword: string
    period?: ActivityPeriod
  }

  export interface OnlinePresenceQuery {
    includeOfflineWithinMinutes?: number
    status?: OnlinePresenceStatusFilter
  }

  export interface EmployeeSummary {
    accountId: string
    activeDurationSeconds: number
    auditEnabled?: boolean
    browserExtensionLoginAllowed?: boolean
    displayName: string
    foregroundDurationSeconds: number
    idleDurationSeconds: number
    lastHeartbeatAt?: string
    onlineStatus?: OnlineStatus
    onlineDurationSeconds: number
    pageViewCount: number
  }

  export interface EmployeeAuditGrant {
    accountId: string
    browserExtensionLoginAllowed?: boolean
    enabled: boolean
    updatedAt?: string
    updatedBy?: string
  }

  export interface EmployeeAuditGrantPage {
    grants: EmployeeAuditGrant[]
  }

  export interface EmployeeAuditGrantUpdatePayload {
    enabled: boolean
  }

  export interface OverviewMetrics {
    activeDurationSeconds: number
    employeeCount: number
    foregroundDurationSeconds: number
    idleDurationSeconds: number
    onlineEmployeeCount?: number
    onlineDurationSeconds: number
    staleEmployeeCount?: number
    urlCount: number
  }

  export interface Overview {
    employees: EmployeeSummary[]
    metrics: OverviewMetrics
    period: ActivityPeriod
    policy: Policy
  }

  export interface Visit {
    activeDurationSeconds: number
    domain: string
    dwellDurationSeconds: number
    endedAt: string
    foregroundDurationSeconds: number
    idleDurationSeconds: number
    pageTitle: string
    startedAt: string
    url: string
    visitId: string
  }

  export interface EmployeeTimeline {
    employeeAccountId: string
    visits: Visit[]
  }

  export interface DomainAggregationItem {
    activeDurationSeconds: number
    domain: string
    employeeCount: number
    foregroundDurationSeconds: number
    idleDurationSeconds: number
    urlCount: number
    visitCount: number
  }

  export interface DomainAggregation {
    domains: DomainAggregationItem[]
  }

  export interface UrlSearchResult {
    activeDurationSeconds: number
    domain: string
    employeeDisplayName: string
    lastVisitedAt: string
    pageTitle: string
    url: string
    visitCount: number
  }

  export interface UrlSearchResultPage {
    results: UrlSearchResult[]
  }

  export interface OnlinePresenceEmployee {
    accountId: string
    displayName: string
    extensionSessionId: string
    lastHeartbeatAt: string
    lastObservedDomain?: string
    onlineStatus: OnlineStatus
    sessionStartedAt: string
  }

  export interface OnlinePresence {
    employees: OnlinePresenceEmployee[]
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
}

// getBrowserActivityPolicyApi loads the tenant-level browser activity audit policy.
export async function getBrowserActivityPolicyApi() {
  return requestClient.get<BrowserActivityApi.Policy>(
    '/browser-activity/policy',
    withPreviewFallback()
  )
}

// updateBrowserActivityPolicyApi persists the tenant-level browser activity audit policy.
export async function updateBrowserActivityPolicyApi(payload: BrowserActivityApi.PolicyUpdatePayload) {
  return requestClient.put<BrowserActivityApi.Policy>('/browser-activity/policy', payload)
}

// getBrowserActivityOverviewApi loads employee ranking and tenant-wide factual duration metrics.
export async function getBrowserActivityOverviewApi(params: BrowserActivityApi.Query) {
  return requestClient.get<BrowserActivityApi.Overview>(
    '/browser-activity/overview',
    withPreviewFallback(params)
  )
}

// getBrowserActivityOnlinePresenceApi loads heartbeat-derived extension collection-channel status.
export async function getBrowserActivityOnlinePresenceApi(params: BrowserActivityApi.OnlinePresenceQuery) {
  return requestClient.get<BrowserActivityApi.OnlinePresence>(
    '/browser-activity/online-presence',
    withPreviewFallback(params)
  )
}

// updateBrowserActivityEmployeeAuditGrantApi toggles collection for one tenant account.
export async function getBrowserActivityEmployeeAuditGrantsApi(accountIds: string[]) {
  return requestClient.get<BrowserActivityApi.EmployeeAuditGrantPage>(
    '/browser-activity/employees/audit-grants',
    withPreviewFallback({
      accountIds: accountIds.join(',')
    } as BrowserActivityApi.Query)
  )
}

// updateBrowserActivityEmployeeAuditGrantApi toggles collection for one tenant account.
export async function updateBrowserActivityEmployeeAuditGrantApi(
  employeeAccountId: string,
  payload: BrowserActivityApi.EmployeeAuditGrantUpdatePayload
) {
  return requestClient.put<BrowserActivityApi.EmployeeAuditGrant>(
    `/browser-activity/employees/${encodeURIComponent(employeeAccountId)}/audit-grant`,
    payload
  )
}

// getBrowserActivityEmployeeTimelineApi loads chronological visit facts for one employee account.
export async function getBrowserActivityEmployeeTimelineApi(
  employeeAccountId: string,
  params: Omit<BrowserActivityApi.Query, 'employeeAccountId'>
) {
  return requestClient.get<BrowserActivityApi.EmployeeTimeline>(
    `/browser-activity/employees/${encodeURIComponent(employeeAccountId)}/timeline`,
    withPreviewFallback(params)
  )
}

// getBrowserActivityDomainAggregationApi loads domain-level factual aggregates for the selected scope.
export async function getBrowserActivityDomainAggregationApi(params: BrowserActivityApi.Query) {
  return requestClient.get<BrowserActivityApi.DomainAggregation>(
    '/browser-activity/domains',
    withPreviewFallback(params)
  )
}

// searchBrowserActivityUrlsApi searches visited URLs by keyword without adding website classification.
export async function searchBrowserActivityUrlsApi(params: BrowserActivityApi.UrlSearchQuery) {
  return requestClient.get<BrowserActivityApi.UrlSearchResultPage>(
    '/browser-activity/url-search',
    withPreviewFallback(params)
  )
}
