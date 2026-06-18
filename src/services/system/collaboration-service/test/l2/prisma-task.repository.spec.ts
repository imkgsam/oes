import { TaskEntity } from '../../src/domain/entities/task.entity'
import { TaskListScope, TaskPriority, TaskStatus, TaskVisibility } from '../../src/domain/value-objects/task.enums'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaTaskRepository } from '../../src/infrastructure/repositories/prisma-task.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

let prefix: string

describe('PrismaTaskRepository L2', () => {
  let prisma: PrismaService
  let repository: PrismaTaskRepository

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaTaskRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('creates self todos and lists them only in MY_TODO scope', async () => {
    const created = await repository.create(
      buildTask({
        createdByAccountId: `${prefix}_operator`,
        assigneeAccountId: `${prefix}_operator`,
        visibility: TaskVisibility.PRIVATE
      })
    )

    const result = await repository.list({
      tenantId: `${prefix}_tenant`,
      operatorAccountId: `${prefix}_operator`,
      scope: TaskListScope.MY_TODO,
      page: 1,
      pageSize: 20,
      now: new Date('2026-06-14T10:00:00.000Z')
    })

    expect(result.total).toBe(1)
    expect(result.items[0]?.id).toBe(created.id)
    expect(result.items[0]?.visibility).toBe(TaskVisibility.PRIVATE)

    const createdByMe = await repository.list({
      tenantId: `${prefix}_tenant`,
      operatorAccountId: `${prefix}_operator`,
      scope: TaskListScope.CREATED_BY_ME,
      page: 1,
      pageSize: 20,
      now: new Date('2026-06-14T10:00:00.000Z')
    })

    expect(createdByMe.total).toBe(0)
  })

  it('saves lifecycle and archive fields without changing tenant ownership', async () => {
    const task = await repository.create(
      buildTask({
        createdByAccountId: `${prefix}_creator`,
        assigneeAccountId: `${prefix}_assignee`,
        visibility: TaskVisibility.ASSIGNMENT_PARTICIPANTS
      })
    )

    task.start(`${prefix}_assignee`, new Date('2026-06-14T10:30:00.000Z'))
    task.complete(`${prefix}_creator`, 'accepted', new Date('2026-06-14T11:00:00.000Z'))
    task.archive(`${prefix}_creator`, new Date('2026-06-14T11:30:00.000Z'))
    const saved = await repository.save(task)
    const loaded = await repository.findById(`${prefix}_tenant`, saved.id)

    expect(loaded?.tenantId).toBe(`${prefix}_tenant`)
    expect(loaded?.status).toBe(TaskStatus.COMPLETED)
    expect(loaded?.completedByAccountId).toBe(`${prefix}_creator`)
    expect(loaded?.archivedByAccountId).toBe(`${prefix}_creator`)
  })

  it('applies assigned-to-me scope, overdue, and archive filters in the database query', async () => {
    await repository.create(
      buildTask({
        id: '20000000-0000-4000-8000-000000000001',
        createdByAccountId: `${prefix}_creator`,
        assigneeAccountId: `${prefix}_assignee`,
        visibility: TaskVisibility.ASSIGNMENT_PARTICIPANTS,
        dueAt: new Date('2026-06-13T10:00:00.000Z')
      })
    )
    await repository.create(
      buildTask({
        id: '20000000-0000-4000-8000-000000000002',
        title: `${prefix}_archived`,
        createdByAccountId: `${prefix}_creator`,
        assigneeAccountId: `${prefix}_assignee`,
        visibility: TaskVisibility.ASSIGNMENT_PARTICIPANTS,
        status: TaskStatus.COMPLETED,
        archivedAt: new Date('2026-06-14T10:00:00.000Z'),
        archivedByAccountId: `${prefix}_creator`
      })
    )

    const overdue = await repository.list({
      tenantId: `${prefix}_tenant`,
      operatorAccountId: `${prefix}_assignee`,
      scope: TaskListScope.ASSIGNED_TO_ME,
      overdueOnly: true,
      page: 1,
      pageSize: 20,
      now: new Date('2026-06-14T10:00:00.000Z')
    })
    const archived = await repository.list({
      tenantId: `${prefix}_tenant`,
      operatorAccountId: `${prefix}_assignee`,
      scope: TaskListScope.ASSIGNED_TO_ME,
      archivedOnly: true,
      page: 1,
      pageSize: 20,
      now: new Date('2026-06-14T10:00:00.000Z')
    })

    expect(overdue.items).toHaveLength(1)
    expect(overdue.items[0]?.title).toBe(`${prefix}_task`)
    expect(archived.items).toHaveLength(1)
    expect(archived.items[0]?.title).toBe(`${prefix}_archived`)
  })

  it('lists only tasks the operator assigned to other accounts in CREATED_BY_ME scope', async () => {
    await repository.create(
      buildTask({
        id: '20000000-0000-4000-8000-000000000011',
        title: `${prefix}_assigned_out`,
        createdByAccountId: `${prefix}_operator`,
        assigneeAccountId: `${prefix}_assignee`,
        visibility: TaskVisibility.ASSIGNMENT_PARTICIPANTS
      })
    )
    await repository.create(
      buildTask({
        id: '20000000-0000-4000-8000-000000000012',
        title: `${prefix}_self_todo`,
        createdByAccountId: `${prefix}_operator`,
        assigneeAccountId: `${prefix}_operator`,
        visibility: TaskVisibility.PRIVATE
      })
    )

    const result = await repository.list({
      tenantId: `${prefix}_tenant`,
      operatorAccountId: `${prefix}_operator`,
      scope: TaskListScope.CREATED_BY_ME,
      page: 1,
      pageSize: 20,
      now: new Date('2026-06-14T10:00:00.000Z')
    })

    expect(result.items.map((task) => task.title)).toEqual([
      `${prefix}_assigned_out`
    ])
  })
})

/** buildTask creates one valid aggregate for Prisma repository integration tests. */
function buildTask(overrides: Partial<ConstructorParameters<typeof TaskEntity>[0]> = {}) {
  return new TaskEntity({
    id: '20000000-0000-4000-8000-000000000000',
    tenantId: `${prefix}_tenant`,
    title: `${prefix}_task`,
    description: null,
    createdByAccountId: `${prefix}_creator`,
    assigneeAccountId: `${prefix}_assignee`,
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
