import { ACCESS_DENIED } from '@oes/common/exceptions'
import { SessionStatus } from '@oes/common/constants'
import { CheckResourceService } from '../../authorization'
import { Session } from '../../../domain/aggregates/usersession.aggregate'
import { AuthAuditService } from '../../services/auth-audit.service'
import { AdminRevokeSessionCommand } from './admin-revoke-session.command'
import { AdminRevokeSessionHandler } from './admin-revoke-session.handler'

// Creates session fixtures with tenant metadata for admin revoke resource checks.
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
      tenantId: input.tenantId,
      loginMethod: 'EMAIL_PASSWORD'
    },
    isAdminControlled: false
  })
}

describe('AdminRevokeSessionHandler', () => {
  it('rejects admin session revocation outside the operator tenant boundary', async () => {
    const sessionRepository = {
      findById: jest.fn().mockResolvedValue(
        createSessionFixture({
          id: 'a652d74f-1b04-43ef-9b0b-aaee1f4e19d3',
          userId: 'user-1',
          accountId: 'account-1',
          tenantId: 'tenant-b'
        })
      ),
      adminRevokeSession: jest.fn()
    } as any
    const authAuditService = {
      emitAdminSessionRevoked: jest.fn()
    } as unknown as AuthAuditService
    const handler = new AdminRevokeSessionHandler(
      sessionRepository,
      authAuditService,
      new CheckResourceService()
    )

    await expect(
      handler.execute(
        new AdminRevokeSessionCommand(
          'a43ee2be-6c2d-41d0-b523-5104f83ddc63',
          'a652d74f-1b04-43ef-9b0b-aaee1f4e19d3',
          'Suspicious access',
          {
            operatorId: 'a43ee2be-6c2d-41d0-b523-5104f83ddc63',
            tenantId: 'tenant-a',
            isSystemScope: false
          }
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code
      })
    })

    expect(sessionRepository.adminRevokeSession).not.toHaveBeenCalled()
    expect(authAuditService.emitAdminSessionRevoked).not.toHaveBeenCalled()
  })
})
