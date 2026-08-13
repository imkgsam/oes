import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  ANNOTATION_QUERY_SERVICE_NAME,
  AnnotationQueryServiceClient
} from '@oes/common/generated/collaboration_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { GatewayCollaborationGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'
import { mapAnnotationView } from './annotation-grpc-mappers'

const CALLER = 'api-gateway'

/** AnnotationQueryGrpcAdapter proxies Annotation P1 object reads to collaboration-service. */
@Injectable()
export class AnnotationQueryGrpcAdapter implements OnModuleInit {
  private svc!: AnnotationQueryServiceClient

  constructor(
    private readonly client: GatewayCollaborationGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getClient().getService<AnnotationQueryServiceClient>(ANNOTATION_QUERY_SERVICE_NAME)
  }

  async listAnnotationsForObject(request: Record<string, unknown>, source: DownstreamRequestSource) {
    const response = await safeGrpcCall(
      this.svc.listAnnotationsForObject(stripAuthority(request) as any, await this.trustedExecution.forSelfServiceCall(source, 'urn:oes:service:collaboration-service')),
      this.opts('listAnnotationsForObject')
    )
    return {
      items: (response.items ?? []).map(mapAnnotationView),
      page: response.page ?? 1,
      pageSize: response.pageSize ?? 20,
      total: response.total ?? 0
    }
  }

  async getAnnotation(request: Record<string, unknown>, source: DownstreamRequestSource) {
    const response = await safeGrpcCall(
      this.svc.getAnnotation(stripAuthority(request) as any, await this.trustedExecution.forSelfServiceCall(source, 'urn:oes:service:collaboration-service')),
      this.opts('getAnnotation')
    )
    return { annotation: mapAnnotationView(response.annotation) }
  }

  /** opts creates a stable safeGrpcCall descriptor for Annotation query calls. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method: `AnnotationQueryService.${method}` }
  }
}

function stripAuthority(request: Record<string, unknown>): Record<string, unknown> {
  const { tenantId, operatorContext, traceContext, ...business } = request
  return business
}
