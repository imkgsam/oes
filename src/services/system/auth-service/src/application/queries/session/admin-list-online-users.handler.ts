import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { REPO } from '../../../common/constants'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { AdminListOnlineUsersQuery } from './admin-list-online-users.query'

export interface AdminOnlineUserViewResult {
  userId: string
  tenantId: string
  activeSessionCount: number
  lastActiveAt: Date
}

// Aggregates active sessions into scope-aware online-user summaries for the admin overview page.
@QueryHandler(AdminListOnlineUsersQuery)
export class AdminListOnlineUsersHandler
  implements
    IQueryHandler<AdminListOnlineUsersQuery, { items: AdminOnlineUserViewResult[]; nextCursor?: string }>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(
    query: AdminListOnlineUsersQuery
  ): Promise<{ items: AdminOnlineUserViewResult[]; nextCursor?: string }> {
    const queryScope = this.authorizationQueryScopeService.build<TenantQueryScope>({
      resource: 'admin_user_session',
      action: 'list',
      operatorScope: query.operatorScope
    })
    const effectiveTenantId = queryScope.tenantId ?? query.tenantId
    const sessions = await this.sessionRepository.findAllActive({
      tenantId: effectiveTenantId
    })
    const grouped = new Map<string, AdminOnlineUserViewResult>()

    for (const session of sessions) {
      const userId = session.getUserId()
      const tenantId = session.getTenantId() ?? ''
      const key = `${userId}:${tenantId}`
      const existing = grouped.get(key)

      if (!existing) {
        grouped.set(key, {
          userId,
          tenantId,
          activeSessionCount: 1,
          lastActiveAt: session.getLastActiveAt()
        })
        continue
      }

      existing.activeSessionCount += 1

      if (session.getLastActiveAt().getTime() > existing.lastActiveAt.getTime()) {
        existing.lastActiveAt = session.getLastActiveAt()
      }
    }

    return {
      items: [...grouped.values()].sort(
        (left, right) => right.lastActiveAt.getTime() - left.lastActiveAt.getTime()
      ),
      nextCursor: undefined
    }
  }
}
