import { AuditEvent } from '../../../prisma/generated/prisma/index'
import { AuditEventEntity } from '../../domain/entities/audit-event.entity'

export class PrismaIdentityAuditMapper {
  static toDomain(record: AuditEvent): AuditEventEntity {
    return {
      eventId: record.eventId,
      service: record.service,
      module: record.module,
      eventType: record.eventType,
      occurredAt: record.occurredAt,
      result: record.result,
      operatorId: record.operatorId,
      operatorType: record.operatorType,
      tenantId: record.tenantId,
      orgId: record.orgId,
      traceId: record.traceId,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      details: isRecord(record.details) ? record.details : {}
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
