import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { IdentityQueryGrpcAdapter } from '../../auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { TaskCommandGrpcAdapter } from '../adapters/task-command-grpc.adapter'
import { toProtoPriority, toProtoScope, toProtoStatus } from '../adapters/task-grpc-mappers'
import { TaskQueryGrpcAdapter } from '../adapters/task-query-grpc.adapter'
import { CancelTaskDto, CompleteTaskDto, CreateTaskDto, ListTasksDto, ReopenTaskDto, UpdateTaskDto } from '../interface/http/dtos/task.dto'

/** TaskBffService builds gateway Task P1 requests without owning task business rules. */
@Injectable()
export class TaskBffService {
  constructor(
    private readonly commandAdapter: TaskCommandGrpcAdapter,
    private readonly queryAdapter: TaskQueryGrpcAdapter,
    private readonly identityAdapter: IdentityQueryGrpcAdapter
  ) {}

  async listTasks(tenantId: string, query: ListTasksDto, source: DownstreamRequestSource) {
    const result = await this.queryAdapter.listTasks(
      {
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
    return this.enrichTaskListResult(result, source)
  }

  async getTask(tenantId: string, taskId: string, source: DownstreamRequestSource) {
    const result = await this.queryAdapter.getTask({ taskId }, source)
    return this.enrichTaskResponse(result, source)
  }

  async createTask(tenantId: string, body: CreateTaskDto, source: DownstreamRequestSource) {
    const result = await this.commandAdapter.call(
      'createTask',
      {
        title: body.title,
        description: body.description,
        assigneeAccountId: body.assigneeAccountId,
        dueAt: body.dueAt,
        priority: toProtoPriority(body.priority)
      },
      source
    )
    return this.enrichTaskResponse(result, source)
  }

  async updateTask(tenantId: string, taskId: string, body: UpdateTaskDto, source: DownstreamRequestSource) {
    const result = await this.commandAdapter.call(
      'updateTask',
      {
        taskId,
        title: body.title,
        description: body.description,
        dueAt: body.dueAt,
        priority: toProtoPriority(body.priority)
      },
      source
    )
    return this.enrichTaskResponse(result, source)
  }

  async startTask(tenantId: string, taskId: string, source: DownstreamRequestSource) {
    const result = await this.commandAdapter.call('startTask', { taskId }, source)
    return this.enrichTaskResponse(result, source)
  }

  async completeTask(tenantId: string, taskId: string, body: CompleteTaskDto, source: DownstreamRequestSource) {
    const result = await this.commandAdapter.call(
      'completeTask',
      { taskId, completionNote: body.completionNote },
      source
    )
    return this.enrichTaskResponse(result, source)
  }

  async cancelTask(tenantId: string, taskId: string, body: CancelTaskDto, source: DownstreamRequestSource) {
    const result = await this.commandAdapter.call(
      'cancelTask',
      { taskId, cancelReason: body.cancelReason },
      source
    )
    return this.enrichTaskResponse(result, source)
  }

  async reopenTask(tenantId: string, taskId: string, body: ReopenTaskDto, source: DownstreamRequestSource) {
    const result = await this.commandAdapter.call(
      'reopenTask',
      { taskId, reopenReason: body.reopenReason },
      source
    )
    return this.enrichTaskResponse(result, source)
  }

  async archiveTask(tenantId: string, taskId: string, source: DownstreamRequestSource) {
    const result = await this.commandAdapter.call('archiveTask', { taskId }, source)
    return this.enrichTaskResponse(result, source)
  }

  async unarchiveTask(tenantId: string, taskId: string, source: DownstreamRequestSource) {
    const result = await this.commandAdapter.call('unarchiveTask', { taskId }, source)
    return this.enrichTaskResponse(result, source)
  }

  /** enrichTaskListResult attaches participant labels after collaboration-service has enforced Task visibility. */
  private async enrichTaskListResult<T extends { items?: Array<Record<string, unknown>> }>(
    result: T,
    source: DownstreamRequestSource
  ) {
    const participantNames = await this.loadParticipantNames(result.items ?? [], source)
    return {
      ...result,
      items: (result.items ?? []).map((task) => this.withParticipantLabels(task, participantNames))
    }
  }

  /** enrichTaskResponse attaches participant labels to one command or detail response. */
  private async enrichTaskResponse<T extends { task?: Record<string, unknown> }>(
    result: T,
    source: DownstreamRequestSource
  ) {
    if (!result.task) return result
    const participantNames = await this.loadParticipantNames([result.task], source)
    return {
      ...result,
      task: this.withParticipantLabels(result.task, participantNames)
    }
  }

  /** loadParticipantNames resolves only creator and assignee accounts already visible through Task P1. */
  private async loadParticipantNames(
    tasks: Array<Record<string, unknown>>,
    source: DownstreamRequestSource
  ): Promise<Map<string, string | undefined>> {
    const accountIds = [
      ...new Set(
        tasks
          .flatMap((task) => [task.createdByAccountId, task.assigneeAccountId])
          .map((accountId) => normalize(accountId))
          .filter(Boolean)
      )
    ] as string[]
    const entries = await Promise.all(
      accountIds.map(async (accountId) => {
        const result = await this.identityAdapter.getAccountById(accountId, source)
        return [accountId, normalize(result.account?.displayName)] as const
      })
    )
    return new Map(entries)
  }

  /** withParticipantLabels adds display-only participant labels without mutating Task P1 domain fields. */
  private withParticipantLabels(
    task: Record<string, unknown>,
    participantNames: Map<string, string | undefined>
  ) {
    const createdByAccountId = normalize(task.createdByAccountId)
    const assigneeAccountId = normalize(task.assigneeAccountId)
    return {
      ...task,
      createdByDisplayName: createdByAccountId ? participantNames.get(createdByAccountId) : undefined,
      assigneeDisplayName: assigneeAccountId ? participantNames.get(assigneeAccountId) : undefined
    }
  }

}

/** normalize returns a trimmed string value when an external payload field is usable. */
function normalize(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
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
