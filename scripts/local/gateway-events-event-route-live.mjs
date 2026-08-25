import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const common = require('../../src/common/dist')
const {
  CollaborationTaskOutboxStatus,
  PrismaClient: CollaborationPrismaClient
} = require('../../src/services/system/collaboration-service/prisma/generated/prisma')
const {
  PrismaClient: NotificationPrismaClient
} = require('../../src/services/system/notification-service/prisma/generated/prisma')
const {
  PrismaCollaborationTaskOutboxStore
} = require('../../src/services/system/collaboration-service/dist/infrastructure/events/prisma-collaboration-task-outbox.store')
const {
  CollaborationTaskOutboxRelay
} = require('../../src/services/system/collaboration-service/dist/infrastructure/events/collaboration-task-outbox.relay')
const {
  PrismaNotificationInboxRepository
} = require('../../src/services/system/notification-service/dist/infrastructure/inbox/prisma-notification-inbox.repository')
const {
  CollaborationTaskNotificationHandler
} = require('../../src/services/system/notification-service/dist/application/events/collaboration-task-notification.handler')
const {
  CollaborationTaskEventConsumer
} = require('../../src/services/system/notification-service/dist/infrastructure/events/collaboration-task-event.consumer')
const {
  NotificationEventDlqTransfer
} = require('../../src/services/system/notification-service/dist/infrastructure/events/notification-event-dlq.transfer')
const {
  NotificationEventOperationsService
} = require('../../src/services/system/notification-service/dist/infrastructure/events/operations/notification-event-operations.service')
const {
  PrismaNotificationEventOperationsRepository
} = require('../../src/services/system/notification-service/dist/infrastructure/events/operations/prisma-notification-event-operations.repository')
const {
  NotificationSafeRedeliveryJob
} = require('../../src/services/system/notification-service/dist/infrastructure/events/operations/notification-safe-redelivery.job')

