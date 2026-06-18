import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  TASK_COMMAND_SERVICE_NAME,
  TaskCommandServiceClient
} from '@oes/common/generated/collaboration_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import { mapTaskView } from './task-grpc-mappers'

const CALLER = 'api-gateway'

/** TaskCommandGrpcAdapter proxies Task P1 mutations to collaboration-service. */
@Injectable()
export class TaskCommandGrpcAdapter implements OnModuleInit {
  private svc!: TaskCommandServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.COLLABORATION)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<TaskCommandServiceClient>(TASK_COMMAND_SERVICE_NAME)
  }

  async call(method: keyof TaskCommandServiceClient, request: Record<string, unknown>, source: DownstreamRequestSource) {
    const response = await safeGrpcCall(
      (this.svc[method] as any)(request, this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))),
      this.opts(String(method))
    )
    return { task: mapTaskView((response as any).task) }
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method: `TaskCommandService.${method}` }
  }
}
