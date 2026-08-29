import { TaskPriority } from '../../src/domain/value-objects/task.enums'
import { PrismaTaskCommandTransaction } from '../../src/infrastructure/prisma/prisma-task-command-transaction.repository'
import { PrismaTaskRepository } from '../../src/infrastructure/repositories/prisma-task.repository'
import { TaskCommandService } from '../../src/application/services/task-command.service'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { decodeCloudEvent } from '@oes/common'
import { COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT } from '@oes/common/contracts'

describe('TaskCommandService side effects L2', () => {
  let prisma: PrismaService
  let service: TaskCommandService
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    service = new TaskCommandService(
      new PrismaTaskRepository(prisma),
      { isActiveTenantAccount: jest.fn().mockResolvedValue(true) },
      new PrismaTaskCommandTransaction(prisma),
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

  it('persists the assigned Task, audit, and immutable public outbox body in one local command transaction', async () => {
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
    const outbox = await prisma.collaborationTaskOutbox.findMany({
      where: { aggregateId: task.id },
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
    expect(outbox).toHaveLength(1)
    expect(outbox[0]).toMatchObject({
      eventType: 'collaboration.task.assigned',
      eventVersion: 1,
      ownerService: 'collaboration-service',
      tenantId: `${prefix}_tenant`,
      aggregateType: 'TASK',
      aggregateId: task.id,
      status: 'PENDING',
      attemptCount: 0,
      publishedAt: null
    })
    expect(
      decodeCloudEvent(
        new Uint8Array(outbox[0].cloudEventBody),
        COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT
      )
    ).toMatchObject({
      id: outbox[0].eventId,
      type: 'collaboration.task.assigned',
      subject: task.id,
      oestenantid: `${prefix}_tenant`,
      data: {
        taskId: task.id,
        dueAt: '2026-06-15T10:00:00.000Z'
      }
    })
    expect(Buffer.from(outbox[0].cloudEventBody).toString('utf8')).toContain(
      `"oesauditref":"${prefix}_audit"`
    )
  })
})
