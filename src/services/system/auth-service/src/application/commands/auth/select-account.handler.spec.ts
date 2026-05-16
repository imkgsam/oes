import { LoginMethodEnum, MfaType } from '@oes/common/constants'
import { SelectAccountCommand } from './select-account.command'
import { SelectAccountHandler } from './select-account.handler'
import { LoginMfaOrchestrationService } from '../../services/mfa/login-mfa-orchestration.service'
import { TenantMfaPolicyEntity } from '../../../domain/entities/tenant-mfa-policy.entity'

const createTerminalAwareLoginMfaService = (input: {
  loginMfaRequired: boolean
  newDeviceMfaRequired?: boolean
  terminal?: string
}) => {
  const terminalMfaPolicyService = {
    resolve: jest.fn().mockResolvedValue({
      terminal: input.terminal ?? 'WEB',
      tenantId: 'tenant-2',
      source: input.terminal === 'PDA' && !input.loginMfaRequired ? 'PLATFORM_DEFAULT' : 'TENANT_OVERRIDE',
      loginMfaRequired: input.loginMfaRequired,
      newDeviceMfaRequired: input.newDeviceMfaRequired ?? false,
      allowedFactors: [MfaType.EMAIL_OTP],
      factorPriority: [MfaType.EMAIL_OTP]
    })
  }
  const service = new LoginMfaOrchestrationService(
    {
      getPlatformPolicy: jest.fn(),
      savePlatformPolicy: jest.fn()
    } as any,
    {
      getTenantPolicy: jest.fn().mockResolvedValue(TenantMfaPolicyEntity.defaults('tenant-2')),
      saveTenantPolicy: jest.fn()
    } as any,
    {
      listBindings: jest.fn().mockResolvedValue([
        {
          bindingId: 'email-binding',
          type: MfaType.EMAIL_OTP,
          enabled: true,
          available: true,
          destination: 'user@example.com'
        }
      ])
    } as any,
    {
      createChallenge: jest.fn()
    } as any,
    {
      createChallenge: jest.fn()
    } as any,
    {
      verifySelectedFactor: jest.fn()
    } as any,
    {
      signAccessToken: jest.fn().mockReturnValue('login-mfa-flow-token')
    } as any,
    {
      isTrustedDevice: jest.fn().mockResolvedValue(false)
    } as any,
    {
      findByUserIdAndType: jest.fn().mockResolvedValue(null)
    } as any,
    {
      userNeedsInitialPasswordSetup: jest.fn().mockResolvedValue(false)
    } as any,
    terminalMfaPolicyService as any
  )

  return { service, terminalMfaPolicyService }
}

