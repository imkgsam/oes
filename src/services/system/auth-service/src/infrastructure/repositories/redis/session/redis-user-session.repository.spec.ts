import { Session } from '../../../../domain/aggregates/usersession.aggregate'
import { SessionStatus } from '../../../../common/constants'
import { RedisUserSessionRepository } from './redis-user-session.repository'

const execMock = jest.fn().mockResolvedValue([])
const expireMock = jest.fn().mockReturnThis()
const saddMock = jest.fn().mockReturnThis()
const setMock = jest.fn().mockReturnThis()
const sremMock = jest.fn().mockReturnThis()
const delMock = jest.fn().mockReturnThis()
const multiMock = jest.fn(() => ({
  del: delMock,
  exec: execMock,
  expire: expireMock,
  sadd: saddMock,
  set: setMock,
  srem: sremMock
}))
const getMock = jest.fn().mockResolvedValue(null)
const scanMock = jest.fn().mockResolvedValue(['0', []])

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: getMock,
    multi: multiMock,
    scan: scanMock
  }))
})

// Creates a persisted session fixture whose access TTL is shorter than its refresh TTL.
function createSessionFixture(input?: {
  id?: string
  tenantId?: string | null
  scopeLevel?: 'SYSTEM' | 'TENANT'
  status?: SessionStatus
}) {
  return Session.fromRedis({
    id: input?.id ?? 'session-1',
    userId: 'user-1',
    accountId: 'account-1',
    tenantId: input?.tenantId,
    refreshToken: 'refresh-token-1',
    status: input?.status ?? SessionStatus.ACTIVE,
    deviceInfo: {
      deviceId: 'device-1',
      deviceName: 'device-1',
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1'
    },
    createdAt: '2026-04-17T08:00:00.000Z',
    lastActiveAt: '2026-04-17T08:00:00.000Z',
    expiresAt: '2026-04-17T08:01:00.000Z',
    refreshExpiresAt: '2026-04-17T08:10:00.000Z',
    metadata: {
      loginMethod: 'EMAIL_PASSWORD',
      scopeLevel: input?.scopeLevel ?? 'TENANT'
    },
    isAdminControlled: false
  })
}

describe('RedisUserSessionRepository', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-17T08:00:00.000Z'))
    delMock.mockClear()
    execMock.mockClear()
    expireMock.mockClear()
    getMock.mockClear()
    multiMock.mockClear()
    saddMock.mockClear()
    scanMock.mockReset().mockResolvedValue(['0', []])
    setMock.mockClear()
    sremMock.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('keeps the persisted session alive until the refresh window ends', async () => {
    const repository = new RedisUserSessionRepository()
    const session = createSessionFixture()

    await repository.save(session)

    expect(expireMock).toHaveBeenCalledWith('session:session-1', 600)
    expect(expireMock).toHaveBeenCalledWith('refresh_token:refresh-token-1', 600)
  })

  it('deletes only active tenant-scope sessions for one tenant', async () => {
    const repository = new RedisUserSessionRepository()
    const targetSession = createSessionFixture({
      id: 'session-target',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
    const otherTenantSession = createSessionFixture({
      id: 'session-other-tenant',
      tenantId: 'tenant-2',
      scopeLevel: 'TENANT'
    })
    const systemSession = createSessionFixture({
      id: 'session-system',
      tenantId: null,
      scopeLevel: 'SYSTEM'
    })
    const suspendedSession = createSessionFixture({
      id: 'session-suspended',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      status: SessionStatus.SUSPENDED
    })
    const dataByKey = new Map<string, string>([
      ['session:session-target', JSON.stringify(targetSession.toRedis())],
      ['session:session-other-tenant', JSON.stringify(otherTenantSession.toRedis())],
      ['session:session-system', JSON.stringify(systemSession.toRedis())],
      ['session:session-suspended', JSON.stringify(suspendedSession.toRedis())]
    ])
    scanMock.mockResolvedValue([
      '0',
      [
        'session:session-target',
        'session:session-other-tenant',
        'session:session-system',
        'session:session-suspended'
      ]
    ])
    getMock.mockImplementation(async (key: string) => dataByKey.get(key) ?? null)

    await expect(repository.deleteActiveTenantScopeSessionsByTenantId('tenant-1')).resolves.toBe(1)

    expect(delMock).toHaveBeenCalledWith('session:session-target')
    expect(delMock).not.toHaveBeenCalledWith('session:session-other-tenant')
    expect(delMock).not.toHaveBeenCalledWith('session:session-system')
    expect(delMock).not.toHaveBeenCalledWith('session:session-suspended')
  })
})
