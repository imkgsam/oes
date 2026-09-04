import { randomUUID } from 'node:crypto'
import {
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  NatsConsumerDlqBinding,
  NatsDurablePullRunner,
  NatsJetStreamClient,
  NatsJetStreamPublisher,
  createOesCloudEvent,
  encodeCloudEvent
} from '@oes/common'
import { TaskCommandService } from '../../src/services/system/collaboration-service/src/application/services/task-command.service'
import { TaskPriority } from '../../src/services/system/collaboration-service/src/domain/value-objects/task.enums'
import { CollaborationTaskOutboxRelay } from '../../src/services/system/collaboration-service/src/infrastructure/events/collaboration-task-outbox.relay'
import { PrismaCollaborationTaskOutboxStore } from '../../src/services/system/collaboration-service/src/infrastructure/events/prisma-collaboration-task-outbox.store'
import { PrismaTaskCommandTransaction } from '../../src/services/system/collaboration-service/src/infrastructure/prisma/prisma-task-command-transaction.repository'
import { PrismaService as CollaborationPrisma } from '../../src/services/system/collaboration-service/src/infrastructure/prisma/prisma.service'
import { PrismaTaskRepository } from '../../src/services/system/collaboration-service/src/infrastructure/repositories/prisma-task.repository'
import { CollaborationTaskNotificationHandler } from '../../src/services/system/notification-service/src/application/events/collaboration-task-notification.handler'
import { CollaborationTaskEventConsumer } from '../../src/services/system/notification-service/src/infrastructure/events/collaboration-task-event.consumer'
import { NotificationEventDlqTransfer } from '../../src/services/system/notification-service/src/infrastructure/events/notification-event-dlq.transfer'
import { PrismaNotificationInboxRepository } from '../../src/services/system/notification-service/src/infrastructure/inbox/prisma-notification-inbox.repository'
import { PrismaService as NotificationPrisma } from '../../src/services/system/notification-service/src/infrastructure/prisma/prisma.service'

/**
 * Prerequisites: task-owned migrated Collaboration/Notification Postgres databases and ACL-backed NATS.
 * Boundaries: Collaboration command/transaction -> outbox relay -> NATS durable -> Notification inbox.
 * Success: an assigned Task is persisted, acknowledged by JetStream, and materialized for its assignee.
 * Critical failure: an envelope with the wrong owner is sent to DLQ and never creates an inbox row.
 * Reproduce: pnpm test:run -- --type journey (or the risk-selected change plan).
 */
