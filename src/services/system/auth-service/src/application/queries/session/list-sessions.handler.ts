import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { REPO } from 'src/common/constants'
import { IUserSessionRepository } from 'src/domain/repositories/user-session.repository'
import { ListSessionsQuery } from './list-sessions.query'

export interface SessionViewResult {
  sessionId: string
  userId: string
  accountId: string
  tenantId: string
  status: string
  deviceId: string
  deviceName: string
  userAgent: string
  ipAddress: string
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
  refreshExpiresAt: Date
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

    return sessions
      .sort((left, right) => {
        return right.getLastActiveAt().getTime() - left.getLastActiveAt().getTime()
      })
      .map((session) => ({
        sessionId: session.getId(),
        userId: session.getUserId(),
        accountId: session.getAccountId(),
        tenantId: String(session.getMetadata()?.tenantId ?? ''),
        status: String(session.getStatus()),
        deviceId: session.getDeviceInfo().deviceId,
        deviceName: session.getDeviceInfo().deviceName,
        userAgent: session.getDeviceInfo().userAgent,
        ipAddress: session.getDeviceInfo().ipAddress,
        createdAt: session.getCreatedAt(),
        lastActiveAt: session.getLastActiveAt(),
        expiresAt: session.getExpiresAt(),
        refreshExpiresAt: session.getRefreshExpiresAt(),
        isCurrent: session.getId() === query.currentSessionId,
        isAdminControlled: session.isAdminControlled()
      }))
  }
}
