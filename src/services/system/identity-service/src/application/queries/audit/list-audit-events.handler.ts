import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { SYMBOLS } from '../../../common/constants'
import { AuditEventEntity } from '../../../domain/entities/audit-event.entity'
import {
  AuditEventRepository,
  ListAuditEventsOutput
} from '../../../domain/repositories/audit-event.repository'
import { ListAuditEventsView } from './audit-query.result'
import { ListAuditEventsQuery } from './list-audit-events.query'

@QueryHandler(ListAuditEventsQuery)
export class ListAuditEventsHandler
  implements IQueryHandler<ListAuditEventsQuery, ListAuditEventsView>
{
  constructor(
    @Inject(SYMBOLS.REPO.AUDIT_EVENT)
    private readonly auditEventRepository: AuditEventRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: ListAuditEventsQuery): Promise<ListAuditEventsView> {
    const queryScope = this.authorizationQueryScopeService.build<TenantQueryScope>({
      resource: 'audit_event',
      action: 'list',
      operatorScope: query.operatorScope
    })

    const result = await this.auditEventRepository.list({
      service: query.service,
      module: query.module,
      eventType: query.eventType,
      result: query.result,
      operatorId: query.operatorId,
      tenantId: queryScope.tenantId ?? query.tenantId,
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

function toView(result: ListAuditEventsOutput): ListAuditEventsView {
  return {
    items: result.items.map(toAuditEventView),
    nextCursor: result.nextCursor
  }
}

function toAuditEventView(event: AuditEventEntity) {
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