describe('Collaboration Task to Notification Journey', () => {
  const prefix = `journey_${randomUUID()}`
  const tenantId = `${prefix}_tenant`
  let collaboration: CollaborationPrisma
  let notification: NotificationPrisma
  let publisherClient: NatsJetStreamClient
  let notificationClient: NatsJetStreamClient

  beforeAll(async () => {
    if (!process.env.COLLABORATION_DATABASE_URL || !process.env.NOTIFICATION_DATABASE_URL) {
      throw new Error('JOURNEY_DATABASE_URLS_REQUIRED')
    }
    collaboration = new CollaborationPrisma()
    await collaboration.$connect()
    process.env.DATABASE_URL = process.env.NOTIFICATION_DATABASE_URL
    notification = new NotificationPrisma()
    await notification.$connect()
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
    if (notification) {
      await notification.notificationInboxItem.deleteMany({ where: { tenantId } })
      await notification.notificationInboxEvent.deleteMany({ where: { tenantId } })
      await notification.$disconnect()
    }
    if (collaboration) {
      const tasks = await collaboration.collaborationTask.findMany({
        where: { tenantId },
        select: { id: true }
      })
      const taskIds = tasks.map((task) => task.id)
      await collaboration.collaborationTaskAuditEnvelope.deleteMany({ where: { tenantId } })
      await collaboration.collaborationTaskEventEnvelope.deleteMany({ where: { tenantId } })
      await collaboration.collaborationTaskOutbox.deleteMany({ where: { tenantId } })
      if (taskIds.length)
        await collaboration.collaborationTask.deleteMany({ where: { id: { in: taskIds } } })
      await collaboration.$disconnect()
    }
  })

  it('delivers a real command-owned outbox event and quarantines a wrong-owner envelope', async () => {
    const assigneeAccountId = `${prefix}_assignee`
    const commands = new TaskCommandService(
      new PrismaTaskRepository(collaboration),
      { isActiveTenantAccount: async () => true } as never,
      new PrismaTaskCommandTransaction(collaboration),
      { canAssignTask: async () => true } as never
    )
    const task = await commands.createTask({
      tenantId,
      operatorAccountId: `${prefix}_creator`,
      assigneeAccountId,
      traceId: `${prefix}_trace`,
      auditId: `${prefix}_audit`,
      title: `${prefix}_review publication`,
      priority: TaskPriority.HIGH,
      dueAt: new Date('2026-09-05T08:00:00.000Z'),
      now: new Date('2026-09-04T08:00:00.000Z')
    })
    const outboxBefore = await collaboration.collaborationTaskOutbox.findFirstOrThrow({
      where: { tenantId, aggregateId: task.id }
    })
    const relay = new CollaborationTaskOutboxRelay(
      new PrismaCollaborationTaskOutboxStore(collaboration),
      new NatsJetStreamPublisher(publisherClient)
    )
    await relay.relayOnce(new Date(Date.now() + 60_000))
    await expect(
      collaboration.collaborationTaskOutbox.findUniqueOrThrow({
        where: { eventId: outboxBefore.eventId }
      })
    ).resolves.toMatchObject({ status: 'PUBLISHED', attemptCount: 0 })

    const inbox = new PrismaNotificationInboxRepository(notification)
    const consumer = new CollaborationTaskEventConsumer(
      new CollaborationTaskNotificationHandler(inbox),
      new NotificationEventDlqTransfer(new NatsConsumerDlqBinding(notificationClient))
    )
    await pullOnce(consumer)
    await expect(
      notification.notificationInboxItem.findMany({
        where: { tenantId, sourceEventId: outboxBefore.eventId }
      })
    ).resolves.toEqual([
      expect.objectContaining({ recipientAccountId: assigneeAccountId, channel: 'IN_APP' })
    ])

    const invalidEvent = createOesCloudEvent({
      contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
      eventId: `${prefix}_wrong_owner`,
      occurredAt: '2026-09-04T08:02:00.000Z',
      tenantId,
      aggregateType: 'TASK',
      aggregateId: `${prefix}_invalid_task`,
      actorAccountId: `${prefix}_creator`,
      traceId: `${prefix}_invalid_trace`,
      data: {
        taskId: `${prefix}_invalid_task`,
        createdByAccountId: `${prefix}_creator`,
        assigneeAccountId,
        status: 'OPEN',
        priority: 'HIGH',
        titleSnapshot: 'Wrong owner must fail closed'
      }
    })
    const encoded = encodeCloudEvent({ ...invalidEvent, source: 'urn:oes:service:wrong-owner' })
    await publisherClient.publish({
      subject: 'oes.events.collaboration.task.assigned',
      headers: encoded.headers,
      body: encoded.body
    })
    let failure: unknown
    await new NatsDurablePullRunner(notificationClient).runOnce({
      stream: 'OES_BUSINESS_EVENTS',
      consumer: 'notification-service__collaboration-task__v1',
      expiresMs: 2_000,
      handle: async (delivery) => {
        failure = await consumer.handleDelivery(delivery)
      }
    })
    expect(failure).toEqual({ kind: 'NON_RETRYABLE_FAILURE', code: 'EVENT_OWNER_MISMATCH' })
    await expect(
      notification.notificationInboxEvent.findUnique({
        where: {
          consumerName_eventId: {
            consumerName: 'notification-service__collaboration-task__v1',
            eventId: invalidEvent.id
          }
        }
      })
    ).resolves.toBeNull()
  })

  async function pullOnce(consumer: CollaborationTaskEventConsumer): Promise<void> {
    let handled = false
    for (let attempt = 0; attempt < 5 && !handled; attempt += 1) {
      handled = await new NatsDurablePullRunner(notificationClient).runOnce({
        stream: 'OES_BUSINESS_EVENTS',
        consumer: 'notification-service__collaboration-task__v1',
        expiresMs: 2_000,
        handle: async (delivery) => {
          await consumer.handleDelivery(delivery)
        }
      })
    }
    expect(handled).toBe(true)
  }

  function runtimeOptions(userKey: string, passwordKey: string) {
    const user = process.env[userKey]
    const password = process.env[passwordKey]
    const url = process.env.NATS_URL
    if (!user || !password || !url) throw new Error('JOURNEY_NATS_CREDENTIALS_REQUIRED')
    return { servers: url.split(','), user, password, name: `${prefix}-${user}` }
  }
})
