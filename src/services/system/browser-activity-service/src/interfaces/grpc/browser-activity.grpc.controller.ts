import { Controller, Inject } from '@nestjs/common'
import {
  AppendVisitSessionsRequest,
  AppendVisitSessionsResponse,
  BrowserActivityOperatorContext as ProtoOperatorContext,
  BrowserActivityServiceController,
  BrowserActivityServiceControllerMethods,
  BrowserActivityVisitSessionSummary as ProtoVisitSession,
  DisconnectRequest,
  DisconnectResponse,
  GetEmployeeAuditGrantsRequest,
  GetEmployeeAuditGrantsResponse,
  GetAuditControlRequest,
  GetAuditControlResponse,
  GetDomainAggregationResponse,
  GetEmployeeTimelineResponse,
  GetDomainAggregationRequest,
  GetEmployeeTimelineRequest,
  GetOnlinePresenceRequest,
  GetOnlinePresenceResponse,
  GetOverviewRequest,
  GetPolicyResponse,
  GetPolicyRequest,
  HeartbeatRequest,
  HeartbeatResponse,
  SearchUrlsRequest,
  SearchUrlsResponse,
  UpdateEmployeeAuditGrantRequest,
  UpdateEmployeeAuditGrantResponse,
  UpdatePolicyResponse,
  UpdatePolicyRequest,
} from '@oes/common/generated/browser_activity_service'
import {
  AppendVisitSessionsInput,
  BrowserActivityAuditControlInput,
  BrowserActivityAuditControlResult,
  BrowserActivityDisconnectInput,
  BrowserActivityHeartbeatInput,
  BrowserActivityOnlinePresenceQuery,
  BrowserActivityOperatorContext,
  BrowserActivityPeriod,
  BrowserActivityPolicy,
  BrowserActivityVisitSessionSummary,
  GetEmployeeAuditGrantsInput,
  GetEmployeeAuditGrantsResponse as ApplicationEmployeeAuditGrantsResponse,
  UpdateEmployeeAuditGrantInput
} from '../../application/browser-activity-application'

interface BrowserActivityApplicationPort {
  appendVisitSessions(input: AppendVisitSessionsInput): Promise<AppendVisitSessionsResponse>
  getDomainAggregation(input: {
    employeeAccountId?: string
    period: BrowserActivityPeriod
    tenantId: string
  }): Promise<GetDomainAggregationResponse>
  getEmployeeTimeline(input: {
    employeeAccountId: string
    period: BrowserActivityPeriod
    tenantId: string
  }): Promise<GetEmployeeTimelineResponse>
  getOverview(input: {
    period: BrowserActivityPeriod
    tenantId: string
  }): Promise<Record<string, unknown>>
  getOnlinePresence(input: BrowserActivityOnlinePresenceQuery): Promise<GetOnlinePresenceResponse>
  getEmployeeAuditGrants(input: GetEmployeeAuditGrantsInput): Promise<ApplicationEmployeeAuditGrantsResponse>
  getPolicy(input: { tenantId: string }): Promise<BrowserActivityPolicy>
  heartbeat(input: BrowserActivityHeartbeatInput): Promise<HeartbeatResponse>
  disconnect(input: BrowserActivityDisconnectInput): Promise<DisconnectResponse>
  searchUrls(input: {
    keyword: string
    operator?: BrowserActivityOperatorContext
    period: BrowserActivityPeriod
    reason?: string
    tenantId: string
    traceId?: string
  }): Promise<SearchUrlsResponse>
  updatePolicy(input: {
    operator: BrowserActivityOperatorContext
    policy: BrowserActivityPolicy
    tenantId: string
  }): Promise<BrowserActivityPolicy>
  updateEmployeeAuditGrant(input: UpdateEmployeeAuditGrantInput): Promise<{
    accountId: string
    enabled: boolean
    updatedAt?: string
    updatedBy?: string
  }>
  getAuditControl(input: BrowserActivityAuditControlInput): Promise<BrowserActivityAuditControlResult>
}

