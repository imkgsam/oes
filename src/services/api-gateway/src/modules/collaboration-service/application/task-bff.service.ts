import { BadRequestException, Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { TaskCommandGrpcAdapter } from '../adapters/task-command-grpc.adapter'
import { toProtoPriority, toProtoScope, toProtoStatus } from '../adapters/task-grpc-mappers'
import { TaskQueryGrpcAdapter } from '../adapters/task-query-grpc.adapter'
import { CancelTaskDto, CompleteTaskDto, CreateTaskDto, ListTasksDto, ReopenTaskDto, UpdateTaskDto } from '../interface/http/dtos/task.dto'

/** TaskBffService builds gateway Task P1 requests without owning task business rules. */
@Injectable()
export class TaskBffService {
  constructor(
    private readonly commandAdapter: TaskCommandGrpcAdapter,
    private readonly queryAdapter: TaskQueryGrpcAdapter
  ) {}

  listTasks(tenantId: string, query: ListTasksDto, source: DownstreamRequestSource) {
    return this.queryAdapter.listTasks(
      {
        ...this.context(tenantId, source),
        scope: toProtoScope(query.scope),
        status: asArray(query.status).map(toProtoStatus),
        priority: asArray(query.priority).map((priority) => toProtoPriority(priority)).filter(Boolean),
        dueBefore: query.dueBefore,
        dueAfter: query.dueAfter,
        keyword: query.keyword,
        overdueOnly: toBoolean(query.overdueOnly),
        includeArchived: toBoolean(query.includeArchived),
        archivedOnly: toBoolean(query.archivedOnly),
        page: toPositiveInt(query.page, 1),
        pageSize: toPositiveInt(query.pageSize, 20)
      },
      source
    )
  }

  getTask(tenantId: string, taskId: string, source: DownstreamRequestSource) {
    return this.queryAdapter.getTask({ ...this.context(tenantId, source), taskId }, source)
  }

  createTask(tenantId: string, body: CreateTaskDto, source: DownstreamRequestSource) {
    return this.commandAdapter.call(
      'createTask',
      {
        ...this.commandContext(tenantId, source),
        title: body.title,
        description: body.description,
        assigneeAccountId: body.assigneeAccountId,
        dueAt: body.dueAt,
        priority: toProtoPriority(body.priority)
      },
      source
    )
  }

  updateTask(tenantId: string, taskId: string, body: UpdateTaskDto, source: DownstreamRequestSource) {
    return this.commandAdapter.call(
      'updateTask',
      {
        ...this.commandContext(tenantId, source),
        taskId,
        title: body.title,
        description: body.description,
        dueAt: body.dueAt,
        priority: toProtoPriority(body.priority)
      },
      source
    )
  }

  startTask(tenantId: string, taskId: string, source: DownstreamRequestSource) {
    return this.commandAdapter.call('startTask', { ...this.commandContext(tenantId, source), taskId }, source)
  }

  completeTask(tenantId: string, taskId: string, body: CompleteTaskDto, source: DownstreamRequestSource) {
    return this.commandAdapter.call(
      'completeTask',
      { ...this.commandContext(tenantId, source), taskId, completionNote: body.completionNote },
      source
    )
  }

  cancelTask(tenantId: string, taskId: string, body: CancelTaskDto, source: DownstreamRequestSource) {
    return this.commandAdapter.call(
      'cancelTask',
      { ...this.commandContext(tenantId, source), taskId, cancelReason: body.cancelReason },
      source
    )
  }

  reopenTask(tenantId: string, taskId: string, body: ReopenTaskDto, source: DownstreamRequestSource) {
    return this.commandAdapter.call(
      'reopenTask',
      { ...this.commandContext(tenantId, source), taskId, reopenReason: body.reopenReason },
      source
    )
  }

  archiveTask(tenantId: string, taskId: string, source: DownstreamRequestSource) {
    return this.commandAdapter.call('archiveTask', { ...this.commandContext(tenantId, source), taskId }, source)
  }

  unarchiveTask(tenantId: string, taskId: string, source: DownstreamRequestSource) {
    return this.commandAdapter.call('unarchiveTask', { ...this.commandContext(tenantId, source), taskId }, source)
  }

  /** context builds the explicit Task P1 query context from gateway auth state. */
  private context(tenantId: string, source: DownstreamRequestSource) {
    const operatorAccountId = source.user?.holderId || source.user?.aid || source.user?.id || source.user?.sub
    if (!operatorAccountId) throw new BadRequestException('operator account context is required')
    return {
      tenantId,
      operatorContext: {
        accountId: operatorAccountId,
        userId: source.user?.userId || source.user?.sub,
        tenantId
      },
      traceContext: {
        traceId: source.traceId || source.requestId || `gateway-${Date.now()}`
      }
    }
  }

  /** commandContext extends query context with audit metadata for Task P1 command calls. */
  private commandContext(tenantId: string, source: DownstreamRequestSource) {
    return {
      ...this.context(tenantId, source),
      auditContext: {
        auditId: source.requestId,
        source: 'api-gateway'
      }
    }
  }
}

/** asArray normalizes repeatable query params from tenant-web and HTTP clients. */
function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

/** toBoolean normalizes bool query params from strings and booleans. */
function toBoolean(value: boolean | string | undefined): boolean {
  return value === true || value === 'true'
}

/** toPositiveInt normalizes positive integer query params with defaults. */
function toPositiveInt(value: number | string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}
