import { createOesCloudEvent, encodeCloudEvent } from '@oes/common/events'
import { COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT } from '@oes/common/contracts'
import { LoggingModule } from '@oes/common/logging'
import { Test, type TestingModule } from '@nestjs/testing'
import { CollaborationTaskOutboxStatus } from '../../prisma/generated/prisma'
import { CollaborationTaskOutboxRelay } from '../../src/infrastructure/events/collaboration-task-outbox.relay'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

const liveDescribe = process.env.EVENT_BUS_LIVE === 'true' ? describe : describe.skip

/** Proves the Collaboration relay uses the shared ACL-scoped JetStream runtime against the local accepted topology. */
liveDescribe('Collaboration Task outbox live relay', () => {
  let module: TestingModule
  let prisma: PrismaService
  let relay: CollaborationTaskOutboxRelay
  const eventIds: string[] = []

  beforeAll(async () => {
    const { CollaborationTaskModule } =
      require('../../src/modules/collaboration-task.module') as typeof import('../../src/modules/collaboration-task.module')
    module = await Test.createTestingModule({
      imports: [
        LoggingModule.forRoot({ serviceName: 'collaboration-service-live-test' }),
        CollaborationTaskModule
      ]
    }).compile()
    await module.init()
    prisma = module.get(PrismaService)
    relay = module.get(CollaborationTaskOutboxRelay)
  })

  afterEach(async () => {
    if (eventIds.length) {
      await prisma.collaborationTaskOutbox.deleteMany({
        where: { eventId: { in: eventIds.splice(0) } }
      })
    }
  })

  afterAll(async () => {
    await module?.close()
  })

  it('marks a Collaboration-owned immutable body published only after a JetStream acknowledgement', async () => {
    const event = assignedEvent(
      'a1111111-1111-4111-8111-111111111111',
      'b1111111-1111-4111-8111-111111111111'
    )
    eventIds.push(event.id)
    await insertOutbox(event)

    const relayNow = new Date()
    await relay.relayOnce(relayNow)

    const outbox = await prisma.collaborationTaskOutbox.findUniqueOrThrow({
      where: { eventId: event.id }
    })
    expect(outbox.status).toBe(CollaborationTaskOutboxStatus.PUBLISHED)
    expect(outbox.publishedAt).toEqual(relayNow)
    expect(outbox.attemptCount).toBe(0)
  })

  it('quarantines a deterministic invalid immutable body without publishing it', async () => {
    const event = assignedEvent(
      'a2222222-2222-4222-8222-222222222222',
      'b2222222-2222-4222-8222-222222222222'
    )
    eventIds.push(event.id)
    await insertOutbox(event, Buffer.from('{}', 'utf8'))

    await relay.relayOnce(new Date())

    const outbox = await prisma.collaborationTaskOutbox.findUniqueOrThrow({
      where: { eventId: event.id }
    })
    expect(outbox.status).toBe(CollaborationTaskOutboxStatus.QUARANTINED)
    expect(outbox.lastErrorCode).toBe('EVENT_SPECVERSION_UNSUPPORTED')
  })

  /** Inserts a frozen outbox record only for this live relay proof. */
  async function insertOutbox(
    event: ReturnType<typeof assignedEvent>,
    cloudEventBody: Uint8Array = encodeCloudEvent(event).body
  ): Promise<void> {
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
        cloudEventBody: Buffer.from(cloudEventBody)
      }
    })
  }
})

/** Builds a frozen assigned fact whose identifiers remain isolated to this L2 proof. */
function assignedEvent(eventId: string, taskId: string) {
  return createOesCloudEvent({
    contract: COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
    eventId,
    occurredAt: '2026-07-26T08:00:00.000Z',
    tenantId: 'live-tenant',
    aggregateType: 'TASK',
    aggregateId: taskId,
    actorAccountId: 'live-creator',
    traceId: 'live-trace',
    data: {
      taskId,
      createdByAccountId: 'live-creator',
      assigneeAccountId: 'live-assignee',
      status: 'OPEN',
      priority: 'HIGH',
      titleSnapshot: 'Live relay proof'
    }
  })
}
