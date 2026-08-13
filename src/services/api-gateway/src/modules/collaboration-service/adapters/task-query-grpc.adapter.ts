import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  TASK_QUERY_SERVICE_NAME,
  TaskQueryServiceClient
} from '@oes/common/generated/collaboration_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { GatewayCollaborationGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { mapTaskView } from './task-grpc-mappers'

const CALLER = 'api-gateway'

/** TaskQueryGrpcAdapter proxies Task P1 personal reads to collaboration-service. */
@Injectable()
export class TaskQueryGrpcAdapter implements OnModuleInit {
  private svc!: TaskQueryServiceClient

  constructor(
    private readonly client: GatewayCollaborationGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getClient().getService<TaskQueryServiceClient>(TASK_QUERY_SERVICE_NAME)
  }

  async listTasks(request: Record<string, unknown>, source: DownstreamRequestSource) {
    const metadata = await this.trustedExecution.forSelfServiceCall(source, 'urn:oes:service:collaboration-service')
    const response = await safeGrpcCall(
      this.svc.listTasks(stripAuthority(request) as any, metadata),
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
    const metadata = await this.trustedExecution.forSelfServiceCall(source, 'urn:oes:service:collaboration-service')
    const response = await safeGrpcCall(
      this.svc.getTask(stripAuthority(request) as any, metadata),
      this.opts('getTask')
    )
    return { task: mapTaskView(response.task) }
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method: `TaskQueryService.${method}` }
  }
}

function stripAuthority(request: Record<string, unknown>): Record<string, unknown> {
  const { tenantId, operatorContext, traceContext, ...business } = request
  return business
}
