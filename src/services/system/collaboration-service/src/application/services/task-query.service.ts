import { Inject, Injectable } from '@nestjs/common'
import { TaskInvalidArgumentError, TaskNotFoundError, TaskPermissionDeniedError } from '../../common/errors/task.errors'
import { TASK_REPOSITORY, TaskRepository } from '../../domain/repositories/task.repository'
import { TaskListScope, TaskPriority, TaskStatus } from '../../domain/value-objects/task.enums'
import { GetTaskInput, ListTasksInput, ListTasksResult, TaskQueryItem } from '../dtos/task-query.dto'

const DEFAULT_STATUSES = [TaskStatus.OPEN, TaskStatus.IN_PROGRESS]
const MAX_PAGE_SIZE = 100

/** TaskQueryService builds participant-scoped Task P1 query filters and derived views. */
@Injectable()
export class TaskQueryService {
  constructor(@Inject(TASK_REPOSITORY) private readonly repository: TaskRepository) {}

  /** listTasks returns one personal Task P1 scope with overdue derived at read time. */
  async listTasks(input: ListTasksInput): Promise<ListTasksResult> {
    const tenantId = requireText(input.tenantId, 'tenantId')
    const operatorAccountId = requireText(input.operatorAccountId, 'operatorAccountId')
    const scope = requireEnum(input.scope, TaskListScope, 'scope')
    const now = input.now ?? new Date()
    const page = normalizePage(input.page)
    const pageSize = normalizePageSize(input.pageSize)
    const statuses = input.statuses?.length
      ? input.statuses.map((status) => requireEnum(status, TaskStatus, 'status'))
      : DEFAULT_STATUSES
    const priorities = input.priorities?.map((priority) =>
      requireEnum(priority, TaskPriority, 'priority')
    )

    const result = await this.repository.list({
      tenantId,
      operatorAccountId,
      scope,
      statuses,
      priorities,
      dueBefore: input.dueBefore,
      dueAfter: input.dueAfter,
      keyword: normalizeText(input.keyword),
      overdueOnly: Boolean(input.overdueOnly),
      includeArchived: Boolean(input.includeArchived),
      archivedOnly: Boolean(input.archivedOnly),
      page,
      pageSize,
      now
    })

    return {
      items: result.items.map((task) => this.toQueryItem(task, now)),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    }
  }

  /** getTask returns one participant-visible task detail with overdue derived at read time. */
  async getTask(input: GetTaskInput): Promise<TaskQueryItem> {
    const tenantId = requireText(input.tenantId, 'tenantId')
    const taskId = requireText(input.taskId, 'taskId')
    const operatorAccountId = requireText(input.operatorAccountId, 'operatorAccountId')
    const task = await this.repository.findById(tenantId, taskId)
    if (!task) {
      throw new TaskNotFoundError()
    }
    if (!task.canRead(operatorAccountId)) {
      throw new TaskPermissionDeniedError('only task creator or assignee can read the task')
    }
    return this.toQueryItem(task, input.now ?? new Date())
  }

  /** toQueryItem attaches derived overdue without mutating the Task aggregate. */
  private toQueryItem(task: { isOverdue(now: Date): boolean } & TaskQueryItem['task'], now: Date): TaskQueryItem {
    return {
      task,
      overdue: task.isOverdue(now)
    }
  }
}

/** requireText trims required query text inputs and rejects blanks. */
function requireText(value: string | undefined | null, fieldName: string): string {
  const normalized = normalizeText(value)
  if (!normalized) {
    throw new TaskInvalidArgumentError(`${fieldName} is required`)
  }
  return normalized
}

/** normalizeText trims optional query text and returns undefined for blanks. */
function normalizeText(value: string | undefined | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

/** requireEnum validates enum values accepted by Task P1 query APIs. */
function requireEnum<T extends Record<string, string>>(
  value: string,
  enumType: T,
  fieldName: string
): T[keyof T] {
  if (!Object.values(enumType).includes(value)) {
    throw new TaskInvalidArgumentError(`${fieldName} is invalid`)
  }
  return value as T[keyof T]
}

/** normalizePage validates and defaults one-based page numbers. */
function normalizePage(value?: number): number {
  const page = value ?? 1
  if (!Number.isInteger(page) || page < 1) {
    throw new TaskInvalidArgumentError('page is invalid')
  }
  return page
}

/** normalizePageSize validates and clamps list page sizes to the P1 maximum. */
function normalizePageSize(value?: number): number {
  const pageSize = value ?? 20
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new TaskInvalidArgumentError('pageSize is invalid')
  }
  return Math.min(pageSize, MAX_PAGE_SIZE)
}
