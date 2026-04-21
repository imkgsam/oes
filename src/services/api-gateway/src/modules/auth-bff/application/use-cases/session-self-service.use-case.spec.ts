import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { SessionSelfServiceUseCase } from './session-self-service.use-case'

describe('SessionSelfServiceUseCase', () => {
  it('derives the current user and forwards self login-history filters to auth-service', async () => {
    const authAdapter = {
      listLoginHistory: jest.fn().mockResolvedValue({
        items: [
          {
            occurredAt: '2026-04-12T12:00:00.000Z',
            outcome: 'FAILED',
            loginMethod: 'EMAIL_PASSWORD',
            ipAddress: '127.0.0.1',
            deviceName: 'MacBook Pro',
            platform: 'macOS',
            browser: 'Firefox',
            failureReason: 'INVALID_CREDENTIALS',
            traceId: 'trace-login-1'
          }
        ],
        nextCursor: 'cursor-login-1'
      })
    }
    const useCase = new SessionSelfServiceUseCase(authAdapter as any)

    const result = await useCase.listLoginHistory(
      {
        result: 'FAILED',
        occurredAtFrom: '2026-04-12T00:00:00.000Z',
        occurredAtTo: '2026-04-13T00:00:00.000Z',
        pageSize: 10
      } as any,
      {
        user: { userId: 'user-1', sid: 'session-1' }
      } as any
    )

    expect(authAdapter.listLoginHistory).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        result: 'FAILED',
        occurredAtFrom: '2026-04-12T00:00:00.000Z',
        occurredAtTo: '2026-04-13T00:00:00.000Z',
        cursor: undefined,
        pageSize: 10
      },
      expect.objectContaining({ user: { userId: 'user-1', sid: 'session-1' } })
    )
    expect(result).toEqual({
      items: [
        {
          occurredAt: '2026-04-12T12:00:00.000Z',
          outcome: 'FAILED',
          loginMethod: 'EMAIL_PASSWORD',
          ipAddress: '127.0.0.1',
          deviceName: 'MacBook Pro',
          platform: 'macOS',
          browser: 'Firefox',
          failureReason: 'INVALID_CREDENTIALS',
          traceId: 'trace-login-1'
        }
      ],
      nextCursor: 'cursor-login-1'
    })
  })

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

  it('forwards the current session when logging out all devices so auth-service can scope by account', async () => {
    const authAdapter = {
      logoutAll: jest.fn().mockResolvedValue({
        success: true,
        sessionCount: '2'
      })
    }
    const useCase = new SessionSelfServiceUseCase(authAdapter as any)

    const result = await useCase.logoutAll({
      user: { userId: 'user-1', sid: 'session-1', aid: 'account-1' }
    } as any)

    expect(authAdapter.logoutAll).toHaveBeenCalledWith(
      'user-1',
      'session-1',
      expect.objectContaining({ user: { userId: 'user-1', sid: 'session-1', aid: 'account-1' } })
    )
    expect(result).toEqual({
      success: true,
      sessionCount: 2
    })
  })

  it('forwards a target session id when logging out a single other session', async () => {
    const authAdapter = {
      logoutSession: jest.fn().mockResolvedValue({
        success: true
      })
    }
    const useCase = new SessionSelfServiceUseCase(authAdapter as any)

    const result = await useCase.logoutSession('session-target-1', {
      user: { userId: 'user-1', sid: 'session-current-1', aid: 'account-1' }
    } as any)

    expect(authAdapter.logoutSession).toHaveBeenCalledWith(
      'user-1',
      'session-current-1',
      'session-target-1',
      expect.objectContaining({ user: { userId: 'user-1', sid: 'session-current-1', aid: 'account-1' } })
    )
    expect(result).toEqual({
      success: true
    })
  })

  it('rejects logout when the target session matches the current session', async () => {
    const authAdapter = {
      logoutSession: jest.fn()
    }
    const useCase = new SessionSelfServiceUseCase(authAdapter as any)

    await expect(
      useCase.logoutSession('session-current-1', {
        user: { userId: 'user-1', sid: 'session-current-1' }
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(authAdapter.logoutSession).not.toHaveBeenCalled()
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
