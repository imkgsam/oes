import { Controller, Inject, UseFilters, UseGuards } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  AuthorizeSelfServiceRpc,
  getAuthenticatedGrpcRequestContext,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AppendVisitSessionsRequest,
  AppendVisitSessionsResponse,
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
  UpdatePolicyRequest
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
    audit?: import('../../application/browser-activity-application').BrowserActivityAuditContext
  }): Promise<GetDomainAggregationResponse>
  getEmployeeTimeline(input: {
    employeeAccountId: string
    period: BrowserActivityPeriod
    tenantId: string
    audit?: import('../../application/browser-activity-application').BrowserActivityAuditContext
  }): Promise<GetEmployeeTimelineResponse>
  getOverview(input: {
    period: BrowserActivityPeriod
    tenantId: string
  }): Promise<Record<string, unknown>>
  getOnlinePresence(input: BrowserActivityOnlinePresenceQuery): Promise<GetOnlinePresenceResponse>
  getEmployeeAuditGrants(
    input: GetEmployeeAuditGrantsInput
  ): Promise<ApplicationEmployeeAuditGrantsResponse>
  getPolicy(input: { tenantId: string }): Promise<BrowserActivityPolicy>
  heartbeat(input: BrowserActivityHeartbeatInput): Promise<HeartbeatResponse>
  disconnect(input: BrowserActivityDisconnectInput): Promise<DisconnectResponse>
  searchUrls(input: {
    keyword: string
    operator?: BrowserActivityOperatorContext
    period: BrowserActivityPeriod
    reason?: string
    sessionId?: string
    tenantId: string
    traceId?: string
  }): Promise<SearchUrlsResponse>
  updatePolicy(input: {
    audit?: import('../../application/browser-activity-application').BrowserActivityAuditContext
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
  getAuditControl(
    input: BrowserActivityAuditControlInput
  ): Promise<BrowserActivityAuditControlResult>
}

export const BROWSER_ACTIVITY_APPLICATION = Symbol('BROWSER_ACTIVITY_APPLICATION')

@Controller()
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@BrowserActivityServiceControllerMethods()
// BrowserActivityGrpcController exposes browser-activity-service use cases over the shared gRPC contract.
export class BrowserActivityGrpcController implements BrowserActivityServiceController {
  constructor(
    @Inject(BROWSER_ACTIVITY_APPLICATION)
    private readonly application: BrowserActivityApplicationPort
  ) {}

  // getPolicy maps one policy request into the application read use case.
  @AuthorizeBusinessRpc({ all: ['browser_activity.policy.read'] }, { sessionTerminal: 'WEB' })
  async getPolicy(request: GetPolicyRequest): Promise<GetPolicyResponse> {
    return {
      policy: await this.application.getPolicy({ tenantId: tenantFrom(request) })
    }
  }

  // updatePolicy maps one administrator policy update into the application command.
  @AuthorizeBusinessRpc({ all: ['browser_activity.policy.manage'] }, { sessionTerminal: 'WEB' })
  async updatePolicy(request: UpdatePolicyRequest): Promise<UpdatePolicyResponse> {
    return {
      policy: await this.application.updatePolicy({
        operator: operatorFrom(request),
        policy: toPolicy(request.policy),
        tenantId: tenantFrom(request),
        audit: auditFrom(request, 'BROWSER_ACTIVITY_POLICY_UPDATE')
      })
    }
  }

  // getEmployeeAuditGrants maps account-level collection grant reads into application state.
  @AuthorizeBusinessRpc({ all: ['browser_activity.overview.read'] }, { sessionTerminal: 'WEB' })
  async getEmployeeAuditGrants(
    request: GetEmployeeAuditGrantsRequest
  ): Promise<GetEmployeeAuditGrantsResponse> {
    return this.application.getEmployeeAuditGrants({
      accountIds: request.accountIds ?? [],
      tenantId: tenantFrom(request)
    })
  }

  // updateEmployeeAuditGrant maps one administrator account grant change into the application command.
  @AuthorizeBusinessRpc({ all: ['browser_activity.policy.manage'] }, { sessionTerminal: 'WEB' })
  async updateEmployeeAuditGrant(
    request: UpdateEmployeeAuditGrantRequest
  ): Promise<UpdateEmployeeAuditGrantResponse> {
    return {
      grant: await this.application.updateEmployeeAuditGrant({
        accountId: required(request.accountId),
        enabled: request.enabled ?? false,
        operator: operatorFrom(request),
        tenantId: tenantFrom(request),
        audit: auditFrom(request, 'BROWSER_ACTIVITY_EMPLOYEE_GRANT_UPDATE', request.accountId)
      })
    }
  }

  // getAuditControl maps extension control-plane checks without writing heartbeat or visit facts.
  @AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'BROWSER_EXTENSION' })
  async getAuditControl(request: GetAuditControlRequest): Promise<GetAuditControlResponse> {
    return this.application.getAuditControl({
      operator: operatorFrom(request),
      tenantId: tenantFrom(request)
    })
  }

  // appendVisitSessions maps privacy-bounded extension summaries into the ingest use case.
  @AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'BROWSER_EXTENSION' })
  async appendVisitSessions(
    request: AppendVisitSessionsRequest
  ): Promise<AppendVisitSessionsResponse> {
    return this.application.appendVisitSessions({
      operator: operatorFrom(request),
      sessions: (request.sessions ?? []).map((session) =>
        toVisitSession(session, sessionIdFrom(request))
      ),
      tenantId: tenantFrom(request)
    })
  }

  // heartbeat maps authenticated extension liveness reports into the application use case.
  @AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'BROWSER_EXTENSION' })
  async heartbeat(request: HeartbeatRequest): Promise<HeartbeatResponse> {
    return this.application.heartbeat({
      extensionSessionId: sessionIdFrom(request),
      observedAt: required(request.observedAt),
      operator: operatorFrom(request),
      tenantId: tenantFrom(request)
    })
  }

  // disconnect maps authenticated extension logout signals into immediate presence removal.
  @AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminal: 'BROWSER_EXTENSION' })
  async disconnect(request: DisconnectRequest): Promise<DisconnectResponse> {
    return this.application.disconnect({
      extensionSessionId: sessionIdFrom(request),
      observedAt: required(request.observedAt),
      operator: operatorFrom(request),
      tenantId: tenantFrom(request)
    })
  }

  // getOverview maps one tenant dashboard read into application read models.
  @AuthorizeBusinessRpc({ all: ['browser_activity.overview.read'] }, { sessionTerminal: 'WEB' })
  async getOverview(request: GetOverviewRequest): Promise<any> {
    return this.application.getOverview({
      period: normalizePeriod(request.period),
      tenantId: tenantFrom(request)
    })
  }

  // getOnlinePresence maps tenant online-presence reads into heartbeat-derived application state.
  @AuthorizeBusinessRpc({ all: ['browser_activity.overview.read'] }, { sessionTerminal: 'WEB' })
  async getOnlinePresence(request: GetOnlinePresenceRequest): Promise<GetOnlinePresenceResponse> {
    return this.application.getOnlinePresence({
      includeOfflineWithinMinutes: request.includeOfflineWithinMinutes || undefined,
      status: normalizePresenceStatus(request.status),
      tenantId: tenantFrom(request)
    })
  }

  // getEmployeeTimeline maps one employee timeline request into application read models.
  @AuthorizeBusinessRpc(
    { all: ['browser_activity.employee_detail.read'] },
    { sessionTerminal: 'WEB' }
  )
  async getEmployeeTimeline(
    request: GetEmployeeTimelineRequest
  ): Promise<GetEmployeeTimelineResponse> {
    return this.application.getEmployeeTimeline({
      employeeAccountId: required(request.employeeAccountId),
      period: normalizePeriod(request.period),
      tenantId: tenantFrom(request),
      audit: auditFrom(
        request,
        'BROWSER_ACTIVITY_EMPLOYEE_TIMELINE_READ',
        request.employeeAccountId
      )
    })
  }

  // getDomainAggregation maps tenant or employee-scoped domain aggregate reads.
  @AuthorizeBusinessRpc({ all: ['browser_activity.url_detail.read'] }, { sessionTerminal: 'WEB' })
  async getDomainAggregation(
    request: GetDomainAggregationRequest
  ): Promise<GetDomainAggregationResponse> {
    return this.application.getDomainAggregation({
      employeeAccountId: optional(request.employeeAccountId),
      period: normalizePeriod(request.period),
      tenantId: tenantFrom(request),
      audit: auditFrom(
        request,
        'BROWSER_ACTIVITY_DOMAIN_AGGREGATION_READ',
        request.employeeAccountId
      )
    })
  }

  // searchUrls maps sensitive URL detail reads and passes audit reason to the application.
  @AuthorizeBusinessRpc({ all: ['browser_activity.url_detail.read'] }, { sessionTerminal: 'WEB' })
  async searchUrls(request: SearchUrlsRequest): Promise<SearchUrlsResponse> {
    return this.application.searchUrls({
      keyword: required(request.keyword),
      operator: operatorFrom(request),
      period: normalizePeriod(request.period),
      reason: 'BROWSER_ACTIVITY_URL_DETAIL_SEARCH',
      sessionId: sessionIdFrom(request),
      tenantId: tenantFrom(request),
      traceId: undefined
    })
  }
}

