import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { REPO } from '../../../common/constants'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { AdminListUserSessionsQuery } from './admin-list-user-sessions.query'
import { AdminSessionViewResult, toAdminSessionView } from './admin-session-view.mapper'

@QueryHandler(AdminListUserSessionsQuery)
// Lists the sessions that remain visible after applying the admin operator query scope.
export class AdminListUserSessionsHandler
  implements IQueryHandler<AdminListUserSessionsQuery, AdminSessionViewResult[]>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: AdminListUserSessionsQuery): Promise<AdminSessionViewResult[]> {
    const queryScope = this.authorizationQueryScopeService.build<TenantQueryScope>({
      resource: 'admin_user_session',
      action: 'list',
      operatorScope: query.operatorScope
    })

    const sessions = await this.sessionRepository.findAllByUserId(query.userId, {
      tenantId: queryScope.tenantId
    })

    return sessions
      .sort((left, right) => right.getLastActiveAt().getTime() - left.getLastActiveAt().getTime())
      .map(toAdminSessionView)
  }
}
