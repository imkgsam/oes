import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { REPO } from '../../../common/constants'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { AdminListTerminalDeviceSessionsQuery } from './admin-list-terminal-device-sessions.query'
import { AdminSessionViewResult, toAdminSessionView } from './admin-session-view.mapper'

@QueryHandler(AdminListTerminalDeviceSessionsQuery)
// Lists active sessions bound to one managed terminal device under the admin operator scope.
export class AdminListTerminalDeviceSessionsHandler
  implements IQueryHandler<AdminListTerminalDeviceSessionsQuery, AdminSessionViewResult[]>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: AdminListTerminalDeviceSessionsQuery): Promise<AdminSessionViewResult[]> {
    const queryScope = this.authorizationQueryScopeService.build<TenantQueryScope>({
      resource: 'admin_user_session',
      action: 'list',
      operatorScope: query.operatorScope
    })
    const terminal = query.terminal?.trim()

    const sessions = await this.sessionRepository.findActiveByTerminalDeviceId(query.terminalDeviceId)

    return sessions
      .filter((session) => !queryScope.tenantId || session.getTenantId() === queryScope.tenantId)
      .filter((session) => !terminal || session.getTerminal() === terminal)
      .sort((left, right) => right.getLastActiveAt().getTime() - left.getLastActiveAt().getTime())
      .map(toAdminSessionView)
  }
}
