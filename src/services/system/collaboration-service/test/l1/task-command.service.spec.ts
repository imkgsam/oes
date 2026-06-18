import { TaskAssigneeNotActiveError, TaskInvalidStateError, TaskPermissionDeniedError } from '../../src/common/errors/task.errors'
import { TaskEntity } from '../../src/domain/entities/task.entity'
import { TaskRepository } from '../../src/domain/repositories/task.repository'
import { TaskPriority, TaskStatus, TaskVisibility } from '../../src/domain/value-objects/task.enums'
import { AccountReferencePort } from '../../src/application/ports/account-reference.port'
import { TaskAuditPort } from '../../src/application/ports/task-audit.port'
import { TaskEventPublisherPort } from '../../src/application/ports/task-event-publisher.port'
import { TaskPermissionPort } from '../../src/application/ports/task-permission.port'
import { TaskCommandService } from '../../src/application/services/task-command.service'

const TENANT_ID = 'tenant-1'
const CREATOR = 'account-creator'
const ASSIGNEE = 'account-assignee'
const OTHER = 'account-other'
const TRACE_ID = 'trace-1'
const AUDIT_ID = 'audit-1'

describe('TaskCommandService', () => {
  let repository: InMemoryTaskRepository
  let accountReference: jest.Mocked<AccountReferencePort>
  let audit: jest.Mocked<TaskAuditPort>
  let events: jest.Mocked<TaskEventPublisherPort>
  let permissions: jest.Mocked<TaskPermissionPort>
  let service: TaskCommandService

  beforeEach(() => {
    repository = new InMemoryTaskRepository()
    accountReference = {
      isActiveTenantAccount: jest.fn().mockResolvedValue(true)
    }
    audit = {
      record: jest.fn().mockResolvedValue(undefined)
    }
    events = {
      publish: jest.fn().mockResolvedValue(undefined)
    }
    permissions = {
      canAssignTask: jest.fn().mockResolvedValue(false)
    }
    service = new TaskCommandService(repository, accountReference, audit, events, permissions)
  })

  it('creates a private self todo without assign permission', async () => {
    const task = await service.createTask({
      tenantId: TENANT_ID,
      operatorAccountId: CREATOR,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      title: 'Prepare shift notes',
      description: 'handoff',
      now: new Date('2026-06-14T10:00:00.000Z')
    })

    expect(task.createdByAccountId).toBe(CREATOR)
    expect(task.assigneeAccountId).toBe(CREATOR)
    expect(task.visibility).toBe(TaskVisibility.PRIVATE)
    expect(task.status).toBe(TaskStatus.OPEN)
    expect(permissions.canAssignTask).not.toHaveBeenCalled()
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'TASK_CREATED', result: 'SUCCEEDED' }))
    expect(events.publish).toHaveBeenCalledTimes(1)
    expect(events.publish).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'TaskCreated' }))
  })

  it('requires assign permission and active target account for assigned task', async () => {
    await expect(
      service.createTask({
        tenantId: TENANT_ID,
        operatorAccountId: CREATOR,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        title: 'Review quote',
        assigneeAccountId: ASSIGNEE
      })
    ).rejects.toThrow(TaskPermissionDeniedError)

    permissions.canAssignTask.mockResolvedValue(true)
    accountReference.isActiveTenantAccount.mockResolvedValue(false)

    await expect(
      service.createTask({
        tenantId: TENANT_ID,
        operatorAccountId: CREATOR,
        traceId: TRACE_ID,
        auditId: AUDIT_ID,
        title: 'Review quote',
        assigneeAccountId: ASSIGNEE
      })
    ).rejects.toThrow(TaskAssigneeNotActiveError)
  })

  it('creates assigned tasks with participant visibility and assignment event', async () => {
    permissions.canAssignTask.mockResolvedValue(true)

    const task = await service.createTask({
      tenantId: TENANT_ID,
      operatorAccountId: CREATOR,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      title: 'Review supplier onboarding',
      assigneeAccountId: ASSIGNEE,
      priority: TaskPriority.HIGH,
      dueAt: new Date('2026-06-15T10:00:00.000Z'),
      now: new Date('2026-06-14T10:00:00.000Z')
    })

    expect(task.assigneeAccountId).toBe(ASSIGNEE)
    expect(task.visibility).toBe(TaskVisibility.ASSIGNMENT_PARTICIPANTS)
    expect(task.priority).toBe(TaskPriority.HIGH)
    expect(accountReference.isActiveTenantAccount).toHaveBeenCalledWith({ tenantId: TENANT_ID, accountId: ASSIGNEE })
    expect(events.publish).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'TaskCreated' }))
    expect(events.publish).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'TaskAssigned' }))
  })

  it('enforces participant rules for start complete cancel and archive', async () => {
    const task = await repository.create(buildTask({ status: TaskStatus.OPEN }))

    await expect(
      service.startTask({
        tenantId: TENANT_ID,
        taskId: task.id,
        operatorAccountId: CREATOR,
        traceId: TRACE_ID,
        auditId: AUDIT_ID
      })
    ).rejects.toThrow(TaskPermissionDeniedError)

    await service.startTask({
      tenantId: TENANT_ID,
      taskId: task.id,
      operatorAccountId: ASSIGNEE,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      now: new Date('2026-06-14T11:00:00.000Z')
    })
    await service.completeTask({
      tenantId: TENANT_ID,
      taskId: task.id,
      operatorAccountId: CREATOR,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      completionNote: 'accepted',
      now: new Date('2026-06-14T12:00:00.000Z')
    })

    await expect(
      service.archiveTask({
        tenantId: TENANT_ID,
        taskId: task.id,
        operatorAccountId: OTHER,
        traceId: TRACE_ID,
        auditId: AUDIT_ID
      })
    ).rejects.toThrow(TaskPermissionDeniedError)

    const archived = await service.archiveTask({
      tenantId: TENANT_ID,
      taskId: task.id,
      operatorAccountId: CREATOR,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      now: new Date('2026-06-14T13:00:00.000Z')
    })

    expect(archived.archivedByAccountId).toBe(CREATOR)
  })

  it('rejects archive before terminal state and allows creator to cancel active tasks', async () => {
    const task = await repository.create(buildTask({ status: TaskStatus.OPEN }))

    await expect(
      service.archiveTask({
        tenantId: TENANT_ID,
        taskId: task.id,
        operatorAccountId: CREATOR,
        traceId: TRACE_ID,
        auditId: AUDIT_ID
      })
    ).rejects.toThrow(TaskInvalidStateError)

    const cancelled = await service.cancelTask({
      tenantId: TENANT_ID,
      taskId: task.id,
      operatorAccountId: CREATOR,
      traceId: TRACE_ID,
      auditId: AUDIT_ID,
      cancelReason: 'duplicate',
      now: new Date('2026-06-14T12:00:00.000Z')
    })

    expect(cancelled.status).toBe(TaskStatus.CANCELLED)
    expect(cancelled.cancelReason).toBe('duplicate')
  })
})

