import { randomUUID } from 'node:crypto'
import { Test, type TestingModule } from '@nestjs/testing'
import { LoggingModule } from '@oes/common/logging'
import {
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  NatsConsumerDlqBinding,
  NatsDurablePullRunner,
  NatsJetStreamClient,
  NatsJetStreamPublisher,
  createOesCloudEvent,
  encodeCloudEvent
} from '@oes/common'
import { CollaborationTaskNotificationHandler } from '../../src/application/events/collaboration-task-notification.handler'
import { CollaborationTaskEventConsumer } from '../../src/infrastructure/events/collaboration-task-event.consumer'
import { NotificationEventDlqTransfer } from '../../src/infrastructure/events/notification-event-dlq.transfer'
import { PrismaNotificationInboxRepository } from '../../src/infrastructure/inbox/prisma-notification-inbox.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

const describeLive = process.env.NOTIFICATION_EVENT_LIVE_TEST === 'true' ? describe : describe.skip

/** Proves the existing ACL-backed durable applies one real Collaboration event to the Notification Inbox. */
describeLive('Notification Collaboration Task durable Integration live', () => {
  const tenantId = `ev5_live_${randomUUID()}`
  let prisma: PrismaService
  let publisherClient: NatsJetStreamClient
  let notificationClient: NatsJetStreamClient

  beforeAll(async () => {
    prisma = new PrismaService()
    await prisma.$connect()
    publisherClient = new NatsJetStreamClient(
      runtimeOptions('NATS_COLLABORATION_USER', 'NATS_COLLABORATION_PASSWORD')
    )
    notificationClient = new NatsJetStreamClient(
      runtimeOptions('NATS_NOTIFICATION_USER', 'NATS_NOTIFICATION_PASSWORD')
    )
    await publisherClient.onModuleInit()
    await notificationClient.onModuleInit()
  })

  afterAll(async () => {
    await publisherClient?.onModuleDestroy()
    await notificationClient?.onModuleDestroy()
    if (!prisma) return
    await prisma.notificationInboxItem.deleteMany({ where: { tenantId } })
    await prisma.notificationInboxEvent.deleteMany({ where: { tenantId } })
    await prisma.$disconnect()
  })

  it('pulls the exact durable under Notification ACL and atomically ACKs one assigned Task result', async () => {
    const taskId = `task-${randomUUID()}`
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId: `evt-${randomUUID()}`,
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId,
      aggregateType: 'TASK',
      aggregateId: taskId,
      actorAccountId: 'assigner-1',
      traceId: `trace-${randomUUID()}`,
      data: {
        taskId,
        createdByAccountId: 'assigner-1',
        assigneeAccountId: 'assignee-1',
        status: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'ACL-backed live delivery'
      }
    })
    const publisher = new NatsJetStreamPublisher(publisherClient)
    const repository = new PrismaNotificationInboxRepository(prisma)
    const handler = new CollaborationTaskNotificationHandler(repository)
    const consumer = new CollaborationTaskEventConsumer(
      handler,
      new NotificationEventDlqTransfer(new NatsConsumerDlqBinding(notificationClient))
    )

    await expect(
      publisher.publish(event, COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT)
    ).resolves.toMatchObject({ kind: 'ACKNOWLEDGED' })
    let handled = false
    for (let attempt = 0; attempt < 5; attempt += 1) {
      handled = await new NatsDurablePullRunner(notificationClient).runOnce({
        stream: 'OES_BUSINESS_EVENTS',
        consumer: 'notification-service__collaboration-task__v1',
        expiresMs: 2_000,
        handle: async (delivery) => {
          await consumer.handleDelivery(delivery)
        }
      })
      if (await prisma.notificationInboxEvent.count({ where: { tenantId, eventId: event.id } }))
        break
      if (!handled) break
    }

    expect(handled).toBe(true)
    await expect(
      prisma.notificationInboxEvent.findUnique({
        where: {
          consumerName_eventId: {
            consumerName: 'notification-service__collaboration-task__v1',
            eventId: event.id
          }
        }
      })
    ).resolves.toMatchObject({ tenantId, result: 'APPLIED' })
    await expect(
      prisma.notificationInboxItem.findMany({ where: { tenantId, sourceEventId: event.id } })
    ).resolves.toEqual([
      expect.objectContaining({ recipientAccountId: 'assignee-1', channel: 'IN_APP' })
    ])
  })

  it('publishes an invalid owner envelope to the consumer-specific DLQ before TERM without creating an Inbox result', async () => {
    const taskId = `task-${randomUUID()}`
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId: `evt-invalid-${randomUUID()}`,
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId,
      aggregateType: 'TASK',
      aggregateId: taskId,
      actorAccountId: 'assigner-1',
      traceId: `trace-${randomUUID()}`,
      data: {
        taskId,
        createdByAccountId: 'assigner-1',
        assigneeAccountId: 'assignee-1',
        status: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Invalid owner must DLQ'
      }
    })
    const encoded = encodeCloudEvent({ ...event, source: 'urn:oes:service:untrusted-service' })
    const repository = new PrismaNotificationInboxRepository(prisma)
    const consumer = new CollaborationTaskEventConsumer(
      new CollaborationTaskNotificationHandler(repository),
      new NotificationEventDlqTransfer(new NatsConsumerDlqBinding(notificationClient))
    )
    let outcome: unknown

    await expect(
      publisherClient.publish({
        subject: 'oes.events.collaboration.task.assigned',
        headers: encoded.headers,
        body: encoded.body
      })
    ).resolves.toMatchObject({ stream: 'OES_BUSINESS_EVENTS' })
    await expect(
      new NatsDurablePullRunner(notificationClient).runOnce({
        stream: 'OES_BUSINESS_EVENTS',
        consumer: 'notification-service__collaboration-task__v1',
        expiresMs: 2_000,
        handle: async (delivery) => {
          outcome = await consumer.handleDelivery(delivery)
        }
      })
    ).resolves.toBe(true)

    expect(outcome).toEqual({ kind: 'NON_RETRYABLE_FAILURE', code: 'EVENT_OWNER_MISMATCH' })
    await expect(
      prisma.notificationInboxEvent.findUnique({
        where: {
          consumerName_eventId: {
            consumerName: 'notification-service__collaboration-task__v1',
            eventId: event.id
          }
        }
      })
    ).resolves.toBeNull()
  })

  it('starts the shared runtime through Notification DI and applies a durable delivery without manual consumer construction', async () => {
    const taskId = `task-${randomUUID()}`
    const event = createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId: `evt-di-${randomUUID()}`,
      occurredAt: '2026-07-26T08:00:00.000Z',
      tenantId,
      aggregateType: 'TASK',
      aggregateId: taskId,
      actorAccountId: 'assigner-1',
      traceId: `trace-${randomUUID()}`,
      data: {
        taskId,
        createdByAccountId: 'assigner-1',
        assigneeAccountId: 'assignee-1',
        status: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'DI runtime delivery'
      }
    })
    let module: TestingModule | undefined
    try {
      const { NotificationModule } =
        require('../../src/modules/notification/notification.module') as typeof import('../../src/modules/notification/notification.module')
      module = await Test.createTestingModule({
        imports: [
          LoggingModule.forRoot({ serviceName: 'notification-service' }),
          NotificationModule
        ]
      }).compile()
      await module.init()
      await expect(
        new NatsJetStreamPublisher(publisherClient).publish(
          event,
          COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT
        )
      ).resolves.toMatchObject({ kind: 'ACKNOWLEDGED' })

      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (await prisma.notificationInboxEvent.count({ where: { tenantId, eventId: event.id } }))
          break
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      await expect(
        prisma.notificationInboxItem.findMany({ where: { tenantId, sourceEventId: event.id } })
      ).resolves.toEqual([
        expect.objectContaining({ recipientAccountId: 'assignee-1', channel: 'IN_APP' })
      ])
    } finally {
      await module?.close()
    }
  })

  /** Reads the local-only environment contract without embedding credentials in a test artifact. */
  function runtimeOptions(userKey: string, passwordKey: string) {
    const user = process.env[userKey]
    const password = process.env[passwordKey]
    if (!user || !password || !process.env.NATS_URL)
      throw new Error('NOTIFICATION_EVENT_LIVE_TEST_NATS_CREDENTIALS_REQUIRED')
    return {
      servers: process.env.NATS_URL.split(','),
      user,
      password,
      name: 'notification-service-live-test'
    }
  }
})
