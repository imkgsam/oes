import { SessionStatus } from '@oes/common/constants'
import { Session } from '../../../domain/aggregates/usersession.aggregate'
import { AuthAuditService } from '../../services/auth-audit.service'
import { LogoutSessionCommand } from './logout-session.command'
import { LogoutSessionHandler } from './logout-session.handler'

// Creates session fixtures for validating account-scoped single-session logout behavior.
function createSessionFixture(input: {
  id: string
  userId: string
  accountId: string
  tenantId?: string
  status?: SessionStatus
}): Session {
  return Session.fromRedis({
    id: input.id,
    userId: input.userId,
    accountId: input.accountId,
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
    expiresAt: '2026-04-10T00:00:00.000Z',
    refreshExpiresAt: '2026-04-11T00:00:00.000Z',
    metadata: {
      loginMethod: 'email-password'
    },
    isAdminControlled: false
  })
}

describe('LogoutSessionHandler', () => {
  it('removes one other active session from the current account', async () => {
    const currentSession = createSessionFixture({
      id: 'session-current',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1'
    })
    const targetSession = createSessionFixture({
      id: 'session-target',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1'
    })

    const sessionRepository = {
      findById: jest.fn().mockImplementation(async (sessionId: string) => {
        if (sessionId === 'session-current') {
          return currentSession
        }
        if (sessionId === 'session-target') {
          return targetSession
        }

        return null
      }),
      delete: jest.fn().mockResolvedValue(undefined)
    } as any
    const authAuditService = {
      emitLogoutSucceeded: jest.fn()
    } as unknown as AuthAuditService
    const handler = new LogoutSessionHandler(sessionRepository, authAuditService)

    const result = await handler.execute(
      new LogoutSessionCommand('user-1', 'session-current', 'session-target')
    )

    expect(result).toEqual({ success: true })
    expect(sessionRepository.findById).toHaveBeenCalledWith('session-current')
    expect(sessionRepository.findById).toHaveBeenCalledWith('session-target')
    expect(sessionRepository.delete).toHaveBeenCalledWith('session-target')
    expect(authAuditService.emitLogoutSucceeded).toHaveBeenCalledWith(targetSession)
  })

  it('rejects targeting the current session', async () => {
    const currentSession = createSessionFixture({
      id: 'session-current',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1'
    })

    const sessionRepository = {
      findById: jest.fn().mockResolvedValue(currentSession),
      delete: jest.fn().mockResolvedValue(undefined)
    } as any
    const authAuditService = {
      emitLogoutSucceeded: jest.fn()
    } as unknown as AuthAuditService
    const handler = new LogoutSessionHandler(sessionRepository, authAuditService)

    await expect(
      handler.execute(new LogoutSessionCommand('user-1', 'session-current', 'session-current'))
    ).rejects.toBeDefined()

    expect(sessionRepository.delete).not.toHaveBeenCalled()
    expect(authAuditService.emitLogoutSucceeded).not.toHaveBeenCalled()
  })

  it('rejects sessions outside the current account scope', async () => {
    const currentSession = createSessionFixture({
      id: 'session-current',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1'
    })
    const targetSession = createSessionFixture({
      id: 'session-target',
      userId: 'user-1',
      accountId: 'account-2',
      tenantId: 'tenant-2'
    })

    const sessionRepository = {
      findById: jest.fn().mockImplementation(async (sessionId: string) => {
        if (sessionId === 'session-current') {
          return currentSession
        }
        if (sessionId === 'session-target') {
          return targetSession
        }

        return null
      }),
      delete: jest.fn().mockResolvedValue(undefined)
    } as any
    const authAuditService = {
      emitLogoutSucceeded: jest.fn()
    } as unknown as AuthAuditService
    const handler = new LogoutSessionHandler(sessionRepository, authAuditService)

    await expect(
      handler.execute(new LogoutSessionCommand('user-1', 'session-current', 'session-target'))
    ).rejects.toBeDefined()

    expect(sessionRepository.delete).not.toHaveBeenCalled()
    expect(authAuditService.emitLogoutSucceeded).not.toHaveBeenCalled()
  })
})
