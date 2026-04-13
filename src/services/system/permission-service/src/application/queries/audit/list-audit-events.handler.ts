import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  AuditEventRepository,
  ListAuditEventsOutput
} from '../../../domain/repositories/audit-event.repository'
import { ListAuditEventsView } from './audit-query.result'
import { ListAuditEventsQuery } from './list-audit-events.query'

const PERMISSION_AUDIT_SERVICE = 'permission-service'
const PERMISSION_AUDIT_RESULT = 'SUCCEEDED'

@QueryHandler(ListAuditEventsQuery)
// This handler exposes permission management audit records through the shared envelope-compatible query view.
export class ListAuditEventsHandler
  implements IQueryHandler<ListAuditEventsQuery, ListAuditEventsView>
{
  constructor(
    @Inject(SYMBOLS.REPO.AUDIT_EVENT)
    private readonly auditEventRepository: AuditEventRepository
  ) {}

  // This method executes permission audit listing with fixed envelope-compatible semantics.
  async execute(query: ListAuditEventsQuery): Promise<ListAuditEventsView> {
    if (isFixedValueRejected(query.service, PERMISSION_AUDIT_SERVICE)) {
      return { items: [] }
    }
    if (isFixedValueRejected(query.result, PERMISSION_AUDIT_RESULT)) {
      return { items: [] }
    }
    if (query.orgId) {
      return { items: [] }
    }

    const result = await this.auditEventRepository.list({
      service: query.service,
      module: query.module,
      eventType: query.eventType,
      result: query.result,
      operatorId: query.operatorId,
      tenantId: query.tenantId,
      orgId: query.orgId,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      occurredAtFrom: query.occurredAtFrom ? new Date(query.occurredAtFrom) : undefined,
      occurredAtTo: query.occurredAtTo ? new Date(query.occurredAtTo) : undefined,
      cursor: query.cursor,
      pageSize: query.pageSize ?? 20
    })

    return toView(result)
  }
}

// This function maps repository results into the public audit query view.
function toView(result: ListAuditEventsOutput): ListAuditEventsView {
  return {
    items: result.items.map((event) => ({
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
    })),
    nextCursor: result.nextCursor
  }
}

// This function short-circuits filters that contradict the fixed semantics of the permission audit sample.
function isFixedValueRejected(input: string | undefined, expected: string): boolean {
  return typeof input === 'string' && input.length > 0 && input !== expected
}
