import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { REPO } from '../../../common/constants'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { ListSessionsQuery } from './list-sessions.query'

export interface SessionViewResult {
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
  isCurrent: boolean
  isAdminControlled: boolean
}

@QueryHandler(ListSessionsQuery)
export class ListSessionsHandler
  implements IQueryHandler<ListSessionsQuery, SessionViewResult[]>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository
  ) {}

  async execute(query: ListSessionsQuery): Promise<SessionViewResult[]> {
    const sessions = await this.sessionRepository.findAllByUserId(query.userId)
    const currentSession = query.currentSessionId
      ? await this.sessionRepository.findById(query.currentSessionId)
      : null
    const currentAccountId = currentSession?.getAccountId() ?? query.currentAccountId

    return sessions
      .filter((session) => !currentAccountId || session.getAccountId() === currentAccountId)
      .sort((left, right) => {
        return right.getLastActiveAt().getTime() - left.getLastActiveAt().getTime()
      })
      .map((session) => ({
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
        isCurrent: session.getId() === query.currentSessionId,
        isAdminControlled: session.isAdminControlled()
      }))
  }
}
