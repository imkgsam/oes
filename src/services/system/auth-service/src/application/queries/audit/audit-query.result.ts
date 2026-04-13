import { AuditEventEntity } from '../../../domain/entities/audit-event.entity'

export interface AuditEventView {
  eventId: string
  service: string
  module: string
  eventType: string
  occurredAt: Date
  result: string
  operatorId?: string
  operatorType: string
  tenantId?: string
  orgId?: string
  traceId?: string
  resourceType: string
  resourceId?: string
  details: Record<string, unknown>
}

export interface ListAuditEventsView {
  items: AuditEventView[]
  nextCursor?: string
}

/**
 * toAuditEventView converts the auth audit read entity into the gRPC-facing view shape.
 */
export function toAuditEventView(event: AuditEventEntity): AuditEventView {
  return {
    eventId: event.eventId,
    service: event.service,
    module: event.module,
    eventType: event.eventType,
    occurredAt: event.occurredAt,
    result: event.result,
    operatorId: event.operatorId,
    operatorType: event.operatorType,
    tenantId: event.tenantId,
    orgId: event.orgId,
    traceId: event.traceId,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    details: event.details
  }
}