/** Proves the exact Collaboration outbox bytes reach Notification Inbox, DLQ, and bounded replay on real JetStream/Postgres. */
async function main() {
  const required = requiredEnvironment()
  const collaboration = new CollaborationPrismaClient({
    datasources: { db: { url: required.collaborationDatabaseUrl } }
  })
  const notification = new NotificationPrismaClient({
    datasources: { db: { url: required.notificationDatabaseUrl } }
  })
  const publisherClient = new common.NatsJetStreamClient({
    servers: [required.natsUrl],
    user: required.collaborationUser,
    password: required.collaborationPassword,
    name: 'gateway-events-collaboration-live'
  })
  const notificationClient = new common.NatsJetStreamClient({
    servers: [required.natsUrl],
    user: required.notificationUser,
    password: required.notificationPassword,
    name: 'gateway-events-notification-live'
  })
  const replayClient = new common.NatsJetStreamClient({
    servers: [required.natsUrl],
    user: required.replayUser,
    password: required.replayPassword,
    name: 'gateway-events-replay-live'
  })
  const tenantId = `ge-${randomUUID()}`
  const eventIds = []
  let replayRunId
  try {
    await Promise.all([collaboration.$connect(), notification.$connect()])
    await Promise.all([
      publisherClient.onModuleInit(),
      notificationClient.onModuleInit(),
      replayClient.onModuleInit()
    ])

    const publisher = new common.NatsJetStreamPublisher(publisherClient)
    const outbox = new PrismaCollaborationTaskOutboxStore(collaboration)
    const relay = new CollaborationTaskOutboxRelay(outbox, publisher)
    const inbox = new PrismaNotificationInboxRepository(notification)
    const handler = new CollaborationTaskNotificationHandler(inbox)
    const consumer = new CollaborationTaskEventConsumer(
      handler,
      new NotificationEventDlqTransfer(new common.NatsConsumerDlqBinding(notificationClient))
    )

    const success = assignedEvent(tenantId, 'success')
    eventIds.push(success.id)
    const successBody = Buffer.from(JSON.stringify(success, null, 2), 'utf8')
    await insertOutbox(collaboration, success, successBody)
    await relay.relayOnce(new Date())
    const successRow = await collaboration.collaborationTaskOutbox.findUniqueOrThrow({
      where: { eventId: success.id }
    })
    assert.equal(successRow.status, CollaborationTaskOutboxStatus.PUBLISHED)
    assert.equal(Buffer.compare(Buffer.from(successRow.cloudEventBody), successBody), 0)
    await pullUntilInbox(notificationClient, consumer, notification, success.id)
    const persisted = await notification.notificationInboxEvent.findUniqueOrThrow({
      where: { consumerName_eventId: inboxIdentity(success.id) }
    })
    assert.deepEqual(
      {
        tenantId: persisted.tenantId,
        orgId: persisted.orgId,
        traceId: persisted.traceId,
        bodyDigest: persisted.canonicalBodyDigest,
        itemCount: await notification.notificationInboxItem.count({
          where: { sourceEventId: success.id }
        })
      },
      {
        tenantId,
        orgId: success.oesorgid,
        traceId: success.oestraceid,
        bodyDigest: common.digestCanonicalBody(successBody),
        itemCount: 1
      }
    )
    const decodedStored = common.decodeCloudEvent(
      successRow.cloudEventBody,
      common.COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT
    )
    assert.deepEqual(contextEvidence(decodedStored), contextEvidence(success))

    const duplicatePublish = await publisher.publishStored(
      successBody,
      common.COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT
    )
    assert.deepEqual(
      { kind: duplicatePublish.kind, duplicate: duplicatePublish.duplicate },
      { kind: 'ACKNOWLEDGED', duplicate: true }
    )
    assert.equal(
      (
        await handler.handle(
          decodedStored,
          common.createInboxIdentity(
            'notification-service__collaboration-task__v1',
            decodedStored,
            successBody
          )
        )
      ).kind,
      'DUPLICATE'
    )
    assert.equal(
      await notification.notificationInboxItem.count({ where: { sourceEventId: success.id } }),
      1
    )

    const recovered = assignedEvent(tenantId, 'retry')
    eventIds.push(recovered.id)
    const recoveredBody = common.encodeCloudEvent(recovered).body
    await insertOutbox(collaboration, recovered, recoveredBody)
    let injectedFailure = true
    const transientRelay = new CollaborationTaskOutboxRelay(outbox, {
      publishStored: async (body, contract) => {
        if (injectedFailure) {
          injectedFailure = false
          return {
            kind: 'RETRYABLE_FAILURE',
            code: 'NATS_TEMPORARILY_UNAVAILABLE',
            message: 'bounded injected transport failure'
          }
        }
        return publisher.publishStored(body, contract)
      }
    })
    const firstAttempt = new Date()
    await transientRelay.relayOnce(firstAttempt)
    const retryScheduled = await collaboration.collaborationTaskOutbox.findUniqueOrThrow({
      where: { eventId: recovered.id }
    })
    assert.equal(retryScheduled.status, CollaborationTaskOutboxStatus.PENDING)
    assert.equal(retryScheduled.attemptCount, 1)
    assert.ok(retryScheduled.nextAttemptAt > firstAttempt)
    await transientRelay.relayOnce(new Date(retryScheduled.nextAttemptAt.getTime() + 1))
    await pullUntilInbox(notificationClient, consumer, notification, recovered.id)
    assert.equal(
      (
        await collaboration.collaborationTaskOutbox.findUniqueOrThrow({
          where: { eventId: recovered.id }
        })
      ).status,
      CollaborationTaskOutboxStatus.PUBLISHED
    )

    const exhausted = assignedEvent(tenantId, 'retry-exhausted')
    const exhaustedBody = common.encodeCloudEvent(exhausted).body
    await publisher.publishStored(exhaustedBody, common.COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT)
    const failingConsumer = new CollaborationTaskEventConsumer(
      {
        handle: async () => {
          throw new Error('injected task-owned Notification database outage')
        }
      },
      new NotificationEventDlqTransfer(new common.NatsConsumerDlqBinding(notificationClient))
    )
    let exhaustionOutcome
    await new common.NatsDurablePullRunner(notificationClient).runOnce({
      stream: 'OES_BUSINESS_EVENTS',
      consumer: 'notification-service__collaboration-task__v1',
      expiresMs: 2_000,
      handle: async (delivery) => {
        exhaustionOutcome = await failingConsumer.handleDelivery({
          ...delivery,
          deliveryAttempt: 5
        })
      }
    })
    assert.deepEqual(exhaustionOutcome, {
      kind: 'NON_RETRYABLE_FAILURE',
      code: 'NOTIFICATION_RETRY_EXHAUSTED'
    })
    const exhaustedDlqRecord = await pullDlqRecord(notificationClient, exhausted.id)
    assert.equal(exhaustedDlqRecord.stableErrorCode, 'NOTIFICATION_RETRY_EXHAUSTED')
    assert.equal(exhaustedDlqRecord.tenantId, tenantId)
    assert.equal(
      common.digestCanonicalBody(Uint8Array.from(Object.values(exhaustedDlqRecord.original.body))),
      common.digestCanonicalBody(exhaustedBody)
    )
    assert.equal(
      await notification.notificationInboxEvent.count({ where: { eventId: exhausted.id } }),
      0
    )

    replayRunId = required.taskKey
    const replayRunner = new common.NatsSafeRedeliveryRunner(replayClient)
    const replayRequest = {
      replayRunId,
      requestedBy: 'gateway-events-operator',
      approvedByConsumerOwner: 'notification-owner',
      approvedByPlatformOperator: 'platform-operator',
      platformApprovalRef: 'gateway-events-live-fixture',
      consumerName: 'notification-service__collaboration-task__v1',
      tenantScope: [tenantId],
      eventFilter: {
        eventTypes: [
          'collaboration.task.assigned',
          'collaboration.task.completed',
          'collaboration.task.cancelled'
        ],
        fromSequence: 1
      },
      mode: 'SAFE_REDELIVERY',
      reason: 'task-owned duplicate-proof replay',
      allowExternalSideEffects: false
    }
    const replayJob = new NotificationSafeRedeliveryJob(
      new NotificationEventOperationsService(
        new PrismaNotificationEventOperationsRepository(notification)
      ),
      replayRunner,
      handler
    )
    const replayResult = await replayJob.execute({
      trustedOperator: {
        accountId: replayRequest.requestedBy,
        authorizedTenantIds: [tenantId]
      },
      request: replayRequest,
      maximumPulls: 24
    })
    assert.equal(replayResult.status, 'COMPLETED')
    const deleted = await replayRunner.deleteConsumers({
      stream: 'OES_BUSINESS_EVENTS',
      request: replayRequest
    })
    assert.deepEqual(deleted, [
      `notification-service__replay__${replayRunId}__assigned`,
      `notification-service__replay__${replayRunId}__completed`,
      `notification-service__replay__${replayRunId}__cancelled`
    ])
    assert.equal(
      await notification.notificationInboxItem.count({ where: { sourceEventId: success.id } }),
      1
    )
    assert.equal(
      (
        await notification.notificationInboxEvent.findUniqueOrThrow({
          where: { consumerName_eventId: inboxIdentity(success.id) }
        })
      ).canonicalBodyDigest,
      common.digestCanonicalBody(successBody)
    )
    assert.equal(
      (
        await notification.notificationInboxEvent.findUniqueOrThrow({
          where: { consumerName_eventId: inboxIdentity(exhausted.id) }
        })
      ).canonicalBodyDigest,
      common.digestCanonicalBody(exhaustedBody)
    )
    assert.equal(
      await notification.notificationInboxItem.count({ where: { sourceEventId: exhausted.id } }),
      1
    )
    assert.equal(
      (
        await handler.handle(
          common.decodeCloudEvent(exhaustedBody, common.COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT),
          common.createInboxIdentity(
            'notification-service__collaboration-task__v1',
            exhausted,
            exhaustedBody
          )
        )
      ).kind,
      'DUPLICATE'
    )
    assert.equal(
      await notification.notificationInboxItem.count({ where: { sourceEventId: exhausted.id } }),
      1
    )

    const rejected = assignedEvent(tenantId, 'permanent')
    eventIds.push(rejected.id)
    const rejectedEncoded = common.encodeCloudEvent({
      ...rejected,
      source: 'urn:oes:service:invalid-owner'
    })
    await publisherClient.publish({
      subject: 'oes.events.collaboration.task.assigned',
      headers: rejectedEncoded.headers,
      body: rejectedEncoded.body
    })
    let rejectedOutcome
    await new common.NatsDurablePullRunner(notificationClient).runOnce({
      stream: 'OES_BUSINESS_EVENTS',
      consumer: 'notification-service__collaboration-task__v1',
      expiresMs: 2_000,
      handle: async (delivery) => {
        rejectedOutcome = await consumer.handleDelivery(delivery)
      }
    })
    assert.deepEqual(rejectedOutcome, {
      kind: 'NON_RETRYABLE_FAILURE',
      code: 'EVENT_OWNER_MISMATCH'
    })
    const dlqRecord = await pullDlqRecord(notificationClient, rejected.id)
    assert.equal(dlqRecord.stableErrorCode, 'EVENT_OWNER_MISMATCH')
    assert.equal(dlqRecord.tenantId, tenantId)
    assert.equal(dlqRecord.traceId, rejected.oestraceid)
    assert.equal(
      common.digestCanonicalBody(Uint8Array.from(Object.values(dlqRecord.original.body))),
      common.digestCanonicalBody(rejectedEncoded.body)
    )
    assert.equal(
      await notification.notificationInboxEvent.count({ where: { eventId: rejected.id } }),
      0
    )

    console.log(
      JSON.stringify(
        {
          outboxToInbox: {
            exactBodyDigest: common.digestCanonicalBody(successBody),
            persistedContext: contextEvidence(success),
            notificationItems: 1
          },
          duplicate: { brokerDeduplicated: true, inboxOutcome: 'DUPLICATE', sideEffects: 1 },
          retryRecovery: { attempts: 2, finalOutboxStatus: 'PUBLISHED' },
          retryExhaustion: {
            code: exhaustedDlqRecord.stableErrorCode,
            sourceTerminatedAfterDlq: true,
            replayApplied: 1,
            duplicateSideEffects: 1
          },
          permanentFailure: {
            code: dlqRecord.stableErrorCode,
            dlqBodyDigestPreserved: true,
            sourceTerminatedAfterDlq: true
          },
          replay: {
            status: replayResult.status,
            originalBodyDigestPreserved: true,
            sideEffects: 1,
            deletedDurables: deleted.length
          }
        },
        null,
        2
      )
    )
  } finally {
    if (replayRunId) {
      await notification.notificationEventReplayAudit.deleteMany({ where: { replayRunId } })
      await notification.notificationEventReplayRun.deleteMany({ where: { replayRunId } })
    }
    await notification.notificationInboxItem.deleteMany({ where: { tenantId } })
    await notification.notificationInboxEvent.deleteMany({ where: { tenantId } })
    if (eventIds.length) {
      await collaboration.collaborationTaskOutbox.deleteMany({
        where: { eventId: { in: eventIds } }
      })
    }
    await Promise.allSettled([
      publisherClient.onModuleDestroy(),
      notificationClient.onModuleDestroy(),
      replayClient.onModuleDestroy(),
      collaboration.$disconnect(),
      notification.$disconnect()
    ])
  }
}

