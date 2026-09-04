import { TaskInvalidArgumentError, TaskPermissionDeniedError } from '../common/errors/task.errors'
import { TaskEntity, TaskListFilter } from '../domain/entities/task.entity'
import { TaskRepository } from '../domain/repositories/task.repository'
import { TaskListScope, TaskPriority, TaskStatus, TaskVisibility } from '../domain/value-objects/task.enums'
import { TaskQueryService } from '../application/services/task-query.service'

const TENANT_ID = 'tenant-1'
const OPERATOR = 'account-operator'
const OTHER = 'account-other'

describe('TaskQueryService', () => {
  let repository: CapturingTaskRepository
  let service: TaskQueryService

  beforeEach(() => {
    repository = new CapturingTaskRepository()
    service = new TaskQueryService(repository)
  })

  it('applies MY_TODO scope and defaults to active unarchived tasks', async () => {
    repository.items = [buildTask({ dueAt: new Date('2026-06-13T10:00:00.000Z') })]

    const result = await service.listTasks({
      tenantId: TENANT_ID,
      operatorAccountId: OPERATOR,
      scope: TaskListScope.MY_TODO,
      now: new Date('2026-06-14T10:00:00.000Z')
    })

    expect(repository.lastFilter).toEqual(expect.objectContaining({
      tenantId: TENANT_ID,
      operatorAccountId: OPERATOR,
      scope: TaskListScope.MY_TODO,
      statuses: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS],
      includeArchived: false,
      archivedOnly: false,
      page: 1,
      pageSize: 20
    }))
    expect(result.items[0].overdue).toBe(true)
  })

  it('rejects invalid pagination and unknown scopes before repository access', async () => {
    await expect(
      service.listTasks({
        tenantId: TENANT_ID,
        operatorAccountId: OPERATOR,
        scope: 'EVERYTHING' as TaskListScope,
        page: 0
      })
    ).rejects.toThrow(TaskInvalidArgumentError)
    expect(repository.lastFilter).toBeUndefined()
  })

  it('allows only participants to read task details', async () => {
    repository.items = [buildTask({ id: 'task-visible' })]

    await expect(
      service.getTask({
        tenantId: TENANT_ID,
        taskId: 'task-visible',
        operatorAccountId: OTHER,
        now: new Date('2026-06-14T10:00:00.000Z')
      })
    ).rejects.toThrow(TaskPermissionDeniedError)

    const result = await service.getTask({
      tenantId: TENANT_ID,
      taskId: 'task-visible',
      operatorAccountId: OPERATOR,
      now: new Date('2026-06-14T10:00:00.000Z')
    })

    expect(result.task.id).toBe('task-visible')
    expect(result.overdue).toBe(false)
  })
})

class CapturingTaskRepository implements TaskRepository {
  items: TaskEntity[] = []
  lastFilter?: TaskListFilter

  async create(): Promise<never> {
    throw new Error('not needed in query tests')
  }

  async save(): Promise<never> {
    throw new Error('not needed in query tests')
  }

  async findById(tenantId: string, taskId: string): Promise<TaskEntity | null> {
    return this.items.find((item) => item.tenantId === tenantId && item.id === taskId) ?? null
  }

  async list(filter: TaskListFilter) {
    this.lastFilter = filter
    return {
      items: this.items,
      page: filter.page,
      pageSize: filter.pageSize,
      total: this.items.length
    }
  }
}

/** buildTask creates a valid TaskEntity fixture for query service tests. */
function buildTask(overrides: Partial<ConstructorParameters<typeof TaskEntity>[0]> = {}) {
  return new TaskEntity({
    id: 'task-1',
    tenantId: TENANT_ID,
    title: 'Check production order',
    description: null,
    createdByAccountId: OPERATOR,
    assigneeAccountId: OPERATOR,
    visibility: TaskVisibility.PRIVATE,
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
