// This type defines the envelope-compatible view returned by permission audit queries.
export interface AuditEventView {
  eventId: string
  service: string
  module: string
  eventType: string
  occurredAt: Date
  result: string
  operatorId: string
  operatorType: string
  tenantId?: string
  orgId?: string
  traceId?: string
  resourceType: string
  resourceId: string
  details: Record<string, unknown>
}

// This type wraps paginated permission audit query results.
export interface ListAuditEventsView {
  items: AuditEventView[]
  nextCursor?: string
}
