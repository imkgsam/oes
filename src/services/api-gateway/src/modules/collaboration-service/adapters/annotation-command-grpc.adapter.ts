import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  ANNOTATION_COMMAND_SERVICE_NAME,
  AnnotationCommandServiceClient
} from '@oes/common/generated/collaboration_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import { mapAnnotationView } from './annotation-grpc-mappers'

const CALLER = 'api-gateway'

/** AnnotationCommandGrpcAdapter proxies Annotation P1 mutations to collaboration-service. */
@Injectable()
export class AnnotationCommandGrpcAdapter implements OnModuleInit {
  private svc!: AnnotationCommandServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.COLLABORATION)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<AnnotationCommandServiceClient>(ANNOTATION_COMMAND_SERVICE_NAME)
  }

  async call(
    method: keyof AnnotationCommandServiceClient,
    request: Record<string, unknown>,
    source: DownstreamRequestSource
  ) {
    const response = await safeGrpcCall(
      (this.svc[method] as any)(
        request,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      this.opts(String(method))
    )
    return { annotation: mapAnnotationView((response as any).annotation) }
  }

  /** opts creates a stable safeGrpcCall descriptor for Annotation command calls. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method: `AnnotationCommandService.${method}` }
  }
}
