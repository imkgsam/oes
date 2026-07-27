import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { EventConsumeOutcome } from '@oes/common'
import type {
  ApplyNotificationInboxInput,
  NotificationInboxPort
} from '../../application/events/notification-inbox.port'
import { PrismaService } from '../prisma/prisma.service'

/** Persists Notification event identity and predefined in-app results in one service-local Prisma transaction. */
@Injectable()
export class PrismaNotificationInboxRepository implements NotificationInboxPort {
  /** Creates the repository with only the Notification service's own database access. */
  constructor(private readonly prisma: PrismaService) {}

  /** Commits a first delivery atomically or proves an existing Inbox identity is equivalent without repeating side effects. */
  async apply(input: ApplyNotificationInboxInput): Promise<EventConsumeOutcome> {
    return this.prisma.$transaction(async (transaction) => {
      const inboxEventId = randomUUID()
      const created = await transaction.notificationInboxEvent.createMany({
        data: [
          {
            id: inboxEventId,
            consumerName: input.identity.consumerName,
            eventId: input.identity.eventId,
            tenantId: input.identity.tenantId,
            ...(input.event.oesorgid !== undefined ? { orgId: input.event.oesorgid } : {}),
            source: input.event.source,
            eventType: input.identity.eventType,
            eventVersion: input.identity.eventVersion,
            eventTime: new Date(input.event.time),
            aggregateType: input.event.oesaggregatetype,
            aggregateId: input.event.oesaggregateid,
            canonicalBodyDigest: input.identity.canonicalBodyDigest,
            traceId: input.identity.traceId,
            result: input.items.length === 0 ? 'NO_RECIPIENT' : 'APPLIED'
          }
        ],
        skipDuplicates: true
      })
      if (created.count === 0) {
        const existing = await transaction.notificationInboxEvent.findUnique({
          where: {
            consumerName_eventId: {
              consumerName: input.identity.consumerName,
              eventId: input.identity.eventId
            }
          }
        })
        if (existing && matchesIdentity(existing, input)) return { kind: 'DUPLICATE' }
        return { kind: 'EVENT_ID_CONFLICT', code: 'EVENT_ID_CONFLICT' }
      }

      if (input.items.length > 0) {
        await transaction.notificationInboxItem.createMany({
          data: input.items.map((item) => ({
            id: randomUUID(),
            inboxEventId,
            ...item
          }))
        })
      }
      return { kind: 'APPLIED' }
    })
  }
}

/** Compares every immutable envelope identity and body digest before treating an event-ID reuse as a duplicate. */
function matchesIdentity(
  existing: {
    readonly consumerName: string
    readonly eventId: string
    readonly tenantId: string
    readonly source: string
    readonly eventType: string
    readonly eventVersion: number
    readonly eventTime: Date
    readonly aggregateType: string
    readonly aggregateId: string
    readonly canonicalBodyDigest: string
  },
  input: ApplyNotificationInboxInput
): boolean {
  return (
    existing.consumerName === input.identity.consumerName &&
    existing.eventId === input.identity.eventId &&
    existing.tenantId === input.identity.tenantId &&
    existing.source === input.event.source &&
    existing.eventType === input.identity.eventType &&
    existing.eventVersion === input.identity.eventVersion &&
    existing.eventTime.toISOString() === input.event.time &&
    existing.aggregateType === input.event.oesaggregatetype &&
    existing.aggregateId === input.event.oesaggregateid &&
    existing.canonicalBodyDigest === input.identity.canonicalBodyDigest
  )
}
