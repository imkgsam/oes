import { Injectable } from '@nestjs/common'
import { flattenAuditEnvelope } from '@oes/common'
import { AuditEventResult, AuditOperatorType, Prisma } from '../../../../prisma/generated/prisma/index'
import { IdentityAuditEvent } from '../../../application/events/identity-audit.event'
import {
  AuditEventRepository,
  ListAuditEventsInput,
  ListAuditEventsOutput
} from '../../../domain/repositories/audit-event.repository'
import { PrismaIdentityAuditMapper } from '../../mappers/prisma-identity-audit.mapper'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaIdentityAuditRepository implements AuditEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async append(event: IdentityAuditEvent): Promise<void> {
    const record = flattenAuditEnvelope(event)

    await this.prisma.auditEvent.create({
      data: {
        eventId: record.eventId,
        service: record.service,
        module: record.module,
        eventType: record.eventType,
        occurredAt: record.occurredAt,
        result: record.result as AuditEventResult,
        operatorId: record.operatorId,
        operatorType: record.operatorType as AuditOperatorType,
        tenantId: record.tenantId,
        orgId: record.orgId,
        traceId: record.traceId,
        resourceType: record.resourceType,
        resourceId: record.resourceId,
        details: record.details as Prisma.InputJsonValue
      }
    })
  }

  async list(input: ListAuditEventsInput): Promise<ListAuditEventsOutput> {
    const pageSize = input.pageSize
    const cursor = input.cursor ? decodeAuditCursor(input.cursor) : undefined
    const conditions: Prisma.AuditEventWhereInput[] = []

    if (input.service) {
      conditions.push({ service: input.service })
    }
    if (input.module) {
      conditions.push({ module: input.module })
    }
    if (input.eventType) {
      conditions.push({ eventType: input.eventType })
    }
    if (input.result) {
      conditions.push({ result: input.result as AuditEventResult })
    }
    if (input.operatorId) {
      conditions.push({ operatorId: input.operatorId })
    }
    if (input.tenantId) {
      conditions.push({ tenantId: input.tenantId })
    }
    if (input.orgId) {
      conditions.push({ orgId: input.orgId })
    }
    if (input.resourceType) {
      conditions.push({ resourceType: input.resourceType })
    }
    if (input.resourceId) {
      conditions.push({ resourceId: input.resourceId })
    }
    if (input.occurredAtFrom || input.occurredAtTo) {
      conditions.push({
        occurredAt: {
          gte: input.occurredAtFrom,
          lte: input.occurredAtTo
        }
      })
    }
    if (cursor) {
      conditions.push({
        OR: [
          {
            occurredAt: {
              lt: cursor.occurredAt
            }
          },
          {
            AND: [
              {
                occurredAt: cursor.occurredAt
              },
              {
                eventId: {
                  lt: cursor.eventId
                }
              }
            ]
          }
        ]
      })
    }

    const records = await this.prisma.auditEvent.findMany({
      where: conditions.length > 0 ? { AND: conditions } : undefined,
      orderBy: [{ occurredAt: 'desc' }, { eventId: 'desc' }],
      take: pageSize + 1
    })

    const hasMore = records.length > pageSize
    const page = hasMore ? records.slice(0, pageSize) : records
    const items = page.map((record) => PrismaIdentityAuditMapper.toDomain(record))
    const last = page[page.length - 1]

    return {
      items,
      nextCursor: hasMore && last ? encodeAuditCursor(last.occurredAt, last.eventId) : undefined
    }
  }
}

function encodeAuditCursor(occurredAt: Date, eventId: string): string {
  return Buffer.from(JSON.stringify({ occurredAt: occurredAt.toISOString(), eventId })).toString(
    'base64'
  )
}

function decodeAuditCursor(
  cursor: string
): {
  occurredAt: Date
  eventId: string
} {
  const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as {
    occurredAt: string
    eventId: string
  }

  return {
    occurredAt: new Date(decoded.occurredAt),
    eventId: decoded.eventId
  }
}
