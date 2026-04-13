import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { REPO } from '../../../common/constants'
import { AuthAuditRepository } from '../../../domain/repositories/auth-audit.repository'
import { ListAuditEventsView, toAuditEventView } from './audit-query.result'
import { ListAuditEventsQuery } from './list-audit-events.query'

@QueryHandler(ListAuditEventsQuery)
/**
 * ListAuditEventsHandler exposes auth-service local audit records through the shared audit query filters.
 */
export class ListAuditEventsHandler
  implements IQueryHandler<ListAuditEventsQuery, ListAuditEventsView>
{
  constructor(
    @Inject(REPO.AUDIT_EVENT)
    private readonly auditRepository: AuthAuditRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  /**
   * execute lists auth audit records using the shared filter set and cursor pagination.
   */
  async execute(query: ListAuditEventsQuery): Promise<ListAuditEventsView> {
    const queryScope = this.authorizationQueryScopeService.build<TenantQueryScope>({
      resource: 'audit_event',
      action: 'list',
      operatorScope: query.operatorScope,
      filters: {
        tenantId: query.tenantId
      }
    })

    const result = await this.auditRepository.list({
      service: query.service,
      module: query.module,
      eventType: query.eventType,
      result: query.result,
      operatorId: query.operatorId,
      tenantId: queryScope.tenantId,
      orgId: query.orgId,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      occurredAtFrom: query.occurredAtFrom ? new Date(query.occurredAtFrom) : undefined,
      occurredAtTo: query.occurredAtTo ? new Date(query.occurredAtTo) : undefined,
      cursor: query.cursor,
      pageSize: query.pageSize ?? 20
    })

    return {
      items: result.items.map(toAuditEventView),
      nextCursor: result.nextCursor
    }
  }
}
