import { TaskEntity } from '../../domain/entities/task.entity'
import { TaskPriority } from '../../domain/value-objects/task.enums'
import type { TaskDelegatedExecutionInput } from '../task/task-delegated-execution-policy.port'

export type TaskCommandContext = {
  tenantId: string
  operatorAccountId: string
  traceId?: string
  auditId?: string
  now?: Date
  delegatedExecution?: TaskDelegatedExecutionInput
}

export type CreateTaskInput = TaskCommandContext & {
  title: string
  description?: string | null
  assigneeAccountId?: string | null
  dueAt?: Date | null
  priority?: TaskPriority
  idempotencyKey?: string
}

export type UpdateTaskInput = TaskCommandContext & {
  taskId: string
  title?: string
  description?: string | null
  dueAt?: Date | null
  priority?: TaskPriority
}

export type TaskIdCommandInput = TaskCommandContext & {
  taskId: string
}

export type CompleteTaskInput = TaskIdCommandInput & {
  completionNote?: string | null
}

export type CancelTaskInput = TaskIdCommandInput & {
  cancelReason?: string | null
}

export type ReopenTaskInput = TaskIdCommandInput & {
  reopenReason?: string | null
}

/** TaskCommandResult is the saved Task aggregate returned by command use cases. */
export type TaskCommandResult = TaskEntity
