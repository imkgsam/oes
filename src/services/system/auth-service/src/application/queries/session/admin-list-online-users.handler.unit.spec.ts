import { SessionStatus } from '@oes/common/constants'
import { AuthorizationQueryScopeService } from '../../authorization'
import { AdminUserSessionQueryScopeBuilder } from '../../authorization/query-scope/builders/admin-user-session-query-scope.builder'
import { Session } from '../../../domain/aggregates/usersession.aggregate'
import { AdminListOnlineUsersHandler } from './admin-list-online-users.handler'
import { AdminListOnlineUsersQuery } from './admin-list-online-users.query'

// Creates a session aggregate fixture used to verify admin online-user grouping behavior.
function createSessionFixture(input: {
  id: string
  userId: string
  accountId: string
  tenantId?: string
  lastActiveAt: string
  status?: SessionStatus
}): Session {
  return Session.fromRedis({
    id: input.id,
    userId: input.userId,
    accountId: input.accountId,
    refreshToken: `${input.id}-refresh`,
    status: input.status ?? SessionStatus.ACTIVE,
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

describe('AdminListOnlineUsersHandler', () => {
  it('groups active sessions into online-user summaries within the tenant-bound scope', async () => {
    const sessionRepository = {
      findAllActive: jest.fn().mockResolvedValue([
        createSessionFixture({
          id: 'session-a',
          userId: 'user-1',
          accountId: 'account-a',
          tenantId: 'tenant-a',
          lastActiveAt: '2026-04-08T12:00:00.000Z'
        }),
        createSessionFixture({
          id: 'session-b',
          userId: 'user-1',
          accountId: 'account-b',
          tenantId: 'tenant-a',
          lastActiveAt: '2026-04-08T13:00:00.000Z'
        }),
        createSessionFixture({
          id: 'session-c',
          userId: 'user-2',
          accountId: 'account-c',
          tenantId: 'tenant-a',
          lastActiveAt: '2026-04-08T11:00:00.000Z'
        })
      ])
    } as any

    const handler = new AdminListOnlineUsersHandler(
      sessionRepository,
      new AuthorizationQueryScopeService([new AdminUserSessionQueryScopeBuilder()])
    )

    const result = await handler.execute(
      new AdminListOnlineUsersQuery(
        { tenantId: undefined },
        {
          operatorId: 'operator-1',
          tenantId: 'tenant-a',
          isSystemScope: false
        }
      )
    )

    expect(sessionRepository.findAllActive).toHaveBeenCalledWith({
      tenantId: 'tenant-a'
    })
    expect(result.items).toEqual([
      expect.objectContaining({
        userId: 'user-1',
        tenantId: 'tenant-a',
        activeSessionCount: 2,
        lastActiveAt: new Date('2026-04-08T13:00:00.000Z')
      }),
      expect.objectContaining({
        userId: 'user-2',
        tenantId: 'tenant-a',
        activeSessionCount: 1,
        lastActiveAt: new Date('2026-04-08T11:00:00.000Z')
      })
    ])
  })
})
