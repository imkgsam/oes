import { SessionStatus } from '@oes/common/constants'
import { AuthorizationQueryScopeService } from '../../authorization'
import { AdminUserSessionQueryScopeBuilder } from '../../authorization/query-scope/builders/admin-user-session-query-scope.builder'
import { Session } from '../../../domain/aggregates/usersession.aggregate'
import { AdminListUserSessionsHandler } from './admin-list-user-sessions.handler'
import { AdminListUserSessionsQuery } from './admin-list-user-sessions.query'

// Creates a session aggregate fixture with the minimal auth metadata needed for tenant filtering tests.
function createSessionFixture(input: {
  id: string
  userId: string
  accountId: string
  tenantId: string
  lastActiveAt: string
}): Session {
  return Session.fromRedis({
    id: input.id,
    userId: input.userId,
    accountId: input.accountId,
    refreshToken: `${input.id}-refresh`,
    status: SessionStatus.ACTIVE,
    deviceInfo: {
      deviceId: `${input.id}-device`,
      deviceName: `${input.id}-device-name`,
      userAgent: 'jest',
      ipAddress: '127.0.0.1'
    },
    createdAt: '2026-04-08T00:00:00.000Z',
    lastActiveAt: input.lastActiveAt,
    expiresAt: '2026-04-10T00:00:00.000Z',
    refreshExpiresAt: '2026-04-11T00:00:00.000Z',
    metadata: {
      tenantId: input.tenantId,
      loginMethod: 'EMAIL_PASSWORD'
    },
    isAdminControlled: false
  })
}

describe('AdminListUserSessionsHandler', () => {
  it('passes the tenant-bound scope into the session repository', async () => {
    const sessionRepository = {
      findAllByUserId: jest.fn().mockResolvedValue([
        createSessionFixture({
          id: 'session-a',
          userId: 'user-1',
          accountId: 'account-a',
          tenantId: 'tenant-a',
          lastActiveAt: '2026-04-08T12:00:00.000Z'
        })
      ])
    } as any
    const handler = new AdminListUserSessionsHandler(
      sessionRepository,
      new AuthorizationQueryScopeService([new AdminUserSessionQueryScopeBuilder()])
    )

    const result = await handler.execute(
      new AdminListUserSessionsQuery('user-1', {
        operatorId: 'operator-1',
        tenantId: 'tenant-a',
        isSystemScope: false
      })
    )

    expect(result).toHaveLength(1)
    expect(sessionRepository.findAllByUserId).toHaveBeenCalledWith('user-1', {
      tenantId: 'tenant-a'
    })
    expect(result[0]).toEqual(
      expect.objectContaining({
        sessionId: 'session-a',
        tenantId: 'tenant-a'
      })
    )
  })
})
