import {
  COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
  createOesCloudEvent,
  encodeCloudEvent,
  type NatsPullDelivery
} from '@oes/common'
import { CollaborationTaskEventConsumer } from '../../src/infrastructure/events/collaboration-task-event.consumer'
import { NotificationEventDlqTransfer } from '../../src/infrastructure/events/notification-event-dlq.transfer'

/** Exercises the durable-delivery boundary independently from a concrete NATS client. */
describe('CollaborationTaskEventConsumer L1', () => {
  it('ACKs a valid cancelled delivery after the typed handler applies its Notification transaction', async () => {
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
      eventId: 'evt-consumer-1',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'TASK',
      aggregateId: 'task-1',
      actorAccountId: 'canceller-1',
      traceId: 'trace-1',
      data: {
        taskId: 'task-1',
        createdByAccountId: 'assigner-1',
        assigneeAccountId: 'assignee-1',
        status: 'CANCELLED',
        previousStatus: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Review purchase order',
        cancelledByAccountId: 'canceller-1',
        cancelledAt: '2026-07-26T08:00:00.000Z'
      }
    })
    const encoded = encodeCloudEvent(event)
    const calls: string[] = []
    const delivery: NatsPullDelivery = {
      subject: 'oes.events.collaboration.task.cancelled',
      headers: encoded.headers,
      body: encoded.body,
      deliveryAttempt: 1,
      metadata: {
        stream: 'OES_BUSINESS_EVENTS',
        consumer: 'notification-service__collaboration-task__v1',
        streamSequence: 1,
        consumerSequence: 1,
        pending: 0,
        redelivered: false
      },
      ack: async () => {
        calls.push('ack')
      },
      nak: async () => {
        calls.push('nak')
      },
      term: async () => {
        calls.push('term')
      }
    }
    const handler = { handle: async () => ({ kind: 'APPLIED' as const }) }
    const dlq = {
      transfer: async () => {
        calls.push('dlq')
        return { kind: 'TERMINATED' as const }
      }
    }
    const consumer = new CollaborationTaskEventConsumer(handler as any, dlq)

    await expect(consumer.handleDelivery(delivery)).resolves.toEqual({ kind: 'APPLIED' })
    expect(calls).toEqual(['ack'])
  })

  it('transfers a mismatched owner delivery to the consumer DLQ without invoking the handler', async () => {
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
      eventId: 'evt-consumer-invalid-owner',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'TASK',
      aggregateId: 'task-1',
      actorAccountId: 'canceller-1',
      traceId: 'trace-1',
      data: {
        taskId: 'task-1',
        createdByAccountId: 'assigner-1',
        assigneeAccountId: 'assignee-1',
        status: 'CANCELLED',
        previousStatus: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Review purchase order',
        cancelledByAccountId: 'canceller-1',
        cancelledAt: '2026-07-26T08:00:00.000Z'
      }
    })
    const encoded = encodeCloudEvent({ ...event, source: 'urn:oes:service:untrusted-service' })
    const calls: string[] = []
    const delivery: NatsPullDelivery = {
      subject: 'oes.events.collaboration.task.cancelled',
      headers: encoded.headers,
      body: encoded.body,
      deliveryAttempt: 1,
      metadata: {
        stream: 'OES_BUSINESS_EVENTS',
        consumer: 'notification-service__collaboration-task__v1',
        streamSequence: 2,
        consumerSequence: 2,
        pending: 0,
        redelivered: false
      },
      ack: async () => {
        calls.push('ack')
      },
      nak: async () => {
        calls.push('nak')
      },
      term: async () => {
        calls.push('term')
      }
    }
    const handler = {
      handle: async () => {
        calls.push('handle')
        return { kind: 'APPLIED' as const }
      }
    }
    const dlq = {
      transfer: async () => {
        calls.push('dlq')
        return { kind: 'TERMINATED' as const }
      }
    }

    await expect(
      new CollaborationTaskEventConsumer(handler as any, dlq).handleDelivery(delivery)
    ).resolves.toEqual({ kind: 'NON_RETRYABLE_FAILURE', code: 'EVENT_OWNER_MISMATCH' })
    expect(calls).toEqual(['dlq'])
  })

  it('NAKs a parseable permanent failure when the DLQ publication is not acknowledged', async () => {
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
      eventId: 'evt-consumer-dlq-retry',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'TASK',
      aggregateId: 'task-1',
      actorAccountId: 'canceller-1',
      traceId: 'trace-1',
      data: {
        taskId: 'task-1',
        createdByAccountId: 'assigner-1',
        assigneeAccountId: 'assignee-1',
        status: 'CANCELLED',
        previousStatus: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Review purchase order',
        cancelledByAccountId: 'canceller-1',
        cancelledAt: '2026-07-26T08:00:00.000Z'
      }
    })
    const encoded = encodeCloudEvent({ ...event, source: 'urn:oes:service:untrusted-service' })
    const calls: string[] = []
    const delivery = testDelivery(encoded.body, encoded.headers, calls)
    const dlq = {
      transfer: async () => {
        calls.push('dlq')
        return { kind: 'DLQ_RETRY_REQUIRED' as const }
      }
    }

    await expect(
      new CollaborationTaskEventConsumer({ handle: jest.fn() } as any, dlq).handleDelivery(delivery)
    ).resolves.toEqual({
      kind: 'RETRYABLE_FAILURE',
      code: 'NOTIFICATION_DLQ_TRANSFER_FAILED',
      delayMs: 1_000
    })
    expect(calls).toEqual(['dlq', 'nak:1000'])
  })

  it('keeps malformed no-id input fail-closed and observable without fabricating a DLQ event identity', async () => {
    const calls: string[] = []
    const delivery = testDelivery(
      Buffer.from('{"specversion":"1.0",', 'utf8'),
      [['Content-Type', 'application/cloudevents+json']],
      calls
    )
    const binding = {
      transfer: async () => {
        calls.push('fabricated-dlq')
        return { kind: 'TERMINATED' as const }
      }
    }
    const dlq = new NotificationEventDlqTransfer(binding as any)

    await expect(
      new CollaborationTaskEventConsumer({ handle: jest.fn() } as any, dlq).handleDelivery(delivery)
    ).resolves.toEqual({
      kind: 'RETRYABLE_FAILURE',
      code: 'NOTIFICATION_DLQ_TRANSFER_FAILED',
      delayMs: 1_000
    })
    expect(calls).toEqual(['nak:1000'])
  })

  it('schedules the frozen first retry delay when the local Inbox transaction temporarily fails', async () => {
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
      eventId: 'evt-consumer-retry',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'TASK',
      aggregateId: 'task-1',
      actorAccountId: 'canceller-1',
      traceId: 'trace-1',
      data: {
        taskId: 'task-1',
        createdByAccountId: 'assigner-1',
        assigneeAccountId: 'assignee-1',
        status: 'CANCELLED',
        previousStatus: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Review purchase order',
        cancelledByAccountId: 'canceller-1',
        cancelledAt: '2026-07-26T08:00:00.000Z'
      }
    })
    const encoded = encodeCloudEvent(event)
    const calls: string[] = []
    const delivery: NatsPullDelivery = {
      subject: 'oes.events.collaboration.task.cancelled',
      headers: encoded.headers,
      body: encoded.body,
      deliveryAttempt: 1,
      metadata: {
        stream: 'OES_BUSINESS_EVENTS',
        consumer: 'notification-service__collaboration-task__v1',
        streamSequence: 3,
        consumerSequence: 3,
        pending: 0,
        redelivered: false
      },
      ack: async () => {
        calls.push('ack')
      },
      nak: async (delay) => {
        calls.push(`nak:${delay}`)
      },
      term: async () => {
        calls.push('term')
      }
    }
    const handler = {
      handle: async () => {
        throw new Error('database unavailable')
      }
    }
    const dlq = {
      transfer: async () => {
        calls.push('dlq')
        return { kind: 'TERMINATED' as const }
      }
    }

    await expect(
      new CollaborationTaskEventConsumer(handler as any, dlq).handleDelivery(delivery as any)
    ).resolves.toEqual({
      kind: 'RETRYABLE_FAILURE',
      code: 'NOTIFICATION_INBOX_WRITE_FAILED',
      delayMs: 1_000
    })
    expect(calls).toEqual(['nak:1000'])
  })

  it('transfers a validated fifth-attempt failure to DLQ before source termination', async () => {
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
      eventId: 'evt-consumer-retry-exhausted',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'TASK',
      aggregateId: 'task-1',
      actorAccountId: 'canceller-1',
      traceId: 'trace-1',
      data: {
        taskId: 'task-1',
        createdByAccountId: 'assigner-1',
        assigneeAccountId: 'assignee-1',
        status: 'CANCELLED',
        previousStatus: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Review purchase order',
        cancelledByAccountId: 'canceller-1',
        cancelledAt: '2026-07-26T08:00:00.000Z'
      }
    })
    const encoded = encodeCloudEvent(event)
    const calls: string[] = []
    const delivery: NatsPullDelivery = {
      subject: 'oes.events.collaboration.task.cancelled',
      headers: encoded.headers,
      body: encoded.body,
      deliveryAttempt: 5,
      metadata: {
        stream: 'OES_BUSINESS_EVENTS',
        consumer: 'notification-service__collaboration-task__v1',
        streamSequence: 4,
        consumerSequence: 4,
        pending: 0,
        redelivered: true
      },
      ack: async () => {
        calls.push('ack')
      },
      nak: async () => {
        calls.push('nak')
      },
      term: async () => {
        calls.push('term')
      }
    }
    const handler = {
      handle: async () => {
        throw new Error('database unavailable')
      }
    }
    const dlq = {
      transfer: async (input: { code: string }) => {
        calls.push(`dlq:${input.code}`)
        await delivery.term()
        return { kind: 'TERMINATED' as const }
      }
    }

    await expect(
      new CollaborationTaskEventConsumer(handler as any, dlq).handleDelivery(delivery)
    ).resolves.toEqual({
      kind: 'NON_RETRYABLE_FAILURE',
      code: 'NOTIFICATION_RETRY_EXHAUSTED'
    })
    expect(calls).toEqual(['dlq:NOTIFICATION_RETRY_EXHAUSTED', 'term'])
  })
})

/** Creates one bounded delivery fixture whose settlement calls remain literal test evidence. */
function testDelivery(
  body: Uint8Array,
  headers: readonly (readonly [string, string])[],
  calls: string[]
): NatsPullDelivery {
  return {
    subject: 'oes.events.collaboration.task.cancelled',
    headers,
    body,
    deliveryAttempt: 1,
    metadata: {
      stream: 'OES_BUSINESS_EVENTS',
      consumer: 'notification-service__collaboration-task__v1',
      streamSequence: 20,
      consumerSequence: 20,
      pending: 0,
      redelivered: false
    },
    ack: async () => {
      calls.push('ack')
    },
    nak: async (delay) => {
      calls.push(`nak:${delay}`)
    },
    term: async () => {
      calls.push('term')
    }
  }
}
