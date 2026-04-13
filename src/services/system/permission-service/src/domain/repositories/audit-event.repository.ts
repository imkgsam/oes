import { AuditEventEntity } from '../entities/audit-event.entity'

export interface ListAuditEventsInput {
  service?: string
  module?: string
  eventType?: string
  result?: string
  operatorId?: string
  tenantId?: string
  orgId?: string
  resourceType?: string
  resourceId?: string
  occurredAtFrom?: Date
  occurredAtTo?: Date
  pageSize: number
  cursor?: string
}

export interface ListAuditEventsOutput {
  items: AuditEventEntity[]
  nextCursor?: string
}

// This repository exposes permission management audit records through a query-friendly contract.
export interface AuditEventRepository {
  list(input: ListAuditEventsInput): Promise<ListAuditEventsOutput>
}
