import { LoginMethodEnum } from '@oes/common/constants'
import { AccountSessionEstablishmentService } from './account-session-establishment.service'

describe('AccountSessionEstablishmentService', () => {
  it('audits and rejects when terminal access is denied before session issuance', async () => {
    const sessionRepository = {
      save: jest.fn(),
      findById: jest.fn()
    }
    const authAuditService = {
      emitLoginSucceeded: jest.fn(),
      emitTerminalAccessDenied: jest.fn()
    }
    const jwtService = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      signRefreshToken: jest.fn().mockReturnValue('refresh-token')
    }
    const service = new AccountSessionEstablishmentService(
      {
        getAccountAuthorizationSummary: jest.fn(),
        resolveAccountTerminalAccess: jest.fn().mockResolvedValue({
          allowed: false,
          reasonCode: 'TERMINAL_ACCESS_DENIED',
          effectiveAllowedTerminals: ['WEB'],
          resolutionSource: 'ROLE_UNION',
          matchedRoleIds: ['role-1']
        })
      } as any,
      {
        userRequiresPasswordSetup: jest.fn()
      } as any,
      {
        signAccessToken: jest.fn(),
        signRefreshToken: jest.fn()
      } as any,
      {
        get: jest.fn()
      } as any,
      sessionRepository as any,
      authAuditService as any,
      {
        rememberTrustedDevice: jest.fn()
      } as any,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any
    )

    await expect(
      service.establish({
        userId: 'user-1',
        account: {
          accountId: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'Tenant Account'
        },
        loginMethod: LoginMethodEnum.EmailPassword,
        terminal: 'PDA'
      } as any)
    ).rejects.toMatchObject({
      definition: {
        code: 'AUTH_TERMINAL_ACCESS_DENIED'
      }
    })

    expect(authAuditService.emitTerminalAccessDenied).toHaveBeenCalledWith({
      accountId: 'account-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      terminal: 'PDA',
      reasonCode: 'TERMINAL_ACCESS_DENIED',
      phase: 'LOGIN'
    })
    expect(sessionRepository.save).not.toHaveBeenCalled()
  })

  it('remembers the tenant device only when the login flow explicitly trusts the current device', async () => {
    const trustedDeviceService = {
      rememberTrustedDevice: jest.fn().mockResolvedValue(undefined)
    }
    const service = new AccountSessionEstablishmentService(
      {
        getAccountAuthorizationSummary: jest.fn().mockResolvedValue({
          roleIds: ['role-1']
        }),
        resolveAccountTerminalAccess: jest.fn().mockResolvedValue({
          allowed: true,
          reasonCode: 'ALLOWED',
          effectiveAllowedTerminals: ['WEB'],
          resolutionSource: 'ROLE_UNION',
          matchedRoleIds: ['role-1']
        })
      } as any,
      {
        userRequiresPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any,
      {
        signAccessToken: jest.fn().mockReturnValue('access-token'),
        signRefreshToken: jest.fn().mockReturnValue('refresh-token')
      } as any,
      {
        get: jest.fn().mockReturnValue({
          accessTokenValidity: 900,
          refreshTokenValidity: 604800,
          issuer: '',
          audience: ''
        })
      } as any,
      {
        save: jest.fn().mockImplementation(async (session) => session),
        findById: jest.fn().mockResolvedValue(null)
      } as any,
      {
        emitLoginSucceeded: jest.fn()
      } as any,
      trustedDeviceService as any,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any
    )

    await service.establish({
      userId: 'user-1',
      account: {
        accountId: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'Tenant Account'
      },
      loginMethod: LoginMethodEnum.EmailPassword,
      deviceId: 'browser-1',
      deviceName: 'Firefox on macOS',
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      ipAddress: '127.0.0.1',
      trustCurrentDevice: true
    } as any)

    expect(trustedDeviceService.rememberTrustedDevice).toHaveBeenCalledWith({
      userId: 'user-1',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      deviceId: 'browser-1',
      deviceName: 'Firefox on macOS',
      browser: 'Firefox',
      platform: undefined,
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      ipAddress: '127.0.0.1'
    })
  })

  it('does not remember the tenant device when the MFA flow did not opt into trust', async () => {
    const trustedDeviceService = {
      rememberTrustedDevice: jest.fn().mockResolvedValue(undefined)
    }
    const service = new AccountSessionEstablishmentService(
      {
        getAccountAuthorizationSummary: jest.fn().mockResolvedValue({
          roleIds: ['role-1']
        }),
        resolveAccountTerminalAccess: jest.fn().mockResolvedValue({
          allowed: true,
          reasonCode: 'ALLOWED',
          effectiveAllowedTerminals: ['WEB'],
          resolutionSource: 'ROLE_UNION',
          matchedRoleIds: ['role-1']
        })
      } as any,
      {
        userRequiresPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any,
      {
        signAccessToken: jest.fn().mockReturnValue('access-token'),
        signRefreshToken: jest.fn().mockReturnValue('refresh-token')
      } as any,
      {
        get: jest.fn().mockReturnValue({
          accessTokenValidity: 900,
          refreshTokenValidity: 604800,
          issuer: '',
          audience: ''
        })
      } as any,
      {
        save: jest.fn().mockImplementation(async (session) => session),
        findById: jest.fn().mockResolvedValue(null)
      } as any,
      {
        emitLoginSucceeded: jest.fn()
      } as any,
      trustedDeviceService as any,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any
    )

    await service.establish({
      userId: 'user-1',
      account: {
        accountId: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'Tenant Account'
      },
      loginMethod: LoginMethodEnum.EmailPassword,
      deviceId: 'browser-1',
      deviceName: 'Firefox on macOS',
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      ipAddress: '127.0.0.1',
      trustCurrentDevice: false
    } as any)

    expect(trustedDeviceService.rememberTrustedDevice).not.toHaveBeenCalled()
  })

  it('persists terminal-aware session metadata when establishing a PDA session', async () => {
    const sessionRepository = {
      save: jest.fn().mockImplementation(async (session) => session),
      findById: jest.fn().mockResolvedValue(null)
    }
    const jwtService = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      signRefreshToken: jest.fn().mockReturnValue('refresh-token')
    }
    const service = new AccountSessionEstablishmentService(
      {
        getAccountAuthorizationSummary: jest.fn().mockResolvedValue({
          roleIds: ['role-1']
        }),
        resolveAccountTerminalAccess: jest.fn().mockResolvedValue({
          allowed: true,
          reasonCode: 'ALLOWED',
          effectiveAllowedTerminals: ['PDA'],
          resolutionSource: 'ROLE_UNION',
          matchedRoleIds: ['role-1']
        })
      } as any,
      {
        userRequiresPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any,
      jwtService as any,
      {
        get: jest.fn().mockReturnValue({
          accessTokenValidity: 900,
          refreshTokenValidity: 604800,
          issuer: '',
          audience: ''
        })
      } as any,
      sessionRepository as any,
      {
        emitLoginSucceeded: jest.fn()
      } as any,
      {
        rememberTrustedDevice: jest.fn()
      } as any,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any
    )

    await service.establish({
      userId: 'user-1',
      account: {
        accountId: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'Tenant Account'
      },
      loginMethod: LoginMethodEnum.PhonePassword,
      terminal: 'PDA',
      terminalDeviceId: 'terminal-device-1',
      deviceBoundTenantId: 'tenant-1',
      deviceId: 'pda-browser-1',
      deviceName: 'Warehouse PDA',
      userAgent: 'OES-PDA/1.0',
      ipAddress: '127.0.0.1'
    } as any)

    const savedSession = sessionRepository.save.mock.calls[0][0]
    expect(savedSession.getTerminal()).toBe('PDA')
    expect(savedSession.getLoginFlow()).toBe('PHONE_PASSWORD')
    expect(savedSession.getTerminalDeviceId()).toBe('terminal-device-1')
    expect(savedSession.getDeviceBoundTenantId()).toBe('tenant-1')
    expect(jwtService.signAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-1'
      }),
      expect.any(Object)
    )
  })

  it('uses the short PDA token window without changing the global web token window', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-18T08:00:00.000Z'))
    const sessionRepository = {
      save: jest.fn().mockImplementation(async (session) => session),
      findById: jest.fn().mockResolvedValue(null)
    }
    const jwtService = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      signRefreshToken: jest.fn().mockReturnValue('refresh-token')
    }
    const service = new AccountSessionEstablishmentService(
      {
        getAccountAuthorizationSummary: jest.fn().mockResolvedValue({
          roleIds: ['role-1']
        }),
        resolveAccountTerminalAccess: jest.fn().mockResolvedValue({
          allowed: true,
          reasonCode: 'ALLOWED',
          effectiveAllowedTerminals: ['PDA'],
          resolutionSource: 'ACCOUNT_OVERRIDE',
          matchedRoleIds: []
        })
      } as any,
      {
        userRequiresPasswordSetup: jest.fn().mockResolvedValue(false)
      } as any,
      jwtService as any,
      {
        get: jest.fn().mockReturnValue({
          accessTokenValidity: 900,
          refreshTokenValidity: 604800,
          issuer: '',
          audience: ''
        })
      } as any,
      sessionRepository as any,
      {
        emitLoginSucceeded: jest.fn()
      } as any,
      {
        rememberTrustedDevice: jest.fn()
      } as any,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any
    )

    const result = await service.establish({
      userId: 'user-1',
      account: {
        accountId: 'account-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'Tenant Account'
      },
      loginMethod: LoginMethodEnum.PhonePassword,
      terminal: 'PDA',
      terminalDeviceId: 'terminal-device-1',
      deviceBoundTenantId: 'tenant-1'
    } as any)

    const savedSession = sessionRepository.save.mock.calls[0][0]
    expect(result.expiresIn).toBe(900)
    expect(savedSession.getRemainingTime()).toBe(900)
    expect(savedSession.getRefreshRemainingTime()).toBe(1200)
    expect(jwtService.signAccessToken).toHaveBeenCalledWith(expect.any(Object), {
      expiresIn: 900
    })
    expect(jwtService.signRefreshToken).toHaveBeenCalledWith(expect.any(Object), {
      expiresIn: 1200
    })
    jest.useRealTimers()
  })
})
