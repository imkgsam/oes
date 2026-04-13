import { Injectable } from '@nestjs/common'
import {
  AuthorizationDecision,
  EvaluationMode,
  Prisma
} from '../../../../prisma/generated/prisma'
import { PermissionAuditEvent } from '../../../application/events/permission-audit.event'
import { AuditEventEntity } from '../../../domain/entities/audit-event.entity'
import { DecisionEventEntity } from '../../../domain/entities/decision-event.entity'
import {
  AuditEventRepository,
  ListAuditEventsInput,
  ListAuditEventsOutput
} from '../../../domain/repositories/audit-event.repository'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
// This repository persists and queries permission audit records from Prisma-backed audit tables.
export class PrismaPermissionAuditRepository implements AuditEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  // This method appends management audit envelopes into the permission audit table as the source-of-truth shape.
  async appendAudit(event: PermissionAuditEvent): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        id: event.eventId,
        service: event.service,
        module: event.module,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        result: event.result,
        operatorId: event.operator.operatorId ?? null,
        operatorType: event.operator.operatorType,
        tenantId: event.scope.tenantId ?? null,
        orgId: event.scope.orgId ?? null,
        traceId: event.trace.traceId ?? null,
        resourceType: event.resource.resourceType,
        resourceId: event.resource.resourceId ?? null,
        details: event.details as Prisma.InputJsonValue,
        createdAt: event.occurredAt
      }
    })
  }

  // This method appends authorization decision audit events into the decision audit table.
  async appendDecision(event: DecisionEventEntity): Promise<void> {
    await this.prisma.decisionEvent.create({
      data: {
        id: event.id,
        tenantId: event.tenantId ?? null,
        accountId: event.accountId,
        permissionCode: event.permissionCode,
        resourceType: event.resourceType ?? null,
        resourceId: event.resourceId ?? null,
        evaluationMode: event.evaluationMode as EvaluationMode,
        decision: event.decision as AuthorizationDecision,
        matchedPolicyId: event.matchedPolicyId ?? null,
        matchedPolicyName: event.matchedPolicyName ?? null,
        reason: event.reason ?? null,
        requestContext: (event.requestContext ?? null) as
          | Prisma.InputJsonValue
          | Prisma.NullableJsonNullValueInput,
        createdAt: event.createdAt
      }
    })
  }

  // This method lists persisted management audit envelopes with cursor pagination and filter support.
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
    if (input.eventType) {
      conditions.push({ eventType: input.eventType })
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
              lt: cursor.createdAt
            }
          },
          {
            AND: [
              {
                occurredAt: cursor.createdAt
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
      take: pageSize + 1
    })

    const hasMore = records.length > pageSize
    const page = hasMore ? records.slice(0, pageSize) : records
    const last = page[page.length - 1]

    return {
      items: page.map((record) => toAuditEventEntity(record)),
      nextCursor: hasMore && last ? encodeAuditCursor(last.occurredAt, last.id) : undefined
    }
  }
}

// This function converts one persisted permission audit row into the shared envelope read model.
function toAuditEventEntity(
  record: {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date
    result: string
    operatorId: string | null
    operatorType: string
    tenantId: string | null
    orgId: string | null
    traceId: string | null
    resourceType: string
    resourceId: string | null
    details: Prisma.JsonValue
  }
): AuditEventEntity {
  return new AuditEventEntity(
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
    record.details as Record<string, unknown>
  )
}

// This function encodes a stable pagination cursor from the audit sort key.
function encodeAuditCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString('base64')
}

// This function decodes a pagination cursor back into the audit sort key.
function decodeAuditCursor(
  cursor: string
): {
  createdAt: Date
  id: string
} {
  const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as {
    createdAt: string
    id: string
  }

  return {
    createdAt: new Date(decoded.createdAt),
    id: decoded.id
  }
}
