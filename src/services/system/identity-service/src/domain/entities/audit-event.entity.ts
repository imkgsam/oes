export interface AuditEventEntity {
  eventId: string
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
  details: Record<string, unknown>
}