class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, TaskEntity>()

  async create(task: TaskEntity): Promise<TaskEntity> {
    this.tasks.set(task.id, new TaskEntity(task.snapshot()))
    return new TaskEntity(task.snapshot())
  }

  async save(task: TaskEntity): Promise<TaskEntity> {
    this.tasks.set(task.id, new TaskEntity(task.snapshot()))
    return new TaskEntity(task.snapshot())
  }

  async findById(tenantId: string, taskId: string): Promise<TaskEntity | null> {
    const task = this.tasks.get(taskId)
    return task?.tenantId === tenantId ? new TaskEntity(task.snapshot()) : null
  }

  async list(): Promise<never> {
    throw new Error('not needed in command tests')
  }
}

/** buildTask creates a valid TaskEntity for command service tests. */
function buildTask(overrides: Partial<ConstructorParameters<typeof TaskEntity>[0]> = {}) {
  return new TaskEntity({
    id: 'task-1',
    tenantId: TENANT_ID,
    title: 'Check production order',
    description: null,
    createdByAccountId: CREATOR,
    assigneeAccountId: ASSIGNEE,
    visibility: TaskVisibility.ASSIGNMENT_PARTICIPANTS,
    status: TaskStatus.OPEN,
    priority: TaskPriority.NORMAL,
    dueAt: null,
    startedAt: null,
    completedAt: null,
    completedByAccountId: null,
    completionNote: null,
    cancelledAt: null,
    cancelledByAccountId: null,
    cancelReason: null,
    archivedAt: null,
    archivedByAccountId: null,
    createdAt: new Date('2026-06-14T09:00:00.000Z'),
    updatedAt: new Date('2026-06-14T09:00:00.000Z'),
    ...overrides
  })
}
