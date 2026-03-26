import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { REPO } from 'src/common/constants'
import { IUserSessionRepository } from 'src/domain/repositories/user-session.repository'
import { AdminListUserSessionsQuery } from './admin-list-user-sessions.query'

export interface AdminSessionViewResult {
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
  isAdminControlled: boolean
  adminRevokeReason: string
  adminRevokeAt: Date | null
  adminRevokeBy: string
}

@QueryHandler(AdminListUserSessionsQuery)
export class AdminListUserSessionsHandler
  implements IQueryHandler<AdminListUserSessionsQuery, AdminSessionViewResult[]>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository
  ) {}

  async execute(query: AdminListUserSessionsQuery): Promise<AdminSessionViewResult[]> {
    const sessions = await this.sessionRepository.findAllByUserId(query.userId)

    return sessions
      .sort((left, right) => right.getLastActiveAt().getTime() - left.getLastActiveAt().getTime())
      .map((session) => {
        const adminInfo = session.getAdminRevokeInfo()

        return {
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
          isAdminControlled: session.isAdminControlled(),
          adminRevokeReason: adminInfo.reason ?? '',
          adminRevokeAt: adminInfo.revokedAt ?? null,
          adminRevokeBy: adminInfo.revokedBy ?? ''
        }
      })
  }
}
