import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  TASK_QUERY_SERVICE_NAME,
  TaskQueryServiceClient
} from '@oes/common/generated/collaboration_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import { mapTaskView } from './task-grpc-mappers'

const CALLER = 'api-gateway'

/** TaskQueryGrpcAdapter proxies Task P1 personal reads to collaboration-service. */
@Injectable()
export class TaskQueryGrpcAdapter implements OnModuleInit {
  private svc!: TaskQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.COLLABORATION)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<TaskQueryServiceClient>(TASK_QUERY_SERVICE_NAME)
  }

  async listTasks(request: Record<string, unknown>, source: DownstreamRequestSource) {
    const response = await safeGrpcCall(
      this.svc.listTasks(request as any, this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))),
      this.opts('listTasks')
    )
    return {
      items: (response.items ?? []).map(mapTaskView),
      page: response.page ?? 1,
      pageSize: response.pageSize ?? 20,
      total: response.total ?? 0
    }
  }

  async getTask(request: Record<string, unknown>, source: DownstreamRequestSource) {
    const response = await safeGrpcCall(
      this.svc.getTask(request as any, this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))),
      this.opts('getTask')
    )
    return { task: mapTaskView(response.task) }
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method: `TaskQueryService.${method}` }
  }
}
