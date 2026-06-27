import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { GRPC_METADATA_PROPAGATION_FACTORY, GrpcMetadataPropagationFactory } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  BROWSER_ACTIVITY_SERVICE_NAME,
  BrowserActivityServiceClient
} from '@oes/common/generated/browser_activity_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { toInternalCallMetadataInput } from '../../../common/grpc/gateway-downstream-source.mapper'
import { BrowserActivityClientPort } from '../browser-activity-bff.service'

const CALLER = 'api-gateway'

// BrowserActivityGrpcAdapter forwards the Browser Activity BFF to browser-activity-service over gRPC.
@Injectable()
export class BrowserActivityGrpcAdapter implements BrowserActivityClientPort, OnModuleInit {
  private svc!: BrowserActivityServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.BROWSER_ACTIVITY)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  // onModuleInit resolves the generated browser activity gRPC client from the transport registry.
  onModuleInit(): void {
    this.svc = this.client.getService<BrowserActivityServiceClient>(BROWSER_ACTIVITY_SERVICE_NAME)
  }

  // appendVisitSessions forwards authenticated extension visit summaries to browser-activity-service.
  async appendVisitSessions(input: Record<string, unknown>) {
    return this.call('appendVisitSessions', this.svc.appendVisitSessions(input as any, this.metadata(input)))
  }

  // heartbeat forwards authenticated extension liveness facts to browser-activity-service.
  async heartbeat(input: Record<string, unknown>) {
    return this.call('heartbeat', this.svc.heartbeat(input as any, this.metadata(input)))
  }

  // disconnect forwards authenticated extension logout signals to browser-activity-service.
  async disconnect(input: Record<string, unknown>) {
    return this.call('disconnect', this.svc.disconnect(input as any, this.metadata(input)))
  }

  // getAuditControl forwards extension control-plane checks without writing heartbeat facts.
  async getAuditControl(input: Record<string, unknown>) {
    return this.call('getAuditControl', this.svc.getAuditControl(input as any, this.metadata(input)))
  }

  // getPolicy forwards tenant policy reads and unwraps the proto response for tenant-web.
  async getPolicy(input: Record<string, unknown>) {
    const response = await this.call<any>('getPolicy', this.svc.getPolicy(input as any, this.metadata(input)))
    return response.policy
  }

  // updatePolicy forwards tenant policy writes and unwraps the proto response for tenant-web.
  async updatePolicy(input: Record<string, unknown>) {
    const response = await this.call<any>('updatePolicy', this.svc.updatePolicy(input as any, this.metadata(input)))
    return response.policy
  }

  // getEmployeeAuditGrants forwards account-level collection grant reads.
  async getEmployeeAuditGrants(input: Record<string, unknown>) {
    return this.call('getEmployeeAuditGrants', this.svc.getEmployeeAuditGrants(input as any, this.metadata(input)))
  }

  // updateEmployeeAuditGrant forwards one account collection grant mutation and unwraps the grant.
  async updateEmployeeAuditGrant(input: Record<string, unknown>) {
    const response = await this.call<any>('updateEmployeeAuditGrant', this.svc.updateEmployeeAuditGrant(input as any, this.metadata(input)))
    return response.grant
  }

  // getOverview forwards tenant activity overview reads.
  async getOverview(input: Record<string, unknown>) {
    return this.call('getOverview', this.svc.getOverview(input as any, this.metadata(input)))
  }

  // getOnlinePresence forwards heartbeat-derived online presence reads.
  async getOnlinePresence(input: Record<string, unknown>) {
    return this.call('getOnlinePresence', this.svc.getOnlinePresence(input as any, this.metadata(input)))
  }

  // getEmployeeTimeline forwards one employee activity timeline read.
  async getEmployeeTimeline(input: Record<string, unknown>) {
    return this.call('getEmployeeTimeline', this.svc.getEmployeeTimeline(input as any, this.metadata(input)))
  }

  // getDomainAggregation forwards domain aggregate reads.
  async getDomainAggregation(input: Record<string, unknown>) {
    return this.call('getDomainAggregation', this.svc.getDomainAggregation(input as any, this.metadata(input)))
  }

  // searchUrls forwards sensitive URL detail reads to browser-activity-service.
  async searchUrls(input: Record<string, unknown>) {
    return this.call('searchUrls', this.svc.searchUrls(input as any, this.metadata(input)))
  }

  // metadata creates internal metadata from the trusted trace context included by the BFF.
  private metadata(input: Record<string, unknown>) {
    const trace = (input.trace ?? {}) as { requestId?: string; traceId?: string }
    return this.metadataFactory.createInternalCallMetadata(
      toInternalCallMetadataInput({
        requestId: trace.requestId,
        traceId: trace.traceId
      })
    )
  }

  // call wraps one browser-activity-service RPC with shared gateway transport error handling.
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  // opts identifies the gateway caller and downstream method for transport error context.
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
