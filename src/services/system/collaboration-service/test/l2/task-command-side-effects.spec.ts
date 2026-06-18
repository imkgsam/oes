import { TaskPriority } from '../../src/domain/value-objects/task.enums'
import { LocalTaskAuditRepository } from '../../src/infrastructure/audit/local-task-audit.repository'
import { LocalTaskEventPublisher } from '../../src/infrastructure/events/local-task-event.publisher'
import { PrismaTaskRepository } from '../../src/infrastructure/repositories/prisma-task.repository'
import { TaskCommandService } from '../../src/application/services/task-command.service'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

describe('TaskCommandService side effects L2', () => {
  let prisma: PrismaService
  let service: TaskCommandService
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    service = new TaskCommandService(
      new PrismaTaskRepository(prisma),
      { isActiveTenantAccount: jest.fn().mockResolvedValue(true) },
      new LocalTaskAuditRepository(prisma),
      new LocalTaskEventPublisher(prisma),
      { canAssignTask: jest.fn().mockResolvedValue(true) }
    )
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

  it('persists audit and frozen task fact envelopes after creating an assigned task', async () => {
    const task = await service.createTask({
      tenantId: `${prefix}_tenant`,
      operatorAccountId: `${prefix}_creator`,
      assigneeAccountId: `${prefix}_assignee`,
      traceId: `${prefix}_trace`,
      auditId: `${prefix}_audit`,
      title: `${prefix}_review supplier quote`,
      priority: TaskPriority.HIGH,
      dueAt: new Date('2026-06-15T10:00:00.000Z'),
      now: new Date('2026-06-14T10:00:00.000Z')
    })

    const audits = await prisma.collaborationTaskAuditEnvelope.findMany({
      where: { taskId: task.id },
      orderBy: { occurredAt: 'asc' }
    })
    const events = await prisma.collaborationTaskEventEnvelope.findMany({
      where: { taskId: task.id },
      orderBy: { occurredAt: 'asc' }
    })

    expect(audits).toHaveLength(1)
    expect(audits[0]).toMatchObject({
      tenantId: `${prefix}_tenant`,
      action: 'TASK_CREATED',
      result: 'SUCCEEDED',
      operatorAccountId: `${prefix}_creator`,
      createdByAccountId: `${prefix}_creator`,
      assigneeAccountId: `${prefix}_assignee`,
      traceId: `${prefix}_trace`,
      auditId: `${prefix}_audit`
    })
    expect(events.map((event) => event.eventType)).toEqual(['TaskCreated', 'TaskAssigned'])
    expect(events[0]).toMatchObject({
      tenantId: `${prefix}_tenant`,
      actorAccountId: `${prefix}_creator`,
      createdByAccountId: `${prefix}_creator`,
      assigneeAccountId: `${prefix}_assignee`,
      status: 'OPEN',
      priority: 'HIGH',
      titleSnapshot: `${prefix}_review supplier quote`,
      traceId: `${prefix}_trace`
    })
    expect(events[0].payload).toMatchObject({
      eventType: 'TaskCreated',
      dueAt: '2026-06-15T10:00:00.000Z'
    })
  })
})
