import { createOesCloudEvent, encodeCloudEvent } from '@oes/common'
import { COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT } from '@oes/common/contracts'
import { CollaborationTaskOutboxRelay } from '../infrastructure/events/collaboration-task-outbox.relay'

/** Exercises the Collaboration-owned relay boundary without a broker or another service database. */
describe('CollaborationTaskOutboxRelay', () => {
  it('marks a claimed outbox row published only after the common adapter acknowledges it', async () => {
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId: 'event-1',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'TASK',
      aggregateId: 'task-1',
      actorAccountId: 'account-creator',
      traceId: 'trace-1',
      data: {
        taskId: 'task-1',
        createdByAccountId: 'account-creator',
        assigneeAccountId: 'account-assignee',
        status: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Review quote'
      }
    })
    const store = new InMemoryOutboxStore(event)
    const publisher = {
      publishStored: jest.fn().mockResolvedValue({
        kind: 'ACKNOWLEDGED',
        stream: 'OES_BUSINESS_EVENTS',
        sequence: 1,
        duplicate: false
      })
    }
    const relay = new CollaborationTaskOutboxRelay(store, publisher)

    await relay.relayOnce(new Date('2026-07-26T08:00:01.000Z'))

    expect(publisher.publishStored).toHaveBeenCalledWith(
      encodeCloudEvent(event).body,
      COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT
    )
    expect(store.published).toEqual([
      {
        eventId: 'event-1',
        leaseToken: 'lease-1',
        publishedAt: new Date('2026-07-26T08:00:01.000Z')
      }
    ])
    expect(store.retried).toEqual([])
    expect(store.quarantined).toEqual([])
  })

  it('keeps retryable publication failures pending with bounded retry evidence', async () => {
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId: 'event-2',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'TASK',
      aggregateId: 'task-2',
      actorAccountId: 'account-creator',
      traceId: 'trace-1',
      data: {
        taskId: 'task-2',
        createdByAccountId: 'account-creator',
        assigneeAccountId: 'account-assignee',
        status: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Review quote'
      }
    })
    const store = new InMemoryOutboxStore(event)
    const publisher = {
      publishStored: jest.fn().mockResolvedValue({
        kind: 'RETRYABLE_FAILURE',
        code: 'TIMEOUT',
        message: 'broker timeout'
      })
    }
    const relay = new CollaborationTaskOutboxRelay(store, publisher)

    await relay.relayOnce(new Date('2026-07-26T08:00:01.000Z'))

    expect(store.published).toEqual([])
    expect(store.retried).toEqual([
      {
        eventId: 'event-2',
        leaseToken: 'lease-1',
        code: 'TIMEOUT',
        message: 'broker timeout',
        nextAttemptAt: new Date('2026-07-26T08:00:02.000Z')
      }
    ])
    expect(store.quarantined).toEqual([])
  })
})

/** Provides a deterministic service-owned outbox test double with no cross-service state. */
class InMemoryOutboxStore {
  readonly published: Array<{ eventId: string; leaseToken: string; publishedAt: Date }> = []
  readonly retried: Array<{
    eventId: string
    leaseToken: string
    code: string
    message: string
    nextAttemptAt: Date
  }> = []
  readonly quarantined: Array<{
    eventId: string
    leaseToken: string
    code: string
    message: string
    quarantinedAt: Date
  }> = []

  constructor(private readonly event: ReturnType<typeof createOesCloudEvent>) {}

  async claimPending() {
    return [
      {
        eventId: this.event.id,
        eventType: this.event.type,
        eventVersion: this.event.oeseventversion,
        cloudEventBody: encodeCloudEvent(this.event).body,
        attemptCount: 0,
        leaseToken: 'lease-1'
      }
    ]
  }

  async markPublished(input: {
    eventId: string
    leaseToken: string
    publishedAt: Date
  }): Promise<void> {
    this.published.push(input)
  }

  async scheduleRetry(input: {
    eventId: string
    leaseToken: string
    code: string
    message: string
    nextAttemptAt: Date
  }): Promise<void> {
    this.retried.push(input)
  }

  async quarantine(input: {
    eventId: string
    leaseToken: string
    code: string
    message: string
    quarantinedAt: Date
  }): Promise<void> {
    this.quarantined.push(input)
  }
}
