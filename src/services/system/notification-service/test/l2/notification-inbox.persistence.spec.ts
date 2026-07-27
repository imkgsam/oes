import { randomUUID } from 'node:crypto'
import {
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  createInboxIdentity,
  createOesCloudEvent,
  encodeCloudEvent
} from '@oes/common'
import { CollaborationTaskNotificationHandler } from '../../src/application/events/collaboration-task-notification.handler'
import { PrismaNotificationInboxRepository } from '../../src/infrastructure/inbox/prisma-notification-inbox.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

/** Exercises durable Inbox idempotency against the Notification database instead of an in-memory transaction double. */
describe('Notification Inbox persistence L2', () => {
  const tenantId = `ev5_l2_${randomUUID()}`
  let prisma: PrismaService

  beforeAll(async () => {
    prisma = new PrismaService()
    await prisma.$connect()
  })

  afterAll(async () => {
    if (!prisma) return
    await prisma.notificationInboxItem.deleteMany({ where: { tenantId } })
    await prisma.notificationInboxEvent.deleteMany({ where: { tenantId } })
    await prisma.$disconnect()
  })

  it('preserves one local result across a restarted handler and rejects conflicting event-ID reuse', async () => {
    const eventId = `evt-${randomUUID()}`
    const firstEvent = taskEvent(eventId, 'Original title')
    const firstEncoded = encodeCloudEvent(firstEvent)
    const firstHandler = new CollaborationTaskNotificationHandler(
      new PrismaNotificationInboxRepository(prisma)
    )

    await expect(
      firstHandler.handle(
        firstEvent,
        createInboxIdentity(
          'notification-service__collaboration-task__v1',
          firstEvent,
          firstEncoded.body
        )
      )
    ).resolves.toEqual({ kind: 'APPLIED' })

    const restartedHandler = new CollaborationTaskNotificationHandler(
      new PrismaNotificationInboxRepository(prisma)
    )
    await expect(
      restartedHandler.handle(
        firstEvent,
        createInboxIdentity(
          'notification-service__collaboration-task__v1',
          firstEvent,
          firstEncoded.body
        )
      )
    ).resolves.toEqual({ kind: 'DUPLICATE' })

    const conflictingEvent = taskEvent(eventId, 'Conflicting title')
    const conflictingEncoded = encodeCloudEvent(conflictingEvent)
    await expect(
      restartedHandler.handle(
        conflictingEvent,
        createInboxIdentity(
          'notification-service__collaboration-task__v1',
          conflictingEvent,
          conflictingEncoded.body
        )
      )
    ).resolves.toEqual({ kind: 'EVENT_ID_CONFLICT', code: 'EVENT_ID_CONFLICT' })

    await expect(prisma.notificationInboxEvent.count({ where: { tenantId } })).resolves.toBe(1)
    await expect(prisma.notificationInboxItem.count({ where: { tenantId } })).resolves.toBe(1)
  })

  /** Creates a frozen assigned event whose body can vary while retaining the same intentional event identity. */
  function taskEvent(eventId: string, titleSnapshot: string) {
    return createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId,
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId,
      aggregateType: 'TASK',
      aggregateId: 'task-1',
      actorAccountId: 'assigner-1',
      traceId: 'trace-1',
      data: {
        taskId: 'task-1',
        createdByAccountId: 'assigner-1',
        assigneeAccountId: 'assignee-1',
        status: 'OPEN',
        priority: 'HIGH',
        titleSnapshot
      }
    })
  }
})
