import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { REPO } from '../../../common/constants'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { AdminListUserSessionsQuery } from './admin-list-user-sessions.query'

export interface AdminSessionViewResult {
  sessionId: string
  userId: string
  accountId: string
  tenantId: string
  status: string
  loginMethod: string
  deviceId: string
  deviceName: string
  userAgent: string
  ipAddress: string
  platform: string
  browser: string
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
  refreshExpiresAt: Date
  accessRemainingSeconds: number
  refreshRemainingSeconds: number
  sessionAgeSeconds: number
  idleSeconds: number
  isAccessExpired: boolean
  isRefreshExpired: boolean
  isRevoked: boolean
  isAdminControlled: boolean
  adminRevokeReason: string
  adminRevokeAt: Date | null
  adminRevokeBy: string
}

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
      .map((session) => {
        const adminInfo = session.getAdminRevokeInfo()

        return {
          sessionId: session.getId(),
          userId: session.getUserId(),
          accountId: session.getAccountId(),
          tenantId: session.getTenantId() ?? '',
          status: String(session.getStatus()),
          loginMethod: session.getLoginMethod(),
          deviceId: session.getDeviceInfo().deviceId,
          deviceName: session.getDeviceInfo().deviceName,
          userAgent: session.getDeviceInfo().userAgent,
          ipAddress: session.getDeviceInfo().ipAddress,
          platform: session.getDeviceInfo().platform ?? '',
          browser: session.getDeviceInfo().browser ?? '',
          createdAt: session.getCreatedAt(),
          lastActiveAt: session.getLastActiveAt(),
          expiresAt: session.getExpiresAt(),
          refreshExpiresAt: session.getRefreshExpiresAt(),
          accessRemainingSeconds: session.getRemainingTime(),
          refreshRemainingSeconds: session.getRefreshRemainingTime(),
          sessionAgeSeconds: session.getSessionAgeSeconds(),
          idleSeconds: session.getIdleSeconds(),
          isAccessExpired: session.isExpired(),
          isRefreshExpired: session.isRefreshExpired(),
          isRevoked: !session.isActive(),
          isAdminControlled: session.isAdminControlled(),
          adminRevokeReason: adminInfo.reason ?? '',
          adminRevokeAt: adminInfo.revokedAt ?? null,
          adminRevokeBy: adminInfo.revokedBy ?? ''
        }
      })
  }
}
