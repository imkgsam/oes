import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { AuthorizeSelfServiceRpc, TrustedExecutionGuard } from '@oes/common/authorization'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  GetTaskRequest,
  GetTaskResponse,
  ListTasksRequest,
  ListTasksResponse,
  TaskQueryServiceController,
  TaskQueryServiceControllerMethods
} from '@oes/common/generated/collaboration_service'
import { TaskQueryService } from '../../application/services/task-query.service'
import {
  fromProtoListScope,
  fromProtoPriority,
  fromProtoStatus,
  mapTaskError,
  parseOptionalDate,
  requireQueryContext
} from './task-grpc.mapping'
import { presentTask } from './task-grpc.presenter'

/** TaskQueryGrpcController exposes Task P1 personal list and detail queries over internal gRPC. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@Controller()
@TaskQueryServiceControllerMethods()
export class TaskQueryGrpcController implements TaskQueryServiceController {
  constructor(private readonly taskQueryService: TaskQueryService) {}

  async listTasks(request: ListTasksRequest): Promise<ListTasksResponse> {
    try {
      const context = requireQueryContext(request)
      const result = await this.taskQueryService.listTasks({
        tenantId: context.tenantId,
        operatorAccountId: context.operatorAccountId,
        scope: fromProtoListScope(request.scope),
        statuses: request.status?.map(fromProtoStatus),
        priorities: request.priority?.map(fromProtoPriority).filter(Boolean) as any,
        dueBefore: parseOptionalDate(request.dueBefore, 'due_before') ?? undefined,
        dueAfter: parseOptionalDate(request.dueAfter, 'due_after') ?? undefined,
        keyword: request.keyword,
        overdueOnly: request.overdueOnly,
        includeArchived: request.includeArchived,
        archivedOnly: request.archivedOnly,
        page: request.page,
        pageSize: request.pageSize
      })
      return {
        items: result.items.map((item) => presentTask(item.task, item.overdue)),
        page: result.page,
        pageSize: result.pageSize,
        total: result.total
      }
    } catch (error) {
      mapTaskError(error)
    }
  }

  async getTask(request: GetTaskRequest): Promise<GetTaskResponse> {
    try {
      const context = requireQueryContext(request)
      const result = await this.taskQueryService.getTask({
        tenantId: context.tenantId,
        operatorAccountId: context.operatorAccountId,
        taskId: request.taskId ?? ''
      })
      return { task: presentTask(result.task, result.overdue) }
    } catch (error) {
      mapTaskError(error)
    }
  }
}

for (const method of ['listTasks', 'getTask'] as const) {
  AuthorizeSelfServiceRpc({ allowDelegated: false, sessionTerminals: ['WEB'] })(
    TaskQueryGrpcController.prototype,
    method,
    Object.getOwnPropertyDescriptor(TaskQueryGrpcController.prototype, method)!
  )
}
