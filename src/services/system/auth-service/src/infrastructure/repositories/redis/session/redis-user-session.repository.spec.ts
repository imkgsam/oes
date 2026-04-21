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

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: getMock,
    multi: multiMock
  }))
})

// Creates a persisted session fixture whose access TTL is shorter than its refresh TTL.
function createSessionFixture() {
  return Session.fromRedis({
    id: 'session-1',
    userId: 'user-1',
    accountId: 'account-1',
    refreshToken: 'refresh-token-1',
    status: SessionStatus.ACTIVE,
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
      scopeLevel: 'TENANT'
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
})