export const BROWSER_ACTIVITY_APPLICATION = Symbol('BROWSER_ACTIVITY_APPLICATION')

@Controller()
@BrowserActivityServiceControllerMethods()
// BrowserActivityGrpcController exposes browser-activity-service use cases over the shared gRPC contract.
export class BrowserActivityGrpcController implements BrowserActivityServiceController {
  constructor(
    @Inject(BROWSER_ACTIVITY_APPLICATION)
    private readonly application: BrowserActivityApplicationPort
  ) {}

  // getPolicy maps one policy request into the application read use case.
  async getPolicy(request: GetPolicyRequest): Promise<GetPolicyResponse> {
    return {
      policy: await this.application.getPolicy({ tenantId: required(request.tenantId) })
    }
  }

  // updatePolicy maps one administrator policy update into the application command.
  async updatePolicy(request: UpdatePolicyRequest): Promise<UpdatePolicyResponse> {
    return {
      policy: await this.application.updatePolicy({
        operator: toOperator(request.operator),
        policy: toPolicy(request.policy),
        tenantId: required(request.tenantId)
      })
    }
  }

  // getEmployeeAuditGrants maps account-level collection grant reads into application state.
  async getEmployeeAuditGrants(request: GetEmployeeAuditGrantsRequest): Promise<GetEmployeeAuditGrantsResponse> {
    return this.application.getEmployeeAuditGrants({
      accountIds: request.accountIds ?? [],
      tenantId: required(request.tenantId)
    })
  }

  // updateEmployeeAuditGrant maps one administrator account grant change into the application command.
  async updateEmployeeAuditGrant(request: UpdateEmployeeAuditGrantRequest): Promise<UpdateEmployeeAuditGrantResponse> {
    return {
      grant: await this.application.updateEmployeeAuditGrant({
        accountId: required(request.accountId),
        enabled: request.enabled ?? false,
        operator: toOperator(request.operator),
        tenantId: required(request.tenantId)
      })
    }
  }

  // getAuditControl maps extension control-plane checks without writing heartbeat or visit facts.
  async getAuditControl(request: GetAuditControlRequest): Promise<GetAuditControlResponse> {
    return this.application.getAuditControl({
      operator: toOperator(request.operator),
      tenantId: required(request.tenantId)
    })
  }

  // appendVisitSessions maps privacy-bounded extension summaries into the ingest use case.
  async appendVisitSessions(request: AppendVisitSessionsRequest): Promise<AppendVisitSessionsResponse> {
    return this.application.appendVisitSessions({
      operator: toOperator(request.operator),
      sessions: (request.sessions ?? []).map(toVisitSession),
      tenantId: required(request.tenantId)
    })
  }

  // heartbeat maps authenticated extension liveness reports into the application use case.
  async heartbeat(request: HeartbeatRequest): Promise<HeartbeatResponse> {
    return this.application.heartbeat({
      extensionSessionId: required(request.extensionSessionId),
      observedAt: required(request.observedAt),
      operator: toOperator(request.operator),
      tenantId: required(request.tenantId)
    })
  }

  // disconnect maps authenticated extension logout signals into immediate presence removal.
  async disconnect(request: DisconnectRequest): Promise<DisconnectResponse> {
    return this.application.disconnect({
      extensionSessionId: required(request.extensionSessionId),
      observedAt: required(request.observedAt),
      operator: toOperator(request.operator),
      tenantId: required(request.tenantId)
    })
  }

  // getOverview maps one tenant dashboard read into application read models.
  async getOverview(request: GetOverviewRequest): Promise<any> {
    return this.application.getOverview({
      period: normalizePeriod(request.period),
      tenantId: required(request.tenantId)
    })
  }

