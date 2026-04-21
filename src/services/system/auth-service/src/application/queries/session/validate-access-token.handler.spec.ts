import { CommonJwtService } from '@oes/common/auth'
import { SessionStatus } from '@oes/common/constants'
import { Session } from '../../../domain/aggregates/usersession.aggregate'
import { ValidateAccessTokenHandler } from './validate-access-token.handler'
import { ValidateAccessTokenQuery } from './validate-access-token.query'

// Creates session fixtures that mirror persisted session truth for access-token validation tests.
function createSessionFixture(input: {
  id: string
  userId: string
  accountId: string
  tenantId?: string
  scopeLevel?: 'SYSTEM' | 'TENANT'
  status?: SessionStatus
  expiresAt?: string
}): Session {
  return Session.fromRedis({
    id: input.id,
    userId: input.userId,
    accountId: input.accountId,
    scopeLevel: input.scopeLevel ?? 'TENANT',
    tenantId: input.tenantId,
    refreshToken: `${input.id}-refresh`,
    status: input.status ?? SessionStatus.ACTIVE,
    deviceInfo: {
      deviceId: `${input.id}-device`,
      deviceName: `${input.id}-device-name`,
      userAgent: 'jest',
      ipAddress: '127.0.0.1'
    },
    createdAt: '2026-04-08T00:00:00.000Z',
    lastActiveAt: '2026-04-08T12:00:00.000Z',
    expiresAt: input.expiresAt ?? '2099-04-10T00:00:00.000Z',
    refreshExpiresAt: '2099-04-11T00:00:00.000Z',
    metadata: {
      loginMethod: 'email-password'
    },
    isAdminControlled: false
  })
}

describe('ValidateAccessTokenHandler', () => {
  it('accepts active access tokens that still point at a live session', async () => {
    const session = createSessionFixture({
      id: 'session-1',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1'
    })
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'user-1',
        aid: 'account-1',
        tid: 'tenant-1',
        sid: 'session-1',
        scopeLevel: 'TENANT',
        passwordSetupRequired: true,
        roles: ['role-1'],
        tokenType: 'access'
      })
    } as unknown as CommonJwtService
    const sessionRepository = {
      findById: jest.fn().mockResolvedValue(session)
    } as any
    const handler = new ValidateAccessTokenHandler(jwtService, sessionRepository)

    await expect(handler.execute(new ValidateAccessTokenQuery('token-1'))).resolves.toEqual({
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      sessionId: 'session-1',
      scopeLevel: 'TENANT',
      passwordSetupRequired: true,
      roleIds: ['role-1']
    })
  })

  it('rejects tokens whose session has already been removed', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'user-1',
        aid: 'account-1',
        tid: 'tenant-1',
        sid: 'session-revoked',
        scopeLevel: 'TENANT',
        roles: ['role-1'],
        tokenType: 'access'
      })
    } as unknown as CommonJwtService
    const sessionRepository = {
      findById: jest.fn().mockResolvedValue(null)
    } as any
    const handler = new ValidateAccessTokenHandler(jwtService, sessionRepository)

    await expect(handler.execute(new ValidateAccessTokenQuery('token-1'))).rejects.toBeDefined()
  })
})
