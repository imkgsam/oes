import {
  NatsConsumerDlqBinding,
  NatsDurablePullRunner,
  NatsJetStreamClient,
  NatsJetStreamRuntimeConfig,
  NatsMaxDeliveryRecovery,
  NatsSafeRedeliveryRunner
} from '../index'
import { createDlqRecord } from '../operations/dlq'
import { createOesCloudEvent, encodeCloudEvent } from '../cloud-events/codec'

/** Verifies that the runtime accepts only explicit environment-supplied broker credentials. */
describe('NatsJetStreamRuntimeConfig', () => {
  it('creates an ACL-scoped client configuration from explicit runtime environment values', () => {
    expect(
      NatsJetStreamRuntimeConfig.fromEnvironment({
        NATS_URL: 'nats://127.0.0.1:4222',
        NATS_USER: 'notification-consumer',
        NATS_PASSWORD: 'runtime-secret',
        NATS_CLIENT_NAME: 'notification-service'
      })
    ).toEqual({
      servers: ['nats://127.0.0.1:4222'],
      user: 'notification-consumer',
      password: 'runtime-secret',
      name: 'notification-service'
    })
  })

  it('waits for JetStream acknowledgement and drains the injected connection during shutdown', async () => {
    const calls: string[] = []
    const client = new NatsJetStreamClient(
      { servers: ['nats://127.0.0.1:4222'], user: 'publisher', password: 'runtime-secret' },
      {
        connect: async () => ({
          publish: async (request) => {
            calls.push(
              `${request.subject}:${request.headers.find(([key]) => key === 'Nats-Msg-Id')?.[1]}`
            )
            return { stream: 'OES_BUSINESS_EVENTS', sequence: 7, duplicate: false }
          },
          next: async () => null,
          drain: async () => {
            calls.push('drain')
          }
        })
      }
    )

    await client.onModuleInit()
    await expect(
      client.publish({
        subject: 'oes.events.example.fact',
        headers: [['Nats-Msg-Id', 'evt-1']],
        body: Buffer.from('{}')
      })
    ).resolves.toEqual({ stream: 'OES_BUSINESS_EVENTS', sequence: 7, duplicate: false })
    await client.onModuleDestroy()
    expect(calls).toEqual(['oes.events.example.fact:evt-1', 'drain'])
  })

  it('passes durable delivery metadata and exact ACK controls through a pre-provisioned pull consumer', async () => {
    const calls: string[] = []
    const client = new NatsJetStreamClient(
      { servers: ['nats://127.0.0.1:4222'], user: 'consumer', password: 'runtime-secret' },
      {
        connect: async () => ({
          publish: async () => ({ stream: 'OES_BUSINESS_EVENTS', sequence: 1, duplicate: false }),
          next: async () => ({
            subject: 'oes.events.example.fact',
            headers: [],
            body: Buffer.from('{}'),
            deliveryAttempt: 3,
            metadata: {
              stream: 'OES_BUSINESS_EVENTS',
              consumer: 'example-service__facts__v1',
              streamSequence: 9,
              consumerSequence: 4,
              pending: 2,
              redelivered: true
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
          }),
          drain: async () => undefined
        })
      }
    )
    await client.onModuleInit()

    const handled = await new NatsDurablePullRunner(client).runOnce({
      stream: 'OES_BUSINESS_EVENTS',
      consumer: 'example-service__facts__v1',
      expiresMs: 250,
      handle: async (delivery) => {
        expect(delivery.metadata).toMatchObject({
          streamSequence: 9,
          consumerSequence: 4,
          redelivered: true
        })
        await delivery.nak(5_000)
      }
    })

    expect(handled).toBe(true)
    expect(calls).toEqual(['nak:5000'])
  })

  it('publishes the consumer-specific DLQ record before terminating its original delivery', async () => {
    const calls: string[] = []
    const client = new NatsJetStreamClient(
      { servers: ['nats://127.0.0.1:4222'], user: 'consumer', password: 'runtime-secret' },
      {
        connect: async () => ({
          publish: async (request) => {
            calls.push(`publish:${request.subject}`)
            return { stream: 'OES_EVENT_DLQ', sequence: 2, duplicate: false }
          },
          next: async () => null,
          drain: async () => undefined
        })
      }
    )
    await client.onModuleInit()
    const event = createOesCloudEvent({
      contract: {
        eventType: 'example.fact',
        eventVersion: 1,
        ownerService: 'example-service',
        validateData: (value: unknown): value is { value: string } =>
          typeof value === 'object' &&
          value !== null &&
          typeof (value as { value?: unknown }).value === 'string'
      },
      eventId: 'evt-dlq',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'EXAMPLE',
      aggregateId: 'aggregate-1',
      traceId: 'trace-1',
      data: { value: 'frozen' }
    })
    const encoded = encodeCloudEvent(event)
    const record = createDlqRecord({
      consumerName: 'example-service__facts__v1',
      event,
      original: {
        subject: 'oes.events.example.fact',
        headers: encoded.headers,
        body: encoded.body
      },
      errorClass: 'NON_RETRYABLE',
      stableErrorCode: 'EVENT_VERSION_UNSUPPORTED',
      sanitizedErrorSummary: 'unsupported version',
      deliveryAttempts: 5,
      firstFailedAt: '2026-07-26T08:01:00.000Z',
      lastFailedAt: '2026-07-26T08:02:00.000Z',
      streamSequence: 9,
      consumerSequence: 4
    })

    await expect(
      new NatsConsumerDlqBinding(client).transfer(record, {
        term: async () => {
          calls.push('term')
        }
      })
    ).resolves.toEqual({ kind: 'TERMINATED' })
    expect(calls).toEqual(['publish:oes.dlq.example-service.facts.v1', 'term'])
  })

  it('creates or resumes a run-scoped safe-redelivery consumer, decodes before tenant filtering, and preserves durable progress', async () => {
    const calls: string[] = []
    const contract = {
      eventType: 'collaboration.task.assigned',
      eventVersion: 1,
      ownerService: 'collaboration-service',
      validateData: (value: unknown): value is { value: string } =>
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { value?: unknown }).value === 'string'
    }
    const event = createOesCloudEvent({
      contract,
      eventId: 'evt-replay',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'other-tenant',
      aggregateType: 'EXAMPLE',
      aggregateId: 'aggregate-1',
      traceId: 'trace-1',
      data: { value: 'frozen' }
    })
    const encoded = encodeCloudEvent(event)
    const client = new NatsJetStreamClient(
      { servers: ['nats://127.0.0.1:4222'], user: 'consumer', password: 'runtime-secret' },
      {
        connect: async () => ({
          publish: async () => ({ stream: 'OES_BUSINESS_EVENTS', sequence: 1, duplicate: false }),
          createOrResumeConsumer: async (input) => {
            calls.push(
              `consumer:${input.durableName}:${input.filterSubjects.join(',')}:${input.start.sequence}`
            )
          },
          next: async () => ({
            subject: 'oes.events.collaboration.task.assigned',
            headers: encoded.headers,
            body: encoded.body,
            deliveryAttempt: 1,
            metadata: {
              stream: 'OES_BUSINESS_EVENTS',
              consumer: 'notification-service__replay__run-1__assigned',
              streamSequence: 9,
              consumerSequence: 1,
              pending: 0,
              redelivered: false
            },
            ack: async () => {
              calls.push('ack')
            },
            nak: async () => undefined,
            term: async () => undefined
          }),
          drain: async () => undefined
        })
      }
    )
    await client.onModuleInit()

    const outcome = await new NatsSafeRedeliveryRunner(client).runOnce({
      stream: 'OES_BUSINESS_EVENTS',
      expiresMs: 250,
      approvedSubjects: [
        'oes.events.collaboration.task.assigned',
        'oes.events.collaboration.task.completed',
        'oes.events.collaboration.task.cancelled'
      ],
      contracts: [
        contract,
        { ...contract, eventType: 'collaboration.task.completed' },
        { ...contract, eventType: 'collaboration.task.cancelled' }
      ],
      request: {
        replayRunId: 'run-1',
        requestedBy: 'operator-1',
        approvedByConsumerOwner: 'owner-1',
        approvedByPlatformOperator: 'platform-1',
        platformApprovalRef: 'approval-1',
        consumerName: 'notification-service__collaboration-task__v1',
        tenantScope: ['tenant-1'],
        eventFilter: {
          eventTypes: [
            'collaboration.task.assigned',
            'collaboration.task.completed',
            'collaboration.task.cancelled'
          ],
          fromSequence: 7
        },
        mode: 'SAFE_REDELIVERY',
        reason: 'repair',
        allowExternalSideEffects: false
      },
      handle: async () => {
        throw new Error('tenant filtering must happen before the handler')
      }
    })

    expect(outcome).toEqual({ kind: 'SKIPPED' })
    expect(calls).toEqual([
      'consumer:notification-service__replay__run-1__assigned:oes.events.collaboration.task.assigned:7',
      'consumer:notification-service__replay__run-1__completed:oes.events.collaboration.task.completed:7',
      'consumer:notification-service__replay__run-1__cancelled:oes.events.collaboration.task.cancelled:7',
      'ack'
    ])
  })

  it('deletes exactly the three completed run-scoped replay consumers', async () => {
    const deleted: string[] = []
    const existing = new Set([
      'notification-service__replay__run-delete-1__assigned',
      'notification-service__replay__run-delete-1__completed',
      'notification-service__replay__run-delete-1__cancelled'
    ])
    const client = new NatsJetStreamClient(
      {
        servers: ['nats://127.0.0.1:4222'],
        user: 'replay-consumer',
        password: 'runtime-secret'
      },
      {
        connect: async () => ({
          publish: async () => ({
            stream: 'OES_BUSINESS_EVENTS',
            sequence: 1,
            duplicate: false
          }),
          next: async () => null,
          deleteConsumer: async (stream, consumer) => {
            deleted.push(`${stream}:${consumer}`)
            return existing.delete(consumer)
          },
          drain: async () => undefined
        })
      }
    )
    await client.onModuleInit()

    const runner = new NatsSafeRedeliveryRunner(client)
    const cleanup = {
      stream: 'OES_BUSINESS_EVENTS',
      request: {
        replayRunId: 'run-delete-1',
        requestedBy: 'operator-1',
        approvedByConsumerOwner: 'owner-1',
        approvedByPlatformOperator: 'platform-1',
        platformApprovalRef: 'approval-1',
        consumerName: 'notification-service__collaboration-task__v1',
        tenantScope: ['tenant-1'],
        eventFilter: {
          eventTypes: [
            'collaboration.task.assigned',
            'collaboration.task.completed',
            'collaboration.task.cancelled'
          ],
          fromSequence: 1
        },
        mode: 'SAFE_REDELIVERY' as const,
        reason: 'completed bounded replay',
        allowExternalSideEffects: false as const
      }
    }
    const expectedConsumers = [
      'notification-service__replay__run-delete-1__assigned',
      'notification-service__replay__run-delete-1__completed',
      'notification-service__replay__run-delete-1__cancelled'
    ]

    await expect(runner.deleteConsumers(cleanup)).resolves.toEqual(expectedConsumers)
    await expect(runner.deleteConsumers(cleanup)).resolves.toEqual(expectedConsumers)
    existing.add('notification-service__replay__run-delete-1__completed')
    existing.add('notification-service__replay__run-delete-1__cancelled')
    await expect(runner.deleteConsumers(cleanup)).resolves.toEqual(expectedConsumers)

    expect(deleted).toEqual(
      Array.from({ length: 3 }, () => [
        'OES_BUSINESS_EVENTS:notification-service__replay__run-delete-1__assigned',
        'OES_BUSINESS_EVENTS:notification-service__replay__run-delete-1__completed',
        'OES_BUSINESS_EVENTS:notification-service__replay__run-delete-1__cancelled'
      ]).flat()
    )
  })

  it('propagates a replay consumer deletion provider failure instead of treating it as absence', async () => {
    const client = new NatsJetStreamClient(
      {
        servers: ['nats://127.0.0.1:4222'],
        user: 'replay-consumer',
        password: 'runtime-secret'
      },
      {
        connect: async () => ({
          publish: async () => ({
            stream: 'OES_BUSINESS_EVENTS',
            sequence: 1,
            duplicate: false
          }),
          next: async () => null,
          deleteConsumer: async () => {
            throw new Error('permissions violation')
          },
          drain: async () => undefined
        })
      }
    )
    await client.onModuleInit()

    await expect(
      new NatsSafeRedeliveryRunner(client).deleteConsumers({
        stream: 'OES_BUSINESS_EVENTS',
        request: {
          replayRunId: 'run-delete-failed',
          requestedBy: 'operator-1',
          approvedByConsumerOwner: 'owner-1',
          approvedByPlatformOperator: 'platform-1',
          platformApprovalRef: 'approval-1',
          consumerName: 'notification-service__collaboration-task__v1',
          tenantScope: ['tenant-1'],
          eventFilter: {
            eventTypes: [
              'collaboration.task.assigned',
              'collaboration.task.completed',
              'collaboration.task.cancelled'
            ],
            fromSequence: 1
          },
          mode: 'SAFE_REDELIVERY',
          reason: 'completed bounded replay',
          allowExternalSideEffects: false
        }
      })
    ).rejects.toThrow('permissions violation')
  })

  it('fails closed for a max-delivery advisory because an advisory has no source delivery TERM token', async () => {
    const calls: string[] = []
    const contract = {
      eventType: 'example.fact',
      eventVersion: 1,
      ownerService: 'example-service',
      validateData: (value: unknown): value is { value: string } =>
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { value?: unknown }).value === 'string'
    }
    const event = createOesCloudEvent({
      contract,
      eventId: 'evt-recovery',
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId: 'tenant-1',
      aggregateType: 'EXAMPLE',
      aggregateId: 'aggregate-1',
      traceId: 'trace-1',
      data: { value: 'frozen' }
    })
    const encoded = encodeCloudEvent(event)
    const client = new NatsJetStreamClient(
      { servers: ['nats://127.0.0.1:4222'], user: 'consumer', password: 'runtime-secret' },
      {
        connect: async () => ({
          publish: async () => ({ stream: 'OES_BUSINESS_EVENTS', sequence: 1, duplicate: false }),
          createOrResumeConsumer: async () => undefined,
          next: async () => null,
          drain: async () => undefined
        })
      }
    )
    await client.onModuleInit()

    await expect(
      new NatsMaxDeliveryRecovery(client).recover({
        advisory: {
          stream: 'OES_BUSINESS_EVENTS',
          consumer: 'example-service__facts__v1',
          stream_seq: 9,
          consumer_seq: 4,
          deliveries: 5
        },
        target: { consumerName: 'example-service__facts__v1' }
      })
    ).resolves.toEqual({
      kind: 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED',
      advisory: {
        stream: 'OES_BUSINESS_EVENTS',
        consumer: 'example-service__facts__v1',
        streamSequence: 9,
        consumerSequence: 4,
        deliveries: 5
      }
    })

    expect(calls).toEqual([])
  })

  it('rejects a replay stream or approved-subject allowlist outside the frozen SAFE_REDELIVERY boundary', async () => {
    const client = new NatsJetStreamClient(
      { servers: ['nats://127.0.0.1:4222'], user: 'consumer', password: 'runtime-secret' },
      {
        connect: async () => ({
          publish: async () => ({ stream: 'OES_BUSINESS_EVENTS', sequence: 1, duplicate: false }),
          next: async () => null,
          drain: async () => undefined
        })
      }
    )
    await client.onModuleInit()
    const contract = {
      eventType: 'example.fact',
      eventVersion: 1,
      ownerService: 'example-service',
      validateData: (value: unknown): value is { value: string } =>
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { value?: unknown }).value === 'string'
    }
    const request = {
      replayRunId: 'run-1',
      requestedBy: 'operator-1',
      approvedByConsumerOwner: 'owner-1',
      approvedByPlatformOperator: 'platform-1',
      platformApprovalRef: 'approval-1',
      consumerName: 'example-service__facts__v1',
      tenantScope: ['tenant-1'],
      eventFilter: { eventTypes: ['example.fact'], fromSequence: 7 },
      mode: 'SAFE_REDELIVERY' as const,
      reason: 'repair',
      allowExternalSideEffects: false as const
    }

    await expect(
      new NatsSafeRedeliveryRunner(client).runOnce({
        stream: 'OES_EVENT_REPLAY',
        expiresMs: 250,
        approvedSubjects: ['oes.events.example.fact'],
        contracts: [contract],
        request,
        handle: async () => ({ kind: 'APPLIED' })
      })
    ).rejects.toThrow('NATS_SAFE_REDELIVERY_STREAM_INVALID')

    await expect(
      new NatsSafeRedeliveryRunner(client).runOnce({
        stream: 'OES_BUSINESS_EVENTS',
        expiresMs: 250,
        approvedSubjects: ['oes.events.>'],
        contracts: [contract],
        request,
        handle: async () => ({ kind: 'APPLIED' })
      })
    ).rejects.toThrow('NATS_REPLAY_APPROVED_SUBJECTS_INVALID')

    await expect(
      new NatsSafeRedeliveryRunner(client).runOnce({
        stream: 'OES_BUSINESS_EVENTS',
        expiresMs: 250,
        approvedSubjects: [
          'oes.events.collaboration.task.assigned',
          'oes.events.collaboration.task.completed',
          'oes.events.collaboration.task.cancelled',
          'oes.events.asset.site-media.available'
        ],
        contracts: [contract],
        request: {
          ...request,
          consumerName: 'notification-service__collaboration-task__v1',
          eventFilter: {
            eventTypes: [
              'collaboration.task.assigned',
              'collaboration.task.completed',
              'collaboration.task.cancelled'
            ],
            fromSequence: 7
          }
        },
        handle: async () => ({ kind: 'APPLIED' })
      })
    ).rejects.toThrow('NATS_REPLAY_APPROVED_SUBJECTS_NOT_EXACT')
  })
})
