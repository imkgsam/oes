import { randomUUID } from 'node:crypto'
import { Inject, Injectable, Optional } from '@nestjs/common'
import { COLLABORATION_TASK_PERMISSION_CODES } from '@oes/common/authorization'
import {
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
  COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT
} from '@oes/common/contracts'
import { createOesCloudEvent, type OesCloudEvent, type OesEventContract } from '@oes/common'
import {
  TaskAssigneeNotActiveError,
  TaskInvalidArgumentError,
  TaskNotFoundError,
  TaskPermissionDeniedError
} from '../../common/errors/task.errors'
import { ACCOUNT_REFERENCE_PORT, AccountReferencePort } from '../ports/account-reference.port'
import { TaskAuditAction, type TaskAuditPort } from '../ports/task-audit.port'
import {
  TASK_COMMAND_TRANSACTION_PORT,
  TaskCommandTransactionPort
} from '../ports/task-command-transaction.port'
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
import {
  TASK_DELEGATED_EXECUTION_POLICY_PORT,
  type TaskDelegatedExecutionPolicyPort
} from '../task/task-delegated-execution-policy.port'

/** TaskCommandService orchestrates Task P1 commands through a single local state, audit, and outbox transaction. */
@Injectable()
export class TaskCommandService {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly repository: TaskRepository,
    @Inject(ACCOUNT_REFERENCE_PORT) private readonly accountReference: AccountReferencePort,
    @Inject(TASK_COMMAND_TRANSACTION_PORT) private readonly transaction: TaskCommandTransactionPort,
    @Inject(TASK_PERMISSION_PORT) private readonly permissions: TaskPermissionPort,
    @Optional()
    @Inject(TASK_DELEGATED_EXECUTION_POLICY_PORT)
    private readonly delegatedExecutionPolicy?: TaskDelegatedExecutionPolicyPort
  ) {}

  /** createTask creates either a private self todo or an assigned participant task. */
  async createTask(input: CreateTaskInput): Promise<TaskEntity> {
    const now = input.now ?? new Date()
    const tenantId = requireText(input.tenantId, 'tenantId')
    const operatorAccountId = requireText(input.operatorAccountId, 'operatorAccountId')
    const assigneeAccountId = normalizeText(input.assigneeAccountId) ?? operatorAccountId
    const isSelfTodo = assigneeAccountId === operatorAccountId
    const title = requireText(input.title, 'title')
    const description = normalizeText(input.description) ?? null
    const priority = input.priority ?? TaskPriority.NORMAL
    const dueAt = input.dueAt ?? null

    const receipt = input.delegatedExecution
      ? await this.requireDelegatedPolicy().authorizeCreate({
          tenantId,
          operatorAccountId,
          assigneeAccountId,
          title,
          description,
          dueAt,
          priority,
          idempotencyKey: input.idempotencyKey,
          execution: input.delegatedExecution
        })
      : undefined

    if (!isSelfTodo) {
      await this.assertCanAssign(tenantId, operatorAccountId)
      await this.assertActiveAssignee(tenantId, assigneeAccountId)
    }

    const task = new TaskEntity({
      id: randomUUID(),
      tenantId,
      title,
      description,
      createdByAccountId: operatorAccountId,
      assigneeAccountId,
      visibility: isSelfTodo ? TaskVisibility.PRIVATE : TaskVisibility.ASSIGNMENT_PARTICIPANTS,
      status: TaskStatus.OPEN,
      priority,
      dueAt,
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

    return this.transaction.commit({
      operation: 'CREATE',
      task,
      audit: this.auditInput(
        'TASK_CREATED',
        task,
        input,
        undefined,
        receipt
          ? {
              delegationReference: receipt.delegationReference,
              agentPrincipalId: receipt.agentPrincipalId,
              toolContractId: receipt.toolContractId,
              toolContractVersion: receipt.toolContractVersion,
              actionGrantJti: receipt.actionGrantJti,
              descriptorDigest: receipt.descriptorDigest,
              idempotencyKey: receipt.idempotencyKey,
              authorizationDecisionReference: receipt.authorizationDecisionReference
            }
          : undefined
      ),
      ...(receipt
        ? {
            receipt: {
              ...receipt,
              tenantId,
              operatorAccountId,
              taskId: task.id,
              resultReference: task.id
            }
          }
        : {}),
      ...(isSelfTodo ? {} : { publicEvent: this.publicEvent('TaskAssigned', task, input, now) })
    })
  }

  /** updateTask changes creator-owned active task basics without mutating status or assignee. */
  async updateTask(input: UpdateTaskInput): Promise<TaskEntity> {
    this.assertHumanOnly(input)
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
    return this.saveAuditAndCommit(task, input, 'TASK_UPDATED', previousStatus)
  }

  /** startTask starts a task by assignee and emits TaskStarted after persistence. */
  async startTask(input: TaskIdCommandInput): Promise<TaskEntity> {
    this.assertHumanOnly(input)
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.start(input.operatorAccountId, input.now ?? new Date())
    return this.saveAuditAndCommit(task, input, 'TASK_STARTED', previousStatus)
  }

  /** completeTask completes a task by creator or assignee and records the optional note snapshot. */
  async completeTask(input: CompleteTaskInput): Promise<TaskEntity> {
    this.assertHumanOnly(input)
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.complete(input.operatorAccountId, input.completionNote ?? null, input.now ?? new Date())
    return this.saveAuditAndCommit(
      task,
      input,
      'TASK_COMPLETED',
      previousStatus,
      input.completionNote
    )
  }

  /** cancelTask cancels an active task by creator and records the optional reason snapshot. */
  async cancelTask(input: CancelTaskInput): Promise<TaskEntity> {
    this.assertHumanOnly(input)
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.cancel(input.operatorAccountId, input.cancelReason ?? null, input.now ?? new Date())
    return this.saveAuditAndCommit(
      task,
      input,
      'TASK_CANCELLED',
      previousStatus,
      input.cancelReason
    )
  }

  /** reopenTask reopens a terminal unarchived task under the frozen P1 participant rules. */
  async reopenTask(input: ReopenTaskInput): Promise<TaskEntity> {
    this.assertHumanOnly(input)
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.reopen(input.operatorAccountId, input.now ?? new Date())
    return this.saveAuditAndCommit(task, input, 'TASK_REOPENED', previousStatus, input.reopenReason)
  }

  /** archiveTask archives terminal tasks by creator only. */
  async archiveTask(input: TaskIdCommandInput): Promise<TaskEntity> {
    this.assertHumanOnly(input)
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.archive(input.operatorAccountId, input.now ?? new Date())
    return this.saveAuditAndCommit(task, input, 'TASK_ARCHIVED', previousStatus)
  }

  /** unarchiveTask removes archive markers by creator only. */
  async unarchiveTask(input: TaskIdCommandInput): Promise<TaskEntity> {
    this.assertHumanOnly(input)
    const task = await this.loadTask(input)
    const previousStatus = task.status
    task.unarchive(input.operatorAccountId, input.now ?? new Date())
    return this.saveAuditAndCommit(task, input, 'TASK_UNARCHIVED', previousStatus)
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

  /** saveAuditAndCommit persists one mutation and its required local audit, adding only frozen public facts. */
  private async saveAuditAndCommit(
    task: TaskEntity,
    input: TaskIdCommandInput,
    auditAction: TaskAuditAction,
    previousStatus: TaskStatus,
    reasonSnapshot?: string | null
  ): Promise<TaskEntity> {
    const occurredAt = input.now ?? new Date()
    const eventType =
      task.status !== previousStatus
        ? task.status === TaskStatus.COMPLETED
          ? 'TaskCompleted'
          : task.status === TaskStatus.CANCELLED
            ? 'TaskCancelled'
            : undefined
        : undefined
    return this.transaction.commit({
      operation: 'UPDATE',
      task,
      audit: this.auditInput(auditAction, task, input, reasonSnapshot),
      ...(eventType
        ? { publicEvent: this.publicEvent(eventType, task, input, occurredAt, previousStatus) }
        : {})
    })
  }

  /** auditInput maps a Task command to its local immutable audit envelope before the transaction starts. */
  private auditInput(
    action: TaskAuditAction,
    task: TaskEntity,
    input: CreateTaskInput | TaskIdCommandInput,
    reasonSnapshot?: string | null,
    payload?: Record<string, unknown>
  ): Parameters<TaskAuditPort['record']>[0] {
    return {
      tenantId: task.tenantId,
      taskId: task.id,
      action,
      result: 'SUCCEEDED',
      operatorAccountId: input.operatorAccountId,
      createdByAccountId: task.createdByAccountId,
      assigneeAccountId: task.assigneeAccountId,
      traceId: input.traceId,
      auditId: input.auditId,
      reasonSnapshot: normalizeText(reasonSnapshot) ?? undefined,
      ...(payload ? { payload } : {})
    }
  }

  /** Rejects every delegated Task P1 mutation outside the two frozen CreateTask variants. */
  private assertHumanOnly(input: TaskIdCommandInput): void {
    if (input.delegatedExecution) throw new Error('ACTION_GRANT_FORBIDDEN_OPERATION')
  }

  /** Resolves the required delegated policy without falling back to legacy or body-based authority. */
  private requireDelegatedPolicy(): TaskDelegatedExecutionPolicyPort {
    if (!this.delegatedExecutionPolicy) throw new Error('DELEGATION_AUTHENTICATION_REQUIRED')
    return this.delegatedExecutionPolicy
  }

  /** publicEvent creates only one of the three frozen public Collaboration Task facts before transaction commit. */
  private publicEvent(
    eventType: 'TaskAssigned' | 'TaskCompleted' | 'TaskCancelled',
    task: TaskEntity,
    input: CreateTaskInput | TaskIdCommandInput,
    occurredAt: Date,
    previousStatus?: TaskStatus
  ): OesCloudEvent {
    const contract = contractForTaskFact(eventType)
    const data = {
      taskId: task.id,
      createdByAccountId: task.createdByAccountId,
      assigneeAccountId: task.assigneeAccountId,
      status: task.status,
      ...(eventType === 'TaskAssigned' ? {} : { previousStatus }),
      priority: task.priority,
      ...(task.dueAt ? { dueAt: task.dueAt.toISOString() } : {}),
      titleSnapshot: task.title,
      ...(eventType === 'TaskCompleted'
        ? {
            completedByAccountId: task.completedByAccountId,
            completedAt: task.completedAt?.toISOString()
          }
        : {}),
      ...(eventType === 'TaskCancelled'
        ? {
            cancelledByAccountId: task.cancelledByAccountId,
            cancelledAt: task.cancelledAt?.toISOString(),
            cancelReasonSnapshot: task.cancelReason
          }
        : {})
    }
    return createOesCloudEvent({
      contract: contract as OesEventContract<typeof data>,
      eventId: randomUUID(),
      occurredAt: occurredAt.toISOString(),
      tenantId: task.tenantId,
      aggregateType: 'TASK',
      aggregateId: task.id,
      actorAccountId: input.operatorAccountId,
      traceId: requireText(input.traceId, 'traceId'),
      auditRef: input.auditId,
      data
    })
  }
}

/** contractForTaskFact maps only owner-approved public Task facts to their shared code descriptors. */
function contractForTaskFact(
  eventType: 'TaskAssigned' | 'TaskCompleted' | 'TaskCancelled'
): OesEventContract {
  if (eventType === 'TaskAssigned') return COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT
  if (eventType === 'TaskCompleted') return COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT
  return COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT
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
