import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../../prisma/generated/prisma'
import { AuthAuditEvent } from '../../../application/events/auth-audit.event'
import { AuditEventEntity } from '../../../domain/entities/audit-event.entity'
import {
  AuthAuditRepository,
  ListAuditEventsInput,
  ListAuditEventsOutput
} from '../../../domain/repositories/auth-audit.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { randomUUID } from 'node:crypto'

/**
 * PrismaAuthAuditRepository persists auth audit envelopes using the auth-service local Prisma schema.
 */
@Injectable()
export class PrismaAuthAuditRepository implements AuthAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * append writes one auth audit envelope into the local AuditEvent truth table.
   */
  async append(event: AuthAuditEvent): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        id: event.eventId,
        service: event.service,
        module: event.module,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        result: event.result,
        operatorId: event.operator.operatorId,
        operatorType: event.operator.operatorType,
        tenantId: event.scope.tenantId,
        orgId: event.scope.orgId,
        traceId: event.trace.traceId,
        resourceType: event.resource.resourceType,
        resourceId: event.resource.resourceId,
        details: event.details as Prisma.InputJsonValue
      }
    })
  }

  /** Persists subject-to-target token linkage and bounded actor attribution before STS returns. */
  async appendOboLink(input: {
    sourceTokenId: string
    targetTokenId: string
    subject: string
    tenantId?: string
    actor: unknown
    workload: string
    audience: string
    decisionReference: string
  }): Promise<void> {
    await this.append(
      new AuthAuditEvent(
        randomUUID(),
        'auth',
        'EXECUTION_TOKEN_OBO_ISSUED',
        new Date(),
        'SUCCEEDED',
        { operatorId: input.subject, operatorType: 'HUMAN' },
        { tenantId: input.tenantId, orgId: undefined },
        { traceId: input.targetTokenId, spanId: null },
        { resourceType: 'execution_token', resourceId: input.targetTokenId },
        {
          sourceTokenId: input.sourceTokenId,
          actor: input.actor,
          workload: input.workload,
          audience: input.audience,
          decisionReference: input.decisionReference
        }
      )
    )
  }

  /**
   * list reads auth audit envelopes with cursor pagination and shared audit filters.
   */
  async list(input: ListAuditEventsInput): Promise<ListAuditEventsOutput> {
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
    if (input.eventTypes && input.eventTypes.length > 0) {
      conditions.push({ eventType: { in: input.eventTypes } })
    }
    if (input.result) {
      conditions.push({ result: input.result })
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
                id: {
                  lt: cursor.id
                }
              }
            ]
          }
        ]
      })
    }

    const records = await this.prisma.auditEvent.findMany({
      where: conditions.length > 0 ? { AND: conditions } : undefined,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: input.pageSize + 1
    })

    const hasMore = records.length > input.pageSize
    const page = hasMore ? records.slice(0, input.pageSize) : records
    const last = page[page.length - 1]

    return {
      items: page.map(
        (record) =>
          new AuditEventEntity(
            record.id,
            record.service,
            record.module,
            record.eventType,
            record.occurredAt,
            record.result,
            record.operatorId ?? undefined,
            record.operatorType,
            record.tenantId ?? undefined,
            record.orgId ?? undefined,
            record.traceId ?? undefined,
            record.resourceType,
            record.resourceId ?? undefined,
            ((record.details as Record<string, unknown> | null) ?? {}) as Record<string, unknown>
          )
      ),
      nextCursor: hasMore && last ? encodeAuditCursor(last.occurredAt, last.id) : undefined
    }
  }
}

/**
 * encodeAuditCursor converts the stable auth audit sort key into an opaque pagination cursor.
 */
function encodeAuditCursor(occurredAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ occurredAt: occurredAt.toISOString(), id })).toString(
    'base64'
  )
}

/**
 * decodeAuditCursor restores the auth audit sort key from an opaque pagination cursor.
 */
function decodeAuditCursor(cursor: string): {
  occurredAt: Date
  id: string
} {
  const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as {
    occurredAt: string
    id: string
  }

  return {
    occurredAt: new Date(decoded.occurredAt),
    id: decoded.id
  }
}
