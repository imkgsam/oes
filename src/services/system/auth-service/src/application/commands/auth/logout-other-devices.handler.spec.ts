import { SessionStatus } from '@oes/common/constants'
import { Session } from '../../../domain/aggregates/usersession.aggregate'
import { AuthAuditService } from '../../services/auth-audit.service'
import { LogoutOtherDevicesCommand } from './logout-other-devices.command'
import { LogoutOtherDevicesHandler } from './logout-other-devices.handler'

// Creates session fixtures for validating current-account-only self-service cleanup.
function createSessionFixture(input: {
  id: string
  userId: string
  accountId: string
  tenantId: string
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
    lastActiveAt: '2026-04-08T12:00:00.000Z',
    expiresAt: '2026-04-10T00:00:00.000Z',
    refreshExpiresAt: '2026-04-11T00:00:00.000Z',
    metadata: {
      loginMethod: 'email-password'
    },
    isAdminControlled: false
  })
}

describe('LogoutOtherDevicesHandler', () => {
  it('kicks only other sessions from the current account', async () => {
    const currentSession = createSessionFixture({
      id: 'session-current',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1'
    })
    const sameAccountSession = createSessionFixture({
      id: 'session-same-account',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1'
    })
    const otherAccountSession = createSessionFixture({
      id: 'session-other-account',
      userId: 'user-1',
      accountId: 'account-2',
      tenantId: 'tenant-2'
    })

    const sessionRepository = {
      findAllByUserId: jest.fn().mockResolvedValue([
        currentSession,
        sameAccountSession,
        otherAccountSession
      ]),
      findById: jest.fn().mockResolvedValue(currentSession),
      kickOtherDevices: jest.fn()
    } as any
    const authAuditService = {
      emitLogoutOtherDevicesSucceeded: jest.fn()
    } as unknown as AuthAuditService
    const handler = new LogoutOtherDevicesHandler(sessionRepository, authAuditService)

    const result = await handler.execute(
      new LogoutOtherDevicesCommand('user-1', 'session-current')
    )

    expect(result).toEqual({ success: true, sessionCount: 1 })
    expect(sessionRepository.kickOtherDevices).toHaveBeenCalledWith(
      'user-1',
      'account-1',
      'session-current'
    )
    expect(authAuditService.emitLogoutOtherDevicesSucceeded).toHaveBeenCalledWith(
      'user-1',
      currentSession,
      1,
      ['session-same-account']
    )
  })
})