/** Inserts one exact byte body into the Collaboration-owned outbox without crossing database ownership. */
async function insertOutbox(prisma, event, body) {
  await prisma.collaborationTaskOutbox.create({
    data: {
      eventId: event.id,
      eventType: event.type,
      eventVersion: event.oeseventversion,
      ownerService: 'collaboration-service',
      tenantId: event.oestenantid,
      aggregateType: event.oesaggregatetype,
      aggregateId: event.oesaggregateid,
      occurredAt: new Date(event.time),
      cloudEventBody: Buffer.from(body)
    }
  })
}

/** Pulls bounded deliveries until the exact event becomes durable Notification-owned Inbox truth. */
async function pullUntilInbox(client, consumer, prisma, eventId) {
  const runner = new common.NatsDurablePullRunner(client)
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await runner.runOnce({
      stream: 'OES_BUSINESS_EVENTS',
      consumer: 'notification-service__collaboration-task__v1',
      expiresMs: 2_000,
      handle: (delivery) => consumer.handleDelivery(delivery)
    })
    if (await prisma.notificationInboxEvent.count({ where: { eventId } })) return
  }
  throw new Error(`NOTIFICATION_INBOX_EVENT_TIMEOUT:${eventId}`)
}

/** Pulls and ACKs the exact consumer-owned DLQ record while retaining its literal body for assertions. */
async function pullDlqRecord(client, eventId) {
  let record
  for (let attempt = 0; attempt < 5 && !record; attempt += 1) {
    await new common.NatsDurablePullRunner(client).runOnce({
      stream: 'OES_EVENT_DLQ',
      consumer: 'notification-service__dlq-inspection__v1',
      expiresMs: 2_000,
      handle: async (delivery) => {
        const candidate = JSON.parse(Buffer.from(delivery.body).toString('utf8'))
        await delivery.ack()
        if (candidate.eventId === eventId) record = candidate
      }
    })
  }
  if (!record) throw new Error(`NOTIFICATION_DLQ_RECORD_TIMEOUT:${eventId}`)
  return record
}

