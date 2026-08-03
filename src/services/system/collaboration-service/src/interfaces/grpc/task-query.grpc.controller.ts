import { Controller, UseFilters } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
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
  requireQueryContext,
  resolveTaskDelegatedAuthority
} from './task-grpc.mapping'
import { presentTask } from './task-grpc.presenter'

/** TaskQueryGrpcController exposes Task P1 personal list and detail queries over internal gRPC. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@TaskQueryServiceControllerMethods()
export class TaskQueryGrpcController implements TaskQueryServiceController {
  constructor(private readonly taskQueryService: TaskQueryService) {}

  /** Maps ListTasks into the verified HUMAN participant scope for both HUMAN and DELEGATED callers. */
  async listTasks(request: ListTasksRequest, metadata?: Metadata): Promise<ListTasksResponse> {
    try {
      const context = this.queryContext(request, metadata)
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

  /** Maps GetTask into the verified HUMAN participant scope without accepting an ActionGrant. */
  async getTask(request: GetTaskRequest, metadata?: Metadata): Promise<GetTaskResponse> {
    try {
      const context = this.queryContext(request, metadata)
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

  /** Projects DELEGATED reads to the verified HUMAN while rejecting irrelevant ActionGrant presentation. */
  private queryContext(request: Parameters<typeof requireQueryContext>[0], metadata?: Metadata) {
    const context = requireQueryContext(request)
    const delegated = resolveTaskDelegatedAuthority(request, metadata)
    if (delegated?.delegatedExecution?.actionGrant)
      throw new Error('ACTION_GRANT_FORBIDDEN_OPERATION')
    return delegated ? { ...context, operatorAccountId: delegated.operatorAccountId } : context
  }
}
