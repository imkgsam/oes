import {
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
  createOesCloudEvent,
  createInboxIdentity,
  encodeCloudEvent
} from '@oes/common'
import { CollaborationTaskNotificationHandler } from '../../src/application/events/collaboration-task-notification.handler'

/** Exercises the frozen assigned-task notification mapping before infrastructure persistence is introduced. */
describe('CollaborationTaskNotificationHandler L1', () => {
  it('creates one in-app assignee item from an assigned fact without consulting Task state', async () => {
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId: 'evt-assigned-1',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      orgId: 'org-1',
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
        dueAt: '2026-07-30T08:00:00.000Z',
        titleSnapshot: 'Review purchase order'
      }
    })
    const encoded = encodeCloudEvent(event)
    const writes: unknown[] = []
    const handler = new CollaborationTaskNotificationHandler({
      apply: async (input: unknown) => {
        writes.push(input)
        return { kind: 'APPLIED' }
      }
    })

    await expect(
      handler.handle(
        event,
        createInboxIdentity('notification-service__collaboration-task__v1', event, encoded.body)
      )
    ).resolves.toEqual({ kind: 'APPLIED' })
    expect(writes).toEqual([
      expect.objectContaining({
        event,
        items: [
          expect.objectContaining({
            tenantId: 'tenant-1',
            orgId: 'org-1',
            recipientAccountId: 'assignee-1',
            notificationType: 'COLLABORATION_TASK_ASSIGNED',
            channel: 'IN_APP',
            sourceEventId: 'evt-assigned-1',
            sourceObjectRef: 'collaboration-service:TASK:task-1',
            deepLinkRef: 'COLLABORATION_TASK_DETAIL(task-1)',
            titleSnapshot: 'Review purchase order',
            templateKey: 'notification.collaboration-task.assigned',
            templateVersion: 1,
            locale: 'en-US',
            traceId: 'trace-1'
          })
        ]
      })
    ])
  })

  it('records NO_RECIPIENT without creating an item when the actor is the sole deduplicated cancellation recipient', async () => {
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
      eventId: 'evt-cancelled-self-1',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'TASK',
      aggregateId: 'task-1',
      actorAccountId: 'account-1',
      traceId: 'trace-1',
      data: {
        taskId: 'task-1',
        createdByAccountId: 'account-1',
        assigneeAccountId: 'account-1',
        status: 'CANCELLED',
        previousStatus: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Review purchase order',
        cancelledByAccountId: 'account-1',
        cancelledAt: '2026-07-26T08:00:00.000Z'
      }
    })
    const encoded = encodeCloudEvent(event)
    const writes: any[] = []
    const handler = new CollaborationTaskNotificationHandler({
      apply: async (input: any) => {
        writes.push(input)
        return { kind: 'APPLIED' }
      }
    })

    await handler.handle(
      event,
      createInboxIdentity('notification-service__collaboration-task__v1', event, encoded.body)
    )
    expect(writes[0].items).toEqual([])
  })
})
