import { AdminSecurityUseCase } from './admin-security.use-case'

// Verifies the administrator auth-bff use case maps downstream admin session and audit responses into HTTP view models.
describe('AdminSecurityUseCase', () => {
  it('maps admin-visible sessions from the downstream auth adapter', async () => {
    const authAdapter = {
      adminListUserSessions: jest.fn().mockResolvedValue({
        sessions: [
          {
            sessionId: 'session-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            status: 'ACTIVE',
            loginMethod: 'EMAIL_PASSWORD',
            createdAt: '2026-04-09T10:00:00.000Z',
            lastActiveAt: '2026-04-09T10:10:00.000Z',
            expiresAt: '2026-04-09T11:00:00.000Z',
            refreshExpiresAt: '2026-04-10T10:00:00.000Z',
            accessRemainingSeconds: '300',
            refreshRemainingSeconds: '86400',
            sessionAgeSeconds: '600',
            idleSeconds: '30',
            isAccessExpired: false,
            isRefreshExpired: false,
            isRevoked: false,
            isAdminControlled: true,
            adminRevokeReason: 'Security incident'
          }
        ]
      })
    }

    const useCase = new AdminSecurityUseCase(authAdapter as any)
    const result = await useCase.listUserSessions('user-1', { user: { sub: 'operator-1' } })

    expect(authAdapter.adminListUserSessions).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ user: { sub: 'operator-1' } })
    )
    expect(result.sessions[0]).toEqual(
      expect.objectContaining({
        sessionId: 'session-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        isAdminControlled: true,
        adminRevokeReason: 'Security incident'
      })
    )
  })

  it('maps administrative auth audit records into the HTTP list view model', async () => {
    const authAdapter = {
      listAuditEvents: jest.fn().mockResolvedValue({
        items: [
          {
            eventId: 'audit-1',
            service: 'auth-service',
            eventType: 'SESSION_REVOKED',
            tenantId: 'tenant-1',
            detailsJson: '{"reason":"Security incident"}'
          }
        ],
        nextCursor: 'cursor-2'
      })
    }

    const useCase = new AdminSecurityUseCase(authAdapter as any)
    const result = await useCase.listAuditEvents(
      { tenantId: 'tenant-1', pageSize: 20 },
      { user: { sub: 'operator-1' } }
    )

    expect(authAdapter.listAuditEvents).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', pageSize: 20 }),
      expect.objectContaining({ user: { sub: 'operator-1' } })
    )
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          eventId: 'audit-1',
          service: 'auth-service',
          eventType: 'SESSION_REVOKED',
          tenantId: 'tenant-1'
        })
      ],
      nextCursor: 'cursor-2'
    })
  })
})