describe('SelectAccountHandler', () => {
  const allowPermissionService = () => ({
    resolveAccountTerminalAccess: jest.fn().mockResolvedValue({
      allowed: true,
      reasonCode: 'ALLOWED',
      effectiveAllowedTerminals: ['WEB'],
      resolutionSource: 'ROLE_UNION',
      matchedRoleIds: ['role-1']
    })
  })

  it('rejects tenant-scope account selection when tenant-org reports the tenant is not active', async () => {
    const identityService = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: 'account-suspended',
        userId: 'user-1',
        tenantId: 'tenant-suspended',
        scopeLevel: 'TENANT',
        displayName: 'Suspended Tenant Account',
        isEnabled: true
      })
    }
    const tenantSessionAccessService = {
      assertAccountCanEstablishSession: jest.fn().mockRejectedValue(new Error('tenant inactive'))
    }
    const loginMfaOrchestrationService = {
      resolveChallengeForSelectedAccount: jest.fn()
    }
    const accountSessionEstablishmentService = {
      establish: jest.fn()
    }
    const handler = new SelectAccountHandler(
      identityService as any,
      accountSessionEstablishmentService as any,
      loginMfaOrchestrationService as any,
      tenantSessionAccessService as any,
      allowPermissionService() as any
    )

    await expect(
      handler.execute(
        new SelectAccountCommand('user-1', 'account-suspended', LoginMethodEnum.EmailPassword)
      )
    ).rejects.toThrow('tenant inactive')

    expect(tenantSessionAccessService.assertAccountCanEstablishSession).toHaveBeenCalledWith({
      accountId: 'account-suspended',
      tenantId: 'tenant-suspended',
      scopeLevel: 'TENANT'
    })
    expect(loginMfaOrchestrationService.resolveChallengeForSelectedAccount).not.toHaveBeenCalled()
    expect(accountSessionEstablishmentService.establish).not.toHaveBeenCalled()
  })

  it('does not check tenant lifecycle for SYSTEM account selection', async () => {
    const identityService = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: 'system-account',
        userId: 'user-1',
        tenantId: null,
        scopeLevel: 'SYSTEM',
        displayName: 'System Account',
        isEnabled: true
      })
    }
    const tenantSessionAccessService = {
      assertAccountCanEstablishSession: jest.fn()
    }
    const accountSessionEstablishmentService = {
      establish: jest.fn().mockResolvedValue({
        status: 'SUCCESS',
        userId: 'user-1',
        accountId: 'system-account',
        tenantId: null,
        scopeLevel: 'SYSTEM',
        sessionId: 'session-system',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        displayName: 'System Account',
        passwordSetupRequired: false
      })
    }
    const handler = new SelectAccountHandler(
      identityService as any,
      accountSessionEstablishmentService as any,
      {
        resolveChallengeForSelectedAccount: jest.fn().mockResolvedValue(null)
      } as any,
      tenantSessionAccessService as any,
      allowPermissionService() as any
    )

    await expect(
      handler.execute(
        new SelectAccountCommand('user-1', 'system-account', LoginMethodEnum.EmailPassword)
      )
    ).resolves.toEqual(expect.objectContaining({ scopeLevel: 'SYSTEM' }))

    expect(tenantSessionAccessService.assertAccountCanEstablishSession).not.toHaveBeenCalled()
  })

  it('replaces the previous context-switch session and preserves the original login method', async () => {
    const identityService = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: 'account-2',
        userId: 'user-1',
        tenantId: 'tenant-2',
        scopeLevel: 'TENANT',
        displayName: 'Target Account',
        isEnabled: true
      })
    }
    const handler = new SelectAccountHandler(
      identityService as any,
      {
        establish: jest.fn().mockResolvedValue({
          status: 'SUCCESS',
          userId: 'user-1',
          accountId: 'account-2',
          tenantId: 'tenant-2',
          scopeLevel: 'TENANT',
          sessionId: 'session-next',
          accessToken: 'next-access-token',
          refreshToken: 'next-refresh-token',
          expiresIn: 900,
          displayName: 'Target Account',
          passwordSetupRequired: true
        })
      } as any,
      {
        resolveChallengeForSelectedAccount: jest.fn().mockResolvedValue(null)
      } as any,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any,
      allowPermissionService() as any
    )

    const result = await handler.execute(
      new SelectAccountCommand(
        'user-1',
        'account-2',
        LoginMethodEnum.ContextSwitch,
        {
          currentSessionId: 'session-current',
          userAgent: 'Mozilla/5.0 Chrome/123.0',
          ipAddress: '10.0.0.2'
        }
      )
    )

    expect(result).toEqual(
      expect.objectContaining({
        status: 'SUCCESS',
        accountId: 'account-2',
        tenantId: 'tenant-2',
        accessToken: 'next-access-token',
        refreshToken: 'next-refresh-token',
        displayName: 'Target Account',
        passwordSetupRequired: true
      })
    )
  })

  it('returns MFA_REQUIRED after account selection when the tenant login policy requires MFA', async () => {
    const resolveChallengeForSelectedAccount = jest.fn().mockResolvedValue({
      challengeId: 'login-mfa-flow-token',
      scenario: 'NEW_DEVICE_LOGIN',
      defaultFactor: 'EMAIL_OTP',
      availableFactors: [
        { type: 'EMAIL_OTP', label: '邮箱验证码' },
        { type: 'TOTP', label: '认证器 App' }
      ]
    })
    const identityService = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: 'account-2',
        userId: 'user-1',
        tenantId: 'tenant-2',
        scopeLevel: 'TENANT',
        displayName: 'Target Account',
        isEnabled: true
      })
    }
    const handler = new SelectAccountHandler(
      identityService as any,
      {
        establish: jest.fn()
      } as any,
      {
        resolveChallengeForSelectedAccount
      } as any,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any,
      allowPermissionService() as any
    )

    const result = await handler.execute(
      new SelectAccountCommand('user-1', 'account-2', LoginMethodEnum.EmailPassword, {
        deviceId: 'browser-device-1',
        deviceName: 'Firefox on macOS',
        userAgent: 'Mozilla/5.0 Firefox/149.0',
        ipAddress: '127.0.0.1'
      })
    )

    expect(resolveChallengeForSelectedAccount).toHaveBeenCalledWith({
      userId: 'user-1',
      accountId: 'account-2',
      tenantId: 'tenant-2',
      scopeLevel: 'TENANT',
      displayName: 'Target Account',
      loginMethod: LoginMethodEnum.EmailPassword,
      deviceId: 'browser-device-1',
      deviceName: 'Firefox on macOS',
      userAgent: 'Mozilla/5.0 Firefox/149.0',
      ipAddress: '127.0.0.1',
      terminal: 'WEB'
    })
    expect(result).toEqual({
      status: 'MFA_REQUIRED',
      userId: 'user-1',
      accountId: 'account-2',
      tenantId: 'tenant-2',
      scopeLevel: 'TENANT',
      displayName: 'Target Account',
      challengeId: 'login-mfa-flow-token',
      scenario: 'NEW_DEVICE_LOGIN',
      defaultFactor: 'EMAIL_OTP',
      availableFactors: [
        { type: 'EMAIL_OTP', label: '邮箱验证码' },
        { type: 'TOTP', label: '认证器 App' }
      ],
      factorChallengeId: undefined,
      destination: undefined,
      expiresAt: undefined,
      terminal: 'WEB',
      allowedTerminals: ['WEB'],
      passwordSetupRequired: false
    })
  })

  it('returns MFA_REQUIRED for WEB when tenant terminal MFA override requires login MFA', async () => {
    const { service, terminalMfaPolicyService } = createTerminalAwareLoginMfaService({
      loginMfaRequired: true,
      terminal: 'WEB'
    })
    const identityService = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: 'account-2',
        userId: 'user-1',
        tenantId: 'tenant-2',
        scopeLevel: 'TENANT',
        displayName: 'Target Account',
        isEnabled: true
      })
    }
    const handler = new SelectAccountHandler(
      identityService as any,
      {
        establish: jest.fn()
      } as any,
      service,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any,
      allowPermissionService() as any
    )

    await expect(
      handler.execute(
        new SelectAccountCommand('user-1', 'account-2', LoginMethodEnum.EmailPassword, {
          terminal: 'WEB'
        })
      )
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'MFA_REQUIRED',
        accountId: 'account-2',
        tenantId: 'tenant-2',
        terminal: 'WEB',
        scenario: 'LOGIN',
        defaultFactor: MfaType.EMAIL_OTP
      })
    )
    expect(terminalMfaPolicyService.resolve).toHaveBeenCalledWith({
      tenantId: 'tenant-2',
      terminal: 'WEB'
    })
  })

  it('establishes a PDA session when the effective terminal MFA policy does not require login MFA', async () => {
    const { service, terminalMfaPolicyService } = createTerminalAwareLoginMfaService({
      loginMfaRequired: false,
      terminal: 'PDA'
    })
    const establish = jest.fn().mockResolvedValue({
      status: 'SUCCESS',
      userId: 'user-1',
      accountId: 'account-2',
      tenantId: 'tenant-2',
      scopeLevel: 'TENANT',
      sessionId: 'session-pda',
      terminal: 'PDA',
      allowedTerminals: ['PDA'],
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
      displayName: 'Target Account',
      passwordSetupRequired: false
    })
    const identityService = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: 'account-2',
        userId: 'user-1',
        tenantId: 'tenant-2',
        scopeLevel: 'TENANT',
        displayName: 'Target Account',
        isEnabled: true
      })
    }
    const handler = new SelectAccountHandler(
      identityService as any,
      { establish } as any,
      service,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any,
      {
        resolveAccountTerminalAccess: jest.fn().mockResolvedValue({
          allowed: true,
          reasonCode: 'ALLOWED',
          effectiveAllowedTerminals: ['PDA'],
          resolutionSource: 'ROLE_UNION',
          matchedRoleIds: ['role-1']
        })
      } as any
    )

    await expect(
      handler.execute(
        new SelectAccountCommand('user-1', 'account-2', LoginMethodEnum.EmailPassword, {
          terminal: 'PDA'
        })
      )
    ).resolves.toEqual(expect.objectContaining({ status: 'SUCCESS', terminal: 'PDA' }))
    expect(terminalMfaPolicyService.resolve).toHaveBeenCalledWith({
      tenantId: 'tenant-2',
      terminal: 'PDA'
    })
    expect(establish).toHaveBeenCalledWith(
      expect.objectContaining({
        terminal: 'PDA'
      })
    )
  })

  it('returns MFA_REQUIRED for PDA when tenant terminal MFA override explicitly requires login MFA', async () => {
    const { service } = createTerminalAwareLoginMfaService({
      loginMfaRequired: true,
      terminal: 'PDA'
    })
    const identityService = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: 'account-2',
        userId: 'user-1',
        tenantId: 'tenant-2',
        scopeLevel: 'TENANT',
        displayName: 'Target Account',
        isEnabled: true
      })
    }
    const handler = new SelectAccountHandler(
      identityService as any,
      {
        establish: jest.fn()
      } as any,
      service,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any,
      {
        resolveAccountTerminalAccess: jest.fn().mockResolvedValue({
          allowed: true,
          reasonCode: 'ALLOWED',
          effectiveAllowedTerminals: ['PDA'],
          resolutionSource: 'ROLE_UNION',
          matchedRoleIds: ['role-1']
        })
      } as any
    )

    await expect(
      handler.execute(
        new SelectAccountCommand('user-1', 'account-2', LoginMethodEnum.EmailPassword, {
          terminal: 'PDA'
        })
      )
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'MFA_REQUIRED',
        terminal: 'PDA',
        scenario: 'LOGIN'
      })
    )
  })

  it('denies terminal access after tenant lifecycle and before MFA or session creation', async () => {
    const identityService = {
      getAccountById: jest.fn().mockResolvedValue({
        accountId: 'account-2',
        userId: 'user-1',
        tenantId: 'tenant-2',
        scopeLevel: 'TENANT',
        displayName: 'Target Account',
        isEnabled: true
      })
    }
    const loginMfaOrchestrationService = {
      resolveChallengeForSelectedAccount: jest.fn()
    }
    const accountSessionEstablishmentService = {
      establish: jest.fn()
    }
    const permissionService = {
      resolveAccountTerminalAccess: jest.fn().mockResolvedValue({
        allowed: false,
        reasonCode: 'TERMINAL_ACCESS_DENIED',
        effectiveAllowedTerminals: ['PDA'],
        resolutionSource: 'ROLE_UNION',
        matchedRoleIds: ['worker-role']
      })
    }
    const handler = new SelectAccountHandler(
      identityService as any,
      accountSessionEstablishmentService as any,
      loginMfaOrchestrationService as any,
      {
        assertAccountCanEstablishSession: jest.fn().mockResolvedValue(undefined)
      } as any,
      permissionService as any
    )

    await expect(
      handler.execute(
        new SelectAccountCommand('user-1', 'account-2', LoginMethodEnum.EmailPassword, {
          userAgent: 'Mozilla/5.0 Chrome/123.0',
          ipAddress: '127.0.0.1',
          terminal: 'WEB'
        })
      )
    ).rejects.toThrow('Terminal access denied')

    expect(permissionService.resolveAccountTerminalAccess).toHaveBeenCalledWith({
      accountId: 'account-2',
      tenantId: 'tenant-2',
      scopeLevel: 'TENANT',
      terminal: 'WEB'
    })
    expect(loginMfaOrchestrationService.resolveChallengeForSelectedAccount).not.toHaveBeenCalled()
    expect(accountSessionEstablishmentService.establish).not.toHaveBeenCalled()
  })
})
