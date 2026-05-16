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
            terminal: 'PDA',
            terminalDeviceId: 'terminal-device-1',
            deviceBoundTenantId: 'tenant-1',
            loginFlow: 'EMPLOYEE_CODE_PIN',
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
        terminal: 'PDA',
        loginFlow: 'EMPLOYEE_CODE_PIN',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-1',
        accountSummary: { accountId: 'account-1' },
        tenantSummary: { tenantId: 'tenant-1' },
        terminalDeviceSummary: {
          terminalDeviceId: 'terminal-device-1',
          deviceBoundTenantId: 'tenant-1'
        },
        isCurrent: true
      })
    )
  })

  it('lists trusted devices inside the current tenant self-security scope', async () => {
    const authAdapter = {
      listTrustedDevices: jest.fn().mockResolvedValue({
        devices: [
          {
            id: 'trusted-1',
            deviceId: 'device-1',
            deviceName: 'Firefox on macOS',
            browser: 'Firefox',
            platform: 'macOS',
            trustedAt: '2026-04-22T08:00:00.000Z',
            lastActiveAt: '2026-04-22T09:00:00.000Z',
            expiresAt: '2026-05-22T08:00:00.000Z',
            isCurrentDevice: false
          }
        ]
      })
    }
    const useCase = new SessionSelfServiceUseCase(authAdapter as any)

    const result = await useCase.listTrustedDevices({
      user: { sub: 'user-1', tid: 'tenant-1', sid: 'session-1' }
    } as any)

    expect(authAdapter.listTrustedDevices).toHaveBeenCalledWith(
      'user-1',
      'TENANT',
      'tenant-1',
      undefined,
      expect.objectContaining({ user: { sub: 'user-1', tid: 'tenant-1', sid: 'session-1' } })
    )
    expect(result).toEqual({
      devices: [
        {
          id: 'trusted-1',
          deviceId: 'device-1',
          deviceName: 'Firefox on macOS',
          browser: 'Firefox',
          platform: 'macOS',
          trustedAt: '2026-04-22T08:00:00.000Z',
          lastActiveAt: '2026-04-22T09:00:00.000Z',
          expiresAt: '2026-05-22T08:00:00.000Z',
          isCurrentDevice: false
        }
      ]
    })
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

  it('routes self login-method enablement through the dedicated self-service adapter path', async () => {
    const authAdapter = {
      setOwnLoginMethodEnabled: jest.fn().mockResolvedValue({
        success: true,
        loginMethod: {
          methodId: 'method-email:PASSWORD',
          userId: 'user-1',
          type: 'EMAIL',
          identifier: 'alice@example.com',
          maskedIdentifier: 'a***@example.com',
          verified: true,
          enabled: false,
          hasPassword: true,
          createdAt: '2026-04-20T00:00:00.000Z',
          updatedAt: '2026-04-20T00:00:00.000Z'
        }
      }),
      setLoginMethodEnabled: jest.fn().mockResolvedValue({
        success: true,
        loginMethod: {
          methodId: 'method-email:PASSWORD',
          userId: 'user-1',
          type: 'EMAIL',
          identifier: 'alice@example.com',
          maskedIdentifier: 'a***@example.com',
          verified: true,
          enabled: false,
          hasPassword: true,
          createdAt: '2026-04-20T00:00:00.000Z',
          updatedAt: '2026-04-20T00:00:00.000Z'
        }
      })
    }
    const useCase = new SessionSelfServiceUseCase(authAdapter as any)
    const source = {
      user: { userId: 'user-1', sid: 'session-1', aid: 'account-1' }
    } as any

    const result = await useCase.setLoginMethodEnabled('method-email:PASSWORD', false, source)

    expect(authAdapter.setOwnLoginMethodEnabled).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        methodId: 'method-email:PASSWORD',
        enabled: false
      },
      expect.objectContaining({ user: { userId: 'user-1', sid: 'session-1', aid: 'account-1' } })
    )
    expect(authAdapter.setLoginMethodEnabled).not.toHaveBeenCalled()
    expect(result).toEqual({
      success: true,
      loginMethod: expect.objectContaining({
        methodId: 'method-email:PASSWORD',
        enabled: false
      })
    })
  })

  it('forwards account tenant context and step-up grant when changing the current user password', async () => {
    const authAdapter = {
      changeOwnPassword: jest.fn().mockResolvedValue({
        success: true,
        passwordSetupRequired: false
      })
    }
    const useCase = new SessionSelfServiceUseCase(authAdapter as any)

    const result = await useCase.changeOwnPassword(
      {
        currentPassword: 'OldSecret123!',
        newPassword: 'NewSecret123!',
        mfaGrantToken: 'step-up-grant-1'
      } as any,
      {
        user: {
          aid: 'account-1',
          tid: 'tenant-1',
          sid: 'session-1',
          sub: 'user-1'
        }
      } as any
    )

    expect(authAdapter.changeOwnPassword).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        currentPassword: 'OldSecret123!',
        newPassword: 'NewSecret123!',
        mfaGrantToken: 'step-up-grant-1'
      },
      expect.objectContaining({
        user: expect.objectContaining({
          aid: 'account-1',
          tid: 'tenant-1',
          sid: 'session-1',
          sub: 'user-1'
        })
      })
    )
    expect(result).toEqual({
      success: true,
      passwordSetupRequired: false
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

  it('revokes one trusted device inside the current tenant scope', async () => {
    const authAdapter = {
      revokeTrustedDevice: jest.fn().mockResolvedValue({
        success: true,
        deviceCount: '1'
      })
    }
    const useCase = new SessionSelfServiceUseCase(authAdapter as any)

    const result = await useCase.revokeTrustedDevice('trusted-1', {
      user: { sub: 'user-1', tid: 'tenant-1', sid: 'session-1' }
    } as any)

    expect(authAdapter.revokeTrustedDevice).toHaveBeenCalledWith(
      'user-1',
      'TENANT',
      'tenant-1',
      'trusted-1',
      expect.objectContaining({ user: { sub: 'user-1', tid: 'tenant-1', sid: 'session-1' } })
    )
    expect(result).toEqual({
      success: true,
      deviceCount: 1
    })
  })

  it('revokes other trusted devices while keeping the current-device slot reserved for later comparison', async () => {
    const authAdapter = {
      revokeOtherTrustedDevices: jest.fn().mockResolvedValue({
        success: true,
        deviceCount: '2'
      })
    }
    const useCase = new SessionSelfServiceUseCase(authAdapter as any)

    const result = await useCase.revokeOtherTrustedDevices({
      user: { sub: 'user-1', tid: 'tenant-1', sid: 'session-1' }
    } as any)

    expect(authAdapter.revokeOtherTrustedDevices).toHaveBeenCalledWith(
      'user-1',
      'TENANT',
      'tenant-1',
      undefined,
      expect.objectContaining({ user: { sub: 'user-1', tid: 'tenant-1', sid: 'session-1' } })
    )
    expect(result).toEqual({
      success: true,
      deviceCount: 2
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
