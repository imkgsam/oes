import {
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  createInboxIdentity,
  createOesCloudEvent,
  encodeCloudEvent
} from '@oes/common'
import { PrismaNotificationInboxRepository } from '../../src/infrastructure/inbox/prisma-notification-inbox.repository'

/** Verifies the local transaction seam that makes an Inbox identity and its local notification result indivisible. */
describe('PrismaNotificationInboxRepository L2', () => {
  it('persists the Inbox event and in-app item in one transaction', async () => {
    const operations: string[] = []
    const prisma = {
      $transaction: async (callback: (tx: any) => Promise<unknown>) =>
        callback({
          notificationInboxEvent: {
            createMany: async (input: unknown) => {
              operations.push('event.createMany')
              return { count: 1, input }
            },
            findUnique: async () => null
          },
          notificationInboxItem: {
            createMany: async (input: unknown) => {
              operations.push('item.createMany')
              return input
            }
          }
        })
    }
    const repository = new PrismaNotificationInboxRepository(prisma as any)
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId: 'evt-repository-1',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
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
        titleSnapshot: 'Review purchase order'
      }
    })
    const encoded = encodeCloudEvent(event)

    await expect(
      repository.apply({
        event,
        identity: createInboxIdentity(
          'notification-service__collaboration-task__v1',
          event,
          encoded.body
        ),
        items: [
          {
            tenantId: 'tenant-1',
            recipientAccountId: 'assignee-1',
            notificationType: 'COLLABORATION_TASK_ASSIGNED',
            channel: 'IN_APP',
            sourceEventId: event.id,
            sourceObjectRef: 'collaboration-service:TASK:task-1',
            deepLinkRef: 'COLLABORATION_TASK_DETAIL(task-1)',
            titleSnapshot: event.data.titleSnapshot,
            bodySnapshot: 'You were assigned “Review purchase order”.',
            templateKey: 'notification.collaboration-task.assigned',
            templateVersion: 1,
            locale: 'en-US',
            traceId: event.oestraceid
          }
        ]
      })
    ).resolves.toEqual({ kind: 'APPLIED' })

    expect(operations).toEqual(['event.createMany', 'item.createMany'])
  })
})
