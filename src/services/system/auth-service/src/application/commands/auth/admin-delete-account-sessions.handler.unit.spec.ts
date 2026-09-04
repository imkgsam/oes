import { ACCESS_DENIED } from '@oes/common/exceptions'
import { SessionStatus } from '@oes/common/constants'
import { CheckResourceService } from '../../authorization'
import { Session } from '../../../domain/aggregates/usersession.aggregate'
import { AuthAuditService } from '../../services/auth-audit.service'
import { AdminDeleteAccountSessionsCommand } from './admin-delete-account-sessions.command'
import { AdminDeleteAccountSessionsHandler } from './admin-delete-account-sessions.handler'

// Creates session fixtures with tenant metadata for account-scoped admin session cleanup tests.
function createSessionFixture(input: {
  id: string
  userId: string
  accountId: string
  tenantId?: string | null
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
    lastActiveAt: '2026-04-08T12:00:00.000Z',
    expiresAt: '2026-04-10T00:00:00.000Z',
    refreshExpiresAt: '2026-04-11T00:00:00.000Z',
    metadata: {
      tenantId: input.tenantId ?? undefined,
      loginMethod: 'EMAIL_PASSWORD'
    },
    isAdminControlled: false
  })
}

describe('AdminDeleteAccountSessionsHandler', () => {
  it('deletes only sessions that belong to the disabled account and emits audit entries', async () => {
    const targetSession = createSessionFixture({
      id: 'session-target-1',
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-a'
    })
    const otherSession = createSessionFixture({
      id: 'session-other-1',
      userId: 'user-1',
      accountId: 'account-2',
      tenantId: 'tenant-a'
    })
    const sessionRepository = {
      findAllByUserId: jest.fn().mockResolvedValue([targetSession, otherSession]),
      delete: jest.fn().mockResolvedValue(undefined)
    } as any
    const authAuditService = {
      emitAdminSessionRevoked: jest.fn()
    } as unknown as AuthAuditService

    const handler = new AdminDeleteAccountSessionsHandler(
      sessionRepository,
      authAuditService,
      new CheckResourceService()
    )

    await expect(
      handler.execute(
        new AdminDeleteAccountSessionsCommand('operator-1', 'user-1', 'account-1', 'ACCOUNT_DISABLED', {
          operatorId: 'operator-1',
          tenantId: 'tenant-a',
          isSystemScope: false
        })
      )
    ).resolves.toEqual({
      success: true,
      deletedSessionCount: 1
    })

    expect(sessionRepository.delete).toHaveBeenCalledTimes(1)
    expect(sessionRepository.delete).toHaveBeenCalledWith('session-target-1')
    expect(authAuditService.emitAdminSessionRevoked).toHaveBeenCalledWith(
      'operator-1',
      targetSession,
      'ACCOUNT_DISABLED'
    )
  })

  it('rejects cleanup when the target account sessions are outside the operator tenant boundary', async () => {
    const sessionRepository = {
      findAllByUserId: jest.fn().mockResolvedValue([
        createSessionFixture({
          id: 'session-target-1',
          userId: 'user-1',
          accountId: 'account-1',
          tenantId: 'tenant-b'
        })
      ]),
      delete: jest.fn()
    } as any
    const authAuditService = {
      emitAdminSessionRevoked: jest.fn()
    } as unknown as AuthAuditService

    const handler = new AdminDeleteAccountSessionsHandler(
      sessionRepository,
      authAuditService,
      new CheckResourceService()
    )

    await expect(
      handler.execute(
        new AdminDeleteAccountSessionsCommand('operator-1', 'user-1', 'account-1', 'ACCOUNT_DISABLED', {
          operatorId: 'operator-1',
          tenantId: 'tenant-a',
          isSystemScope: false
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code
      })
    })

    expect(sessionRepository.delete).not.toHaveBeenCalled()
    expect(authAuditService.emitAdminSessionRevoked).not.toHaveBeenCalled()
  })
})
