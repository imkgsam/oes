import { SessionStatus } from '@oes/common/constants'
import { Session } from '../../../domain/aggregates/usersession.aggregate'
import { ListSessionsHandler } from './list-sessions.handler'
import { ListSessionsQuery } from './list-sessions.query'

// Creates self-service session fixtures that expose account-scoped filtering behavior.
function createSessionFixture(input: {
  id: string
  userId: string
  accountId: string
  tenantId: string
  loginMethod?: string
  lastActiveAt: string
}): Session {
  return Session.fromRedis({
    id: input.id,
    userId: input.userId,
    accountId: input.accountId,
    tenantId: input.tenantId,
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
      loginMethod: input.loginMethod ?? 'email-password'
    },
    isAdminControlled: false
  })
}

describe('ListSessionsHandler', () => {
  it('returns only sessions that belong to the current account', async () => {
    const currentSession = createSessionFixture({
      id: 'session-current',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      lastActiveAt: '2026-04-08T12:10:00.000Z'
    })
    const sessionRepository = {
      findAllByUserId: jest.fn().mockResolvedValue([
        currentSession,
        createSessionFixture({
          id: 'session-same-account',
          userId: 'user-1',
          accountId: 'account-1',
          tenantId: 'tenant-1',
          lastActiveAt: '2026-04-08T12:05:00.000Z'
        }),
        createSessionFixture({
          id: 'session-other-account',
          userId: 'user-1',
          accountId: 'account-2',
          tenantId: 'tenant-2',
          lastActiveAt: '2026-04-08T12:00:00.000Z'
        })
      ]),
      findById: jest.fn().mockResolvedValue(currentSession)
    } as any

    const handler = new ListSessionsHandler(sessionRepository)

    const result = await handler.execute(new ListSessionsQuery('user-1', 'session-current'))

    expect(sessionRepository.findAllByUserId).toHaveBeenCalledWith('user-1')
    expect(sessionRepository.findById).toHaveBeenCalledWith('session-current')
    expect(result).toHaveLength(2)
    expect(result.map((session) => session.accountId)).toEqual(['account-1', 'account-1'])
    expect(result.some((session) => session.sessionId === 'session-other-account')).toBe(false)
  })
})
