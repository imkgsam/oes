import { TaskEntity } from '../../src/domain/entities/task.entity'
import { TaskInvalidStateError, TaskPermissionDeniedError } from '../../src/common/errors/task.errors'
import { TaskPriority, TaskStatus, TaskVisibility } from '../../src/domain/value-objects/task.enums'

const TENANT_ID = 'tenant-1'
const CREATOR = 'account-creator'
const ASSIGNEE = 'account-assignee'
const OTHER = 'account-other'

describe('TaskEntity P1 state rules', () => {
  it('allows an assignee to move an open task into progress', () => {
    const task = buildTask({ status: TaskStatus.OPEN })
    const now = new Date('2026-06-14T10:00:00.000Z')

    task.start(ASSIGNEE, now)

    expect(task.status).toBe(TaskStatus.IN_PROGRESS)
    expect(task.startedAt).toEqual(now)
  })

  it('rejects moving an in-progress task back to open through reopen', () => {
    const task = buildTask({ status: TaskStatus.IN_PROGRESS })

    expect(() => task.reopen(ASSIGNEE)).toThrow(TaskInvalidStateError)
  })

  it('allows completed tasks to be reopened by creator or assignee', () => {
    const creatorTask = buildTask({
      status: TaskStatus.COMPLETED,
      completedAt: new Date('2026-06-14T10:00:00.000Z'),
      completedByAccountId: ASSIGNEE,
      completionNote: 'done'
    })
    const assigneeTask = buildTask({
      status: TaskStatus.COMPLETED,
      completedAt: new Date('2026-06-14T10:00:00.000Z'),
      completedByAccountId: CREATOR,
      completionNote: 'done'
    })

    creatorTask.reopen(CREATOR)
    assigneeTask.reopen(ASSIGNEE)

    expect(creatorTask.status).toBe(TaskStatus.OPEN)
    expect(creatorTask.completedAt).toBeNull()
    expect(creatorTask.completedByAccountId).toBeNull()
    expect(creatorTask.completionNote).toBeNull()
    expect(assigneeTask.status).toBe(TaskStatus.OPEN)
  })

  it('allows cancelled tasks to be reopened only by creator', () => {
    const creatorTask = buildTask({
      status: TaskStatus.CANCELLED,
      cancelledAt: new Date('2026-06-14T10:00:00.000Z'),
      cancelledByAccountId: CREATOR,
      cancelReason: 'wrong task'
    })
    const assigneeTask = buildTask({
      status: TaskStatus.CANCELLED,
      cancelledAt: new Date('2026-06-14T10:00:00.000Z'),
      cancelledByAccountId: CREATOR,
      cancelReason: 'wrong task'
    })

    creatorTask.reopen(CREATOR)

    expect(creatorTask.status).toBe(TaskStatus.OPEN)
    expect(creatorTask.cancelledAt).toBeNull()
    expect(() => assigneeTask.reopen(ASSIGNEE)).toThrow(TaskPermissionDeniedError)
  })

  it('rejects archive unless the task is terminal and requested by creator', () => {
    const openTask = buildTask({ status: TaskStatus.OPEN })
    const completedTask = buildTask({ status: TaskStatus.COMPLETED })
    const now = new Date('2026-06-14T11:00:00.000Z')

    expect(() => openTask.archive(CREATOR, now)).toThrow(TaskInvalidStateError)
    expect(() => completedTask.archive(OTHER, now)).toThrow(TaskPermissionDeniedError)

    completedTask.archive(CREATOR, now)

    expect(completedTask.archivedAt).toEqual(now)
    expect(completedTask.archivedByAccountId).toBe(CREATOR)
  })
})

/** buildTask creates a valid TaskEntity fixture with focused overrides for state-rule tests. */
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
