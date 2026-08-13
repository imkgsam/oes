import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  ANNOTATION_COMMAND_SERVICE_NAME,
  AnnotationCommandServiceClient
} from '@oes/common/generated/collaboration_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { GatewayCollaborationGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'
import { mapAnnotationView } from './annotation-grpc-mappers'

const CALLER = 'api-gateway'

/** AnnotationCommandGrpcAdapter proxies Annotation P1 mutations to collaboration-service. */
@Injectable()
export class AnnotationCommandGrpcAdapter implements OnModuleInit {
  private svc!: AnnotationCommandServiceClient

  constructor(
    private readonly client: GatewayCollaborationGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getClient().getService<AnnotationCommandServiceClient>(ANNOTATION_COMMAND_SERVICE_NAME)
  }

  async call(
    method: keyof AnnotationCommandServiceClient,
    request: Record<string, unknown>,
    source: DownstreamRequestSource
  ) {
    const metadata = method === 'createAnnotation' || method === 'setAnnotationPinned'
      ? await this.trustedExecution.forBusinessCall(source, 'urn:oes:service:collaboration-service', [method === 'createAnnotation' ? 'collaboration.annotation.create' : 'collaboration.annotation.manage'])
      : await this.trustedExecution.forSelfServiceCall(source, 'urn:oes:service:collaboration-service')
    const response = await safeGrpcCall(
      (this.svc[method] as any)(stripAuthority(request), metadata),
      this.opts(String(method))
    )
    return { annotation: mapAnnotationView((response as any).annotation) }
  }

  /** opts creates a stable safeGrpcCall descriptor for Annotation command calls. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method: `AnnotationCommandService.${method}` }
  }
}

function stripAuthority(request: Record<string, unknown>): Record<string, unknown> {
  const { tenantId, operatorContext, traceContext, auditContext, ...business } = request
  return business
}
