import { TaskEntity } from '../../src/domain/entities/task.entity'
import { TaskRepository } from '../../src/domain/repositories/task.repository'
import { TaskPriority, TaskStatus, TaskVisibility } from '../../src/domain/value-objects/task.enums'
import { TaskCommandTransactionPort } from '../../src/application/ports/task-command-transaction.port'
import { TaskCommandService } from '../../src/application/services/task-command.service'

/** Verifies that public Task facts are frozen before the single local command transaction is committed. */
describe('TaskCommandService outbox boundary', () => {
  it('commits an assigned Task, its audit, and exactly one immutable assigned fact together', async () => {
    const transaction = new RecordingTaskTransaction()
    const service = createService(transaction)

    const task = await service.createTask({
      tenantId: 'tenant-1',
      operatorAccountId: 'account-creator',
      assigneeAccountId: 'account-assignee',
      traceId: 'trace-1',
      auditId: 'audit-1',
      title: 'Review supplier quote',
      priority: TaskPriority.HIGH,
      now: new Date('2026-07-26T08:00:00.000Z')
    })

    expect(transaction.commits).toHaveLength(1)
    expect(transaction.commits[0]).toMatchObject({
      task,
      operation: 'CREATE',
      audit: expect.objectContaining({ action: 'TASK_CREATED', taskId: task.id })
    })
    expect(transaction.commits[0].publicEvent).toMatchObject({
      type: 'collaboration.task.assigned',
      source: 'urn:oes:service:collaboration-service',
      subject: task.id,
      oeseventversion: 1,
      oestenantid: 'tenant-1',
      oesaggregatetype: 'TASK',
      oesaggregateid: task.id,
      oestraceid: 'trace-1',
      data: {
        taskId: task.id,
        status: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Review supplier quote'
      }
    })
    expect(Object.isFrozen(transaction.commits[0].publicEvent)).toBe(true)
  })

  it('does not create an assigned public fact for a self todo or for an idempotent completion', async () => {
    const transaction = new RecordingTaskTransaction()
    const repository = new InMemoryTaskRepository()
    const service = createService(transaction, repository)
    await service.createTask({
      tenantId: 'tenant-1',
      operatorAccountId: 'account-creator',
      traceId: 'trace-1',
      title: 'Prepare shift notes',
      now: new Date('2026-07-26T08:00:00.000Z')
    })
    const completed = await repository.create(task({ status: TaskStatus.COMPLETED }))

    await service.completeTask({
      tenantId: 'tenant-1',
      taskId: completed.id,
      operatorAccountId: 'account-creator',
      traceId: 'trace-1',
      now: new Date('2026-07-26T08:01:00.000Z')
    })

    expect(transaction.commits.map((commit) => commit.publicEvent)).toEqual([undefined, undefined])
  })
})

/** Captures the intended one-call transaction boundary for application-level tests. */
class RecordingTaskTransaction implements TaskCommandTransactionPort {
  readonly commits: Parameters<TaskCommandTransactionPort['commit']>[0][] = []

  async commit(input: Parameters<TaskCommandTransactionPort['commit']>[0]): Promise<TaskEntity> {
    this.commits.push(input)
    return new TaskEntity(input.task.snapshot())
  }
}

/** Provides enough local Task state for command orchestration tests. */
class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, TaskEntity>()

  async create(entity: TaskEntity): Promise<TaskEntity> {
    this.tasks.set(entity.id, new TaskEntity(entity.snapshot()))
    return new TaskEntity(entity.snapshot())
  }

  async save(entity: TaskEntity): Promise<TaskEntity> {
    this.tasks.set(entity.id, new TaskEntity(entity.snapshot()))
    return new TaskEntity(entity.snapshot())
  }

  async findById(tenantId: string, taskId: string): Promise<TaskEntity | null> {
    const entity = this.tasks.get(taskId)
    return entity?.tenantId === tenantId ? new TaskEntity(entity.snapshot()) : null
  }

  async list(): Promise<never> {
    throw new Error('not required by command tests')
  }
}

/** Builds the task-command service with authorized dependencies and a recorded transaction boundary. */
function createService(transaction: TaskCommandTransactionPort, repository = new InMemoryTaskRepository()): TaskCommandService {
  return new TaskCommandService(
    repository,
    { isActiveTenantAccount: jest.fn().mockResolvedValue(true) },
    transaction,
    { canAssignTask: jest.fn().mockResolvedValue(true) }
  )
}

/** Creates a valid persisted Task aggregate for idempotency tests. */
function task(overrides: Partial<ConstructorParameters<typeof TaskEntity>[0]> = {}): TaskEntity {
  return new TaskEntity({
    id: 'task-completed-1',
    tenantId: 'tenant-1',
    title: 'Existing task',
    description: null,
    createdByAccountId: 'account-creator',
    assigneeAccountId: 'account-assignee',
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
    createdAt: new Date('2026-07-26T07:00:00.000Z'),
    updatedAt: new Date('2026-07-26T07:00:00.000Z'),
    ...overrides
  })
}