/** Builds one full-context event whose identifiers remain isolated to this task-owned journey. */
function assignedEvent(tenantId, suffix) {
  const taskId = randomUUID()
  return common.createOesCloudEvent({
    contract: common.COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
    eventId: randomUUID(),
    occurredAt: '2026-08-25T01:00:00.000Z',
    tenantId,
    orgId: 'org-gateway-events',
    aggregateType: 'TASK',
    aggregateId: taskId,
    actorAccountId: 'operator-gateway-events',
    traceId: `trace-gateway-events-${suffix}`,
    correlationId: 'correlation-gateway-events',
    causationId: `command-gateway-events-${suffix}`,
    auditRef: `audit-gateway-events-${suffix}`,
    data: {
      taskId,
      createdByAccountId: 'operator-gateway-events',
      assigneeAccountId: 'assignee-gateway-events',
      status: 'OPEN',
      priority: 'HIGH',
      titleSnapshot: `Gateway events ${suffix}`
    }
  })
}

/** Selects only the frozen execution and correlation fields used as context-propagation evidence. */
function contextEvidence(event) {
  return {
    tenantId: event.oestenantid,
    orgId: event.oesorgid,
    operator: event.oesactoraccountid,
    traceId: event.oestraceid,
    correlationId: event.oescorrelationid,
    causationId: event.oescausationid,
    auditRef: event.oesauditref
  }
}

