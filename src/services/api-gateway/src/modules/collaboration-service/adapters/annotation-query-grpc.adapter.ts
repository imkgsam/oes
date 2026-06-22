import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  ANNOTATION_QUERY_SERVICE_NAME,
  AnnotationQueryServiceClient
} from '@oes/common/generated/collaboration_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import { mapAnnotationView } from './annotation-grpc-mappers'

const CALLER = 'api-gateway'

/** AnnotationQueryGrpcAdapter proxies Annotation P1 object reads to collaboration-service. */
@Injectable()
export class AnnotationQueryGrpcAdapter implements OnModuleInit {
  private svc!: AnnotationQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.COLLABORATION)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<AnnotationQueryServiceClient>(ANNOTATION_QUERY_SERVICE_NAME)
  }

  async listAnnotationsForObject(request: Record<string, unknown>, source: DownstreamRequestSource) {
    const response = await safeGrpcCall(
      this.svc.listAnnotationsForObject(
        request as any,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
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
      this.svc.getAnnotation(
        request as any,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      this.opts('getAnnotation')
    )
    return { annotation: mapAnnotationView(response.annotation) }
  }

  /** opts creates a stable safeGrpcCall descriptor for Annotation query calls. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method: `AnnotationQueryService.${method}` }
  }
}
