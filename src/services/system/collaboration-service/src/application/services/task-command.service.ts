import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { COLLABORATION_TASK_PERMISSION_CODES } from '@oes/common/authorization'
import {
  TaskAssigneeNotActiveError,
  TaskInvalidArgumentError,
  TaskNotFoundError,
  TaskPermissionDeniedError
} from '../../common/errors/task.errors'
import {
  ACCOUNT_REFERENCE_PORT,
  AccountReferencePort
} from '../ports/account-reference.port'
import { TASK_AUDIT_PORT, TaskAuditAction, TaskAuditPort } from '../ports/task-audit.port'
import {
  TASK_EVENT_PUBLISHER_PORT,
  TaskEventPublisherPort
} from '../ports/task-event-publisher.port'
import { TASK_PERMISSION_PORT, TaskPermissionPort } from '../ports/task-permission.port'
import { TASK_REPOSITORY, TaskRepository } from '../../domain/repositories/task.repository'
import { TaskEntity } from '../../domain/entities/task.entity'
import { TaskPriority, TaskStatus, TaskVisibility } from '../../domain/value-objects/task.enums'
import {
  CancelTaskInput,
  CompleteTaskInput,
  CreateTaskInput,
  ReopenTaskInput,
  TaskIdCommandInput,
  UpdateTaskInput
} from '../dtos/task.dto'
import { TaskFactEvent, TaskFactEventType } from '../events/task.events'