/** Produces the exact compound Inbox key without letting the caller vary consumer identity. */
function inboxIdentity(eventId) {
  return { consumerName: 'notification-service__collaboration-task__v1', eventId }
}

/** Loads every task-local connection binding and fails closed before starting the route. */
function requiredEnvironment() {
  const values = {
    taskKey: process.env.OES_TASK_KEY,
    collaborationDatabaseUrl: process.env.COLLABORATION_DATABASE_URL,
    notificationDatabaseUrl: process.env.NOTIFICATION_DATABASE_URL,
    natsUrl: process.env.NATS_URL,
    collaborationUser: process.env.NATS_COLLABORATION_USER,
    collaborationPassword: process.env.NATS_COLLABORATION_PASSWORD,
    notificationUser: process.env.NATS_NOTIFICATION_USER,
    notificationPassword: process.env.NATS_NOTIFICATION_PASSWORD,
    replayUser: process.env.NATS_NOTIFICATION_REPLAY_USER,
    replayPassword: process.env.NATS_NOTIFICATION_REPLAY_PASSWORD
  }
  for (const [name, value] of Object.entries(values)) {
    if (!value?.trim()) throw new Error(`GATEWAY_EVENTS_LIVE_${name.toUpperCase()}_REQUIRED`)
  }
  return values
}

await main()