// toOperator converts proto optional operator fields into application operator context.
function operatorFrom(request: object): BrowserActivityOperatorContext {
  const verified = verifiedToken(request)
  return {
    accountId: verified.subject,
    terminal: required(verified.sessionTerminal),
    userId: verified.subject
  }
}

/** Reads only guard-attached claims and makes the request body irrelevant to authority. */
function verifiedToken(request: object) {
  const token = getAuthenticatedGrpcRequestContext(request)?.verifiedExecutionToken
  if (!token) throw new Error('Trusted execution context is required')
  return token
}

/** Requires the tenant claim established by Auth and rejects system-scoped Browser Activity calls. */
function tenantFrom(request: object): string {
  const tenantId = verifiedToken(request).tenantId
  return required(tenantId)
}

/** Derives the extension session identity from the Auth-signed session_id claim. */
function sessionIdFrom(request: object): string {
  return required(verifiedToken(request).sessionId)
}

/** Builds a stable method-owned audit record from the verified execution context. */
function auditFrom(request: object, action: string, employeeAccountId?: string) {
  const context = getAuthenticatedGrpcRequestContext(request) as ReturnType<
    typeof getAuthenticatedGrpcRequestContext
  > & { requestId?: string; traceId?: string }
  return {
    action,
    operatorAccountId: verifiedToken(request).subject,
    sessionId: sessionIdFrom(request),
    tenantId: tenantFrom(request),
    ...(context?.traceId === undefined ? {} : { traceId: context.traceId }),
    ...(employeeAccountId === undefined ? {} : { employeeAccountId })
  }
}

// toPolicy converts proto optional policy fields into application policy input.
function toPolicy(
  policy:
    | { aggregateRetentionDays?: number; enabled?: boolean; rawRetentionDays?: number }
    | undefined
): BrowserActivityPolicy {
  return {
    aggregateRetentionDays: policy?.aggregateRetentionDays ?? 0,
    enabled: policy?.enabled ?? false,
    rawRetentionDays: policy?.rawRetentionDays ?? 0
  }
}

// toVisitSession converts one proto visit summary into application input.
function toVisitSession(
  session: ProtoVisitSession,
  extensionSessionId: string
): BrowserActivityVisitSessionSummary {
  return {
    activeDurationSeconds: session.activeDurationSeconds ?? 0,
    clientVisitId: required(session.clientVisitId),
    domain: required(session.domain),
    dwellDurationSeconds: session.dwellDurationSeconds ?? 0,
    endedAt: required(session.endedAt),
    extensionSessionId,
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
function normalizePresenceStatus(
  value?: string
): 'ALL' | 'OFFLINE' | 'ONLINE' | 'STALE' | undefined {
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
