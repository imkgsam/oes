import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  TASK_COMMAND_SERVICE_NAME,
  TaskCommandServiceClient
} from '@oes/common/generated/collaboration_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { GatewayCollaborationGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { mapTaskView } from './task-grpc-mappers'

const CALLER = 'api-gateway'

/** TaskCommandGrpcAdapter proxies Task P1 mutations to collaboration-service. */
@Injectable()
export class TaskCommandGrpcAdapter implements OnModuleInit {
  private svc!: TaskCommandServiceClient

  constructor(
    private readonly client: GatewayCollaborationGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getClient().getService<TaskCommandServiceClient>(TASK_COMMAND_SERVICE_NAME)
  }

  async call(method: keyof TaskCommandServiceClient, request: Record<string, unknown>, source: DownstreamRequestSource) {
    const metadata = method === 'createTask'
      ? await this.trustedExecution.forBusinessCall(source, 'urn:oes:service:collaboration-service', ['collaboration.task.create'])
      : await this.trustedExecution.forSelfServiceCall(source, 'urn:oes:service:collaboration-service')
    const response = await safeGrpcCall(
      (this.svc[method] as any)(stripAuthority(request), metadata),
      this.opts(String(method))
    )
    return { task: mapTaskView((response as any).task) }
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method: `TaskCommandService.${method}` }
  }
}

function stripAuthority(request: Record<string, unknown>): Record<string, unknown> {
  const { tenantId, operatorContext, traceContext, auditContext, ...business } = request
  return business
}