/** TaskCommandService orchestrates Task P1 commands, audit records, and task fact events. */
@Injectable()
export class TaskCommandService {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly repository: TaskRepository,
    @Inject(ACCOUNT_REFERENCE_PORT) private readonly accountReference: AccountReferencePort,
    @Inject(TASK_AUDIT_PORT) private readonly audit: TaskAuditPort,
    @Inject(TASK_EVENT_PUBLISHER_PORT) private readonly eventPublisher: TaskEventPublisherPort,
    @Inject(TASK_PERMISSION_PORT) private readonly permissions: TaskPermissionPort
  ) {}

  /** createTask creates either a private self todo or an assigned participant task. */
  async createTask(input: CreateTaskInput): Promise<TaskEntity> {
    const now = input.now ?? new Date()
    const tenantId = requireText(input.tenantId, 'tenantId')
    const operatorAccountId = requireText(input.operatorAccountId, 'operatorAccountId')
    const assigneeAccountId = normalizeText(input.assigneeAccountId) ?? operatorAccountId
    const isSelfTodo = assigneeAccountId === operatorAccountId

    if (!isSelfTodo) {
      await this.assertCanAssign(tenantId, operatorAccountId)
      await this.assertActiveAssignee(tenantId, assigneeAccountId)
    }

    const task = new TaskEntity({
      id: randomUUID(),
      tenantId,
      title: requireText(input.title, 'title'),
      description: normalizeText(input.description),
      createdByAccountId: operatorAccountId,
      assigneeAccountId,
      visibility: isSelfTodo ? TaskVisibility.PRIVATE : TaskVisibility.ASSIGNMENT_PARTICIPANTS,
      status: TaskStatus.OPEN,
      priority: input.priority ?? TaskPriority.NORMAL,
      dueAt: input.dueAt ?? null,
      startedAt: null,
      completedAt: null,
      completedByAccountId: null,
      completionNote: null,
      cancelledAt: null,
      cancelledByAccountId: null,
      cancelReason: null,
      archivedAt: null,
      archivedByAccountId: null,
      createdAt: now,
      updatedAt: now
    })

    const saved = await this.repository.create(task)
    await this.recordAudit('TASK_CREATED', saved, input)
    await this.publishEvent('TaskCreated', saved, input, now)
    if (!isSelfTodo) {
      await this.publishEvent('TaskAssigned', saved, input, now)
    }
    return saved
  }

  /** updateTask changes creator-owned active task basics without mutating status or assignee. */
  async updateTask(input: UpdateTaskInput): Promise<TaskEntity> {
    const task = await this.loadTask(input)
    if (task.createdByAccountId !== input.operatorAccountId) {
      throw new TaskPermissionDeniedError('only task creator can update task basics')
    }
    const previousStatus = task.status
    task.updateBasics(
      {
        title: input.title,
        description: input.description,
        dueAt: input.dueAt,
        priority: input.priority
      },
      input.now ?? new Date()
    )
    return this.saveAuditAndPublish(task, input, 'TASK_UPDATED', 'TaskUpdated', previousStatus)
  }

  /** startTask starts a task by assignee and emits TaskStarted after persistence. */
  async startTask(input: TaskIdCommandInput): Promise<TaskEntity> {
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.start(input.operatorAccountId, input.now ?? new Date())
    return this.saveAuditAndPublish(task, input, 'TASK_STARTED', 'TaskStarted', previousStatus)
  }

  /** completeTask completes a task by creator or assignee and records the optional note snapshot. */
  async completeTask(input: CompleteTaskInput): Promise<TaskEntity> {
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.complete(input.operatorAccountId, input.completionNote ?? null, input.now ?? new Date())
    return this.saveAuditAndPublish(
      task,
      input,
      'TASK_COMPLETED',
      'TaskCompleted',
      previousStatus,
      input.completionNote
    )
  }

  /** cancelTask cancels an active task by creator and records the optional reason snapshot. */
  async cancelTask(input: CancelTaskInput): Promise<TaskEntity> {
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.cancel(input.operatorAccountId, input.cancelReason ?? null, input.now ?? new Date())
    return this.saveAuditAndPublish(
      task,
      input,
      'TASK_CANCELLED',
      'TaskCancelled',
      previousStatus,
      input.cancelReason
    )
  }

  /** reopenTask reopens a terminal unarchived task under the frozen P1 participant rules. */
  async reopenTask(input: ReopenTaskInput): Promise<TaskEntity> {
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.reopen(input.operatorAccountId, input.now ?? new Date())
    return this.saveAuditAndPublish(
      task,
      input,
      'TASK_REOPENED',
      'TaskReopened',
      previousStatus,
      input.reopenReason
    )
  }

  /** archiveTask archives terminal tasks by creator only. */
  async archiveTask(input: TaskIdCommandInput): Promise<TaskEntity> {
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.archive(input.operatorAccountId, input.now ?? new Date())
    return this.saveAuditAndPublish(task, input, 'TASK_ARCHIVED', 'TaskArchived', previousStatus)
  }

  /** unarchiveTask removes archive markers by creator only. */
  async unarchiveTask(input: TaskIdCommandInput): Promise<TaskEntity> {
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.unarchive(input.operatorAccountId, input.now ?? new Date())
    return this.saveAuditAndPublish(
      task,
      input,
      'TASK_UNARCHIVED',
      'TaskUnarchived',
      previousStatus
    )
  }

  /** loadTask fetches one task inside the tenant boundary and maps absence to the stable domain error. */
  private async loadTask(input: TaskIdCommandInput): Promise<TaskEntity> {
    const tenantId = requireText(input.tenantId, 'tenantId')
    const taskId = requireText(input.taskId, 'taskId')
    requireText(input.operatorAccountId, 'operatorAccountId')
    const task = await this.repository.findById(tenantId, taskId)
    if (!task) {
      throw new TaskNotFoundError()
    }
    return task
  }

  /** assertCanAssign enforces the only explicit Task P1 permission. */
  private async assertCanAssign(tenantId: string, operatorAccountId: string): Promise<void> {
    const allowed = await this.permissions.canAssignTask({ tenantId, operatorAccountId })
    if (!allowed) {
      throw new TaskPermissionDeniedError(
        `missing permission ${COLLABORATION_TASK_PERMISSION_CODES.ASSIGN}`
      )
    }
  }

  /** assertActiveAssignee validates assignment targets through identity-owned account truth. */
  private async assertActiveAssignee(tenantId: string, accountId: string): Promise<void> {
    const active = await this.accountReference.isActiveTenantAccount({ tenantId, accountId })
    if (!active) {
      throw new TaskAssigneeNotActiveError()
    }
  }

  /** saveAuditAndPublish persists one mutation and emits its audit and task fact side effects. */
  private async saveAuditAndPublish(
    task: TaskEntity,
    input: TaskIdCommandInput,
    auditAction: TaskAuditAction,
    eventType: TaskFactEventType,
    previousStatus: TaskStatus,
    reasonSnapshot?: string | null
  ): Promise<TaskEntity> {
    const saved = await this.repository.save(task)
    await this.recordAudit(auditAction, saved, input, reasonSnapshot)
    if (
      saved.status !== previousStatus ||
      eventType === 'TaskArchived' ||
      eventType === 'TaskUnarchived' ||
      eventType === 'TaskUpdated'
    ) {
      await this.publishEvent(eventType, saved, input, input.now ?? new Date(), previousStatus)
    }
    return saved
  }

  /** recordAudit writes the required local command audit envelope after successful command persistence. */
  private async recordAudit(
    action: TaskAuditAction,
    task: TaskEntity,
    input: CreateTaskInput | TaskIdCommandInput,
    reasonSnapshot?: string | null
  ): Promise<void> {
    await this.audit.record({
      tenantId: task.tenantId,
      taskId: task.id,
      action,
      result: 'SUCCEEDED',
      operatorAccountId: input.operatorAccountId,
      createdByAccountId: task.createdByAccountId,
      assigneeAccountId: task.assigneeAccountId,
      traceId: input.traceId,
      auditId: input.auditId,
      reasonSnapshot: normalizeText(reasonSnapshot) ?? undefined
    })
  }

  /** publishEvent maps the saved aggregate to the frozen P1 task fact payload. */
  private async publishEvent(
    eventType: TaskFactEventType,
    task: TaskEntity,
    input: CreateTaskInput | TaskIdCommandInput,
    occurredAt: Date,
    previousStatus?: TaskStatus
  ): Promise<void> {
    const event: TaskFactEvent = {
      eventId: randomUUID(),
      eventType,
      occurredAt: occurredAt.toISOString(),
      tenantId: task.tenantId,
      taskId: task.id,
      actorAccountId: input.operatorAccountId,
      createdByAccountId: task.createdByAccountId,
      assigneeAccountId: task.assigneeAccountId,
      status: task.status,
      previousStatus,
      priority: task.priority,
      dueAt: task.dueAt?.toISOString(),
      titleSnapshot: task.title,
      traceId: input.traceId
    }
    await this.eventPublisher.publish(event)
  }
}

/** requireText trims required text inputs and maps blanks to a Task P1 invalid argument error. */
function requireText(value: string | undefined | null, fieldName: string): string {
  const normalized = normalizeText(value)
  if (!normalized) {
    throw new TaskInvalidArgumentError(`${fieldName} is required`)
  }
  return normalized
}

/** normalizeText trims optional text inputs and returns undefined for blanks. */
function normalizeText(value: string | undefined | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