  // getOnlinePresence maps tenant online-presence reads into heartbeat-derived application state.
  async getOnlinePresence(request: GetOnlinePresenceRequest): Promise<GetOnlinePresenceResponse> {
    return this.application.getOnlinePresence({
      includeOfflineWithinMinutes: request.includeOfflineWithinMinutes || undefined,
      status: normalizePresenceStatus(request.status),
      tenantId: required(request.tenantId)
    })
  }

  // getEmployeeTimeline maps one employee timeline request into application read models.
  async getEmployeeTimeline(request: GetEmployeeTimelineRequest): Promise<GetEmployeeTimelineResponse> {
    return this.application.getEmployeeTimeline({
      employeeAccountId: required(request.employeeAccountId),
      period: normalizePeriod(request.period),
      tenantId: required(request.tenantId)
    })
  }

  // getDomainAggregation maps tenant or employee-scoped domain aggregate reads.
  async getDomainAggregation(request: GetDomainAggregationRequest): Promise<GetDomainAggregationResponse> {
    return this.application.getDomainAggregation({
      employeeAccountId: optional(request.employeeAccountId),
      period: normalizePeriod(request.period),
      tenantId: required(request.tenantId)
    })
  }

  // searchUrls maps sensitive URL detail reads and passes audit reason to the application.
  async searchUrls(request: SearchUrlsRequest): Promise<SearchUrlsResponse> {
    return this.application.searchUrls({
      keyword: required(request.keyword),
      operator: toOperator(request.operator),
      period: normalizePeriod(request.period),
      reason: optional(request.audit?.reason),
      tenantId: required(request.tenantId),
      traceId: optional(request.trace?.traceId)
    })
  }
}

// toOperator converts proto optional operator fields into application operator context.
function toOperator(operator: ProtoOperatorContext | undefined): BrowserActivityOperatorContext {
  return {
    accountId: required(operator?.accountId),
    displayName: optional(operator?.displayName),
    terminal: required(operator?.terminal),
    userId: optional(operator?.userId)
  }
}

// toPolicy converts proto optional policy fields into application policy input.
function toPolicy(policy: { aggregateRetentionDays?: number; enabled?: boolean; rawRetentionDays?: number } | undefined): BrowserActivityPolicy {
  return {
    aggregateRetentionDays: policy?.aggregateRetentionDays ?? 0,
    enabled: policy?.enabled ?? false,
    rawRetentionDays: policy?.rawRetentionDays ?? 0
  }
}

// toVisitSession converts one proto visit summary into application input.
function toVisitSession(session: ProtoVisitSession): BrowserActivityVisitSessionSummary {
  return {
    activeDurationSeconds: session.activeDurationSeconds ?? 0,
    clientVisitId: required(session.clientVisitId),
    domain: required(session.domain),
    dwellDurationSeconds: session.dwellDurationSeconds ?? 0,
    endedAt: required(session.endedAt),
    extensionSessionId: required(session.extensionSessionId),
    foregroundDurationSeconds: session.foregroundDurationSeconds ?? 0,
    idleDurationSeconds: session.idleDurationSeconds ?? 0,
    lastFlushedAt: required(session.lastFlushedAt),
    mergeKey: required(session.mergeKey),
    pageTitle: session.pageTitle ?? '',
    startedAt: required(session.startedAt),
    url: required(session.url)
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

// normalizePresenceStatus keeps presence filters on the frozen P1.1 status choices.
function normalizePresenceStatus(value?: string): 'ALL' | 'OFFLINE' | 'ONLINE' | 'STALE' | undefined {
  if (value === 'ONLINE' || value === 'STALE' || value === 'OFFLINE' || value === 'ALL') {
    return value
  }
  return undefined
}

// required normalizes required proto strings and fails fast on missing contract fields.
function required(value?: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new Error('Required browser activity field is missing')
  }
  return normalized
}

// optional normalizes optional proto strings.
function optional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized || undefined
}
