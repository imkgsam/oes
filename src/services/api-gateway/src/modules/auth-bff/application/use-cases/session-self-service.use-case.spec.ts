import { UnauthorizedException } from '@nestjs/common'
import { SessionSelfServiceUseCase } from './session-self-service.use-case'

describe('SessionSelfServiceUseCase', () => {
  it('derives the current user and session from JWT context when listing sessions', async () => {
    const authAdapter = {
      listSessions: jest.fn().mockResolvedValue({
        sessions: [
          {
            sessionId: 'session-1',
            accountId: 'account-1',
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
            isCurrent: true,
            isAdminControlled: false
          }
        ]
      })
    }

    const useCase = new SessionSelfServiceUseCase(authAdapter as any)
    const result = await useCase.listSessions({
      user: { userId: 'user-1', sid: 'session-1' }
    })

    expect(authAdapter.listSessions).toHaveBeenCalledWith(
      'user-1',
      'session-1',
      expect.objectContaining({ user: { userId: 'user-1', sid: 'session-1' } })
    )
    expect(result.sessions[0]).toEqual(
      expect.objectContaining({
        sessionId: 'session-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        isCurrent: true
      })
    )
  })

  it('rejects logout when the JWT does not carry a current session id', async () => {
    const useCase = new SessionSelfServiceUseCase({} as any)

    await expect(
      useCase.logout({
        user: { userId: 'user-1' }
      })
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
