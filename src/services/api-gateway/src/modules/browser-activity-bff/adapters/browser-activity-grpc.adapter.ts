import { Injectable, OnModuleInit } from '@nestjs/common'
import { BrowserActivityServiceClient } from '@oes/common/generated/browser_activity_service'
import { SafeGrpcCallOptions, safeGrpcCall } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  GatewayBrowserActivityGrpcClient,
  GatewayTrustedGrpcExecutionProducer
} from '../../../common/grpc'
import { BrowserActivityClientPort } from '../browser-activity-bff.service'

const CALLER = 'api-gateway'
const BROWSER_ACTIVITY_AUDIENCE = 'urn:oes:service:browser-activity-service'

/** Forwards Browser Activity calls over exact-audience BUSINESS/SELF_SERVICE metadata. */
@Injectable()
export class BrowserActivityGrpcAdapter implements BrowserActivityClientPort, OnModuleInit {
  private svc!: BrowserActivityServiceClient

  constructor(
    private readonly client: GatewayBrowserActivityGrpcClient,
    private readonly trustedExecutionProducer: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService()
  }

  async appendVisitSessions(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    const metadata = await this.trustedExecutionProducer.forSelfServiceCall(
      source,
      BROWSER_ACTIVITY_AUDIENCE
    )
    return this.call(
      'appendVisitSessions',
      this.svc.appendVisitSessions(stripAuthority(input), metadata)
    )
  }

  async heartbeat(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    const metadata = await this.trustedExecutionProducer.forSelfServiceCall(
      source,
      BROWSER_ACTIVITY_AUDIENCE
    )
    return this.call('heartbeat', this.svc.heartbeat(stripAuthority(input), metadata))
  }

  async disconnect(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    const metadata = await this.trustedExecutionProducer.forSelfServiceCall(
      source,
      BROWSER_ACTIVITY_AUDIENCE
    )
    return this.call('disconnect', this.svc.disconnect(stripAuthority(input), metadata))
  }

  async getAuditControl(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    const metadata = await this.trustedExecutionProducer.forSelfServiceCall(
      source,
      BROWSER_ACTIVITY_AUDIENCE
    )
    return this.call('getAuditControl', this.svc.getAuditControl(stripAuthority(input), metadata))
  }

  async getPolicy(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    return this.call(
      'getPolicy',
      this.svc.getPolicy(
        stripAuthority(input),
        await this.businessMetadata(source, ['browser_activity.policy.read'])
      )
    ).then((response: any) => response.policy)
  }

  async updatePolicy(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    return this.call(
      'updatePolicy',
      this.svc.updatePolicy(
        stripAuthority(input),
        await this.businessMetadata(source, ['browser_activity.policy.manage'])
      )
    ).then((response: any) => response.policy)
  }

  async getEmployeeAuditGrants(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    return this.call(
      'getEmployeeAuditGrants',
      this.svc.getEmployeeAuditGrants(
        stripAuthority(input),
        await this.businessMetadata(source, ['browser_activity.overview.read'])
      )
    )
  }

  async updateEmployeeAuditGrant(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    return this.call(
      'updateEmployeeAuditGrant',
      this.svc.updateEmployeeAuditGrant(
        stripAuthority(input),
        await this.businessMetadata(source, ['browser_activity.policy.manage'])
      )
    ).then((response: any) => response.grant)
  }

  async getOverview(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    return this.call(
      'getOverview',
      this.svc.getOverview(
        stripAuthority(input),
        await this.businessMetadata(source, ['browser_activity.overview.read'])
      )
    )
  }

  async getOnlinePresence(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    return this.call(
      'getOnlinePresence',
      this.svc.getOnlinePresence(
        stripAuthority(input),
        await this.businessMetadata(source, ['browser_activity.overview.read'])
      )
    )
  }

  async getEmployeeTimeline(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    return this.call(
      'getEmployeeTimeline',
      this.svc.getEmployeeTimeline(
        stripAuthority(input),
        await this.businessMetadata(source, ['browser_activity.employee_detail.read'])
      )
    )
  }

  async getDomainAggregation(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    return this.call(
      'getDomainAggregation',
      this.svc.getDomainAggregation(
        stripAuthority(input),
        await this.businessMetadata(source, ['browser_activity.url_detail.read'])
      )
    )
  }

  async searchUrls(input: Record<string, unknown>) {
    const source = sourceFrom(input)
    return this.call(
      'searchUrls',
      this.svc.searchUrls(
        stripAuthority(input),
        await this.businessMetadata(source, ['browser_activity.url_detail.read'])
      )
    )
  }

  private businessMetadata(source: DownstreamRequestSource, codes: readonly string[]) {
    return this.trustedExecutionProducer.forBusinessCall(source, BROWSER_ACTIVITY_AUDIENCE, codes)
  }

  private call<TResponse>(
    method: string,
    call$: Parameters<typeof safeGrpcCall<TResponse>>[0]
  ): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, {
      caller: CALLER,
      method: `BrowserActivityService.${method}`
    } satisfies SafeGrpcCallOptions)
  }
}

/** Removes all legacy body authority fields before the generated request reaches gRPC. */
function stripAuthority(input: Record<string, unknown>): Record<string, unknown> {
  const {
    tenantId: _tenantId,
    operator: _operator,
    trace: _trace,
    audit: _audit,
    extensionSessionId: _extensionSessionId,
    __trustedSource: _trustedSource,
    ...business
  } = input
  return business
}

/** Reads only the non-enumerable source handoff and rejects adapters invoked without a verified root. */
function sourceFrom(input: Record<string, unknown>): DownstreamRequestSource {
  const source = input.__trustedSource
  if (!source || typeof source !== 'object') throw new Error('verified Gateway source is required')
  return source as DownstreamRequestSource
}
