import { AuthAuditEvent } from '../../application/events/auth-audit.event'
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

/**
 * AuthAuditRepository persists and queries auth-service audit envelopes from the local audit truth source.
 */
export interface AuthAuditRepository {
  append(event: AuthAuditEvent): Promise<void>
  list(input: ListAuditEventsInput): Promise<ListAuditEventsOutput>
}
