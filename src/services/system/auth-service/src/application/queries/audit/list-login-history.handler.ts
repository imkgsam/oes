import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { REPO } from '../../../common/constants'
import { AuthAuditRepository } from '../../../domain/repositories/auth-audit.repository'
import { ListLoginHistoryView, toLoginHistoryItemView } from './login-history-query.result'
import { ListLoginHistoryQuery } from './list-login-history.query'

@QueryHandler(ListLoginHistoryQuery)
/**
 * ListLoginHistoryHandler exposes one user's login attempt history from the local auth audit truth source.
 */
export class ListLoginHistoryHandler
  implements IQueryHandler<ListLoginHistoryQuery, ListLoginHistoryView>
{
  constructor(
    @Inject(REPO.AUDIT_EVENT)
    private readonly auditRepository: AuthAuditRepository
  ) {}

  /**
   * execute reads only login success and failure events for the requested authenticated user.
   */
  async execute(query: ListLoginHistoryQuery): Promise<ListLoginHistoryView> {
    const repositoryResult = await this.auditRepository.list({
      operatorId: query.userId,
      eventTypes: ['LOGIN_SUCCEEDED', 'LOGIN_FAILED', 'TERMINAL_ACCESS_DENIED'],
      result: this.toAuditResult(query.result),
      occurredAtFrom: query.occurredAtFrom ? new Date(query.occurredAtFrom) : undefined,
      occurredAtTo: query.occurredAtTo ? new Date(query.occurredAtTo) : undefined,
      cursor: query.cursor,
      pageSize: query.pageSize ?? 20
    })

    return {
      items: repositoryResult.items.map(toLoginHistoryItemView),
      nextCursor: repositoryResult.nextCursor
    }
  }

  /**
   * toAuditResult maps the self-service filter vocabulary onto the stored audit result codes.
   */
  private toAuditResult(result?: 'FAILED' | 'SUCCESS'): 'REJECTED' | 'SUCCEEDED' | undefined {
    if (result === 'FAILED') {
      return 'REJECTED'
    }
    if (result === 'SUCCESS') {
      return 'SUCCEEDED'
    }
    return undefined
  }
}
