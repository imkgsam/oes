import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@oes/common/auth'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@oes/common/authorization'
import { AuthController } from './auth.controller'

// Verifies the auth-bff controller exposes the expected public and protected HTTP entry points.
describe('AuthController', () => {
  const loginUseCase = { execute: jest.fn() }
  const requestEmailOtpChallengeUseCase = { execute: jest.fn() }
  const requestPhoneOtpChallengeUseCase = { execute: jest.fn() }
  const requestMfaFactorChallengeUseCase = { execute: jest.fn() }
  const completeMfaUseCase = { execute: jest.fn() }
  const passwordRecoveryUseCase = {
    complete: jest.fn(),
    inspectChannels: jest.fn(),
    requestChallenge: jest.fn(),
    verifyChallenge: jest.fn()
  }
  const selectAccountUseCase = { execute: jest.fn() }
  const completeFirstLoginPasswordSetupUseCase = { execute: jest.fn() }
  const refreshSessionUseCase = { execute: jest.fn() }
  const sessionSelfServiceUseCase = {
    listTrustedDevices: jest.fn(),
    listLoginMethods: jest.fn(),
    changeOwnPassword: jest.fn(),
    setLoginMethodEnabled: jest.fn(),
    listLoginHistory: jest.fn(),
    listSessions: jest.fn(),
    logout: jest.fn(),
    revokeTrustedDevice: jest.fn(),
    revokeOtherTrustedDevices: jest.fn(),
    logoutSession: jest.fn(),
    logoutOtherDevices: jest.fn(),
    logoutAll: jest.fn()
  }
  const mfaSelfServiceUseCase = {
    listBindings: jest.fn(),
    enableBinding: jest.fn(),
    disableBinding: jest.fn(),
    initializeTotp: jest.fn(),
    activateTotp: jest.fn(),
    initializeRecoveryCodes: jest.fn(),
    regenerateRecoveryCodes: jest.fn()
  }
  const adminSecurityUseCase = {
    listAccounts: jest.fn(),
    getAccountDeletionImpact: jest.fn(),
    getAccountBasicInfo: jest.fn(),
    createAccount: jest.fn(),
    deleteAccount: jest.fn(),
    updateAccountBasicInfo: jest.fn(),
    listAccountLoginMethods: jest.fn(),
    requireAccountPasswordSetup: jest.fn(),
    setAccountLoginMethodEnabled: jest.fn(),
    listTenantOptions: jest.fn(),
    searchUsers: jest.fn(),
    listOnlineUsers: jest.fn(),
    listUserSessions: jest.fn(),
    revokeSession: jest.fn(),
    listAuditEvents: jest.fn()
  }
  const sessionContextUseCase = {
    execute: jest.fn()
  }
  const sessionAccessSummaryUseCase = {
    execute: jest.fn()
  }
  const sessionContextsUseCase = {
    execute: jest.fn()
  }
  const switchContextUseCase = {
    execute: jest.fn()
  }
  const personalCenterUseCase = {
    execute: jest.fn()
  }
  const accountProfileUseCase = {
    execute: jest.fn()
  }
  const accountAvatarUploadUseCase = {
    execute: jest.fn()
  }
  const selfContactBindingUseCase = {
    requestEmailChallenge: jest.fn(),
    requestPhoneChallenge: jest.fn(),
    verifyEmailBinding: jest.fn(),
    verifyPhoneBinding: jest.fn()
  }
  const stepUpMfaUseCase = {
    startChallenge: jest.fn(),
    completeChallenge: jest.fn()
  }

  const controller = new AuthController(
    loginUseCase as any,
    requestEmailOtpChallengeUseCase as any,
    requestPhoneOtpChallengeUseCase as any,
    requestMfaFactorChallengeUseCase as any,
    completeMfaUseCase as any,
    passwordRecoveryUseCase as any,
    selectAccountUseCase as any,
    completeFirstLoginPasswordSetupUseCase as any,
    refreshSessionUseCase as any,
    sessionSelfServiceUseCase as any,
    mfaSelfServiceUseCase as any,
    adminSecurityUseCase as any,
    sessionAccessSummaryUseCase as any,
    sessionContextUseCase as any,
    sessionContextsUseCase as any,
    switchContextUseCase as any,
    personalCenterUseCase as any,
    accountProfileUseCase as any,
    accountAvatarUploadUseCase as any,
    selfContactBindingUseCase as any,
    stepUpMfaUseCase as any
  )

  it('marks only the login flow endpoints as public', () => {
    const reflector = new Reflector()

    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.login)).toBe(true)
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.requestEmailOtpChallenge)).toBe(
      true
    )
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.requestPhoneOtpChallenge)).toBe(
      true
    )
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.completeMfa)).toBe(true)
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.requestMfaFactorChallenge)).toBe(
      true
    )
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.inspectPasswordRecoveryChannels)
    ).toBe(true)
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.requestPasswordRecoveryChallenge)
    ).toBe(true)
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.verifyPasswordRecoveryChallenge)
    ).toBe(true)
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.completePasswordRecovery)).toBe(
      true
    )
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.selectAccount)).toBe(true)
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.refreshSession)).toBe(true)

    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.getSessionContext)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.getPersonalCenter)).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.updateAccountProfile)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.getSessionAccessSummary)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.listSessionContexts)
    ).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.switchContext)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.listSessions)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.listLoginHistory)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.listLoginMethods)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.changeOwnPassword)).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.startStepUpMfaChallenge)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.completeStepUpMfaChallenge)
    ).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.logout)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.listMfaBindings)).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminListOnlineUsers)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminGetAccountBasicInfo)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminGetAccountDeletionImpact)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminDeleteAccount)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminUpdateAccountBasicInfo)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminListAccountLoginMethods)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminRequireAccountPasswordSetup)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminListUserSessions)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminRevokeSession)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminListAuditEvents)
    ).toBeUndefined()
  })

  it('forwards login device hints and client context to the login use case', async () => {
    loginUseCase.execute.mockResolvedValue({
      status: 'MFA_REQUIRED',
      nextStep: 'COMPLETE_MFA',
      loginMethod: 'EMAIL_PASSWORD',
      challenge: { challengeId: 'challenge-1' }
    })

    await expect(
      controller.login(
        {
          method: 'EMAIL_PASSWORD',
          identifier: 'alice@example.com',
          credential: 'secret-1',
          device: {
            deviceName: 'Alice MacBook Pro'
          }
        } as any,
        { requestId: 'req-1', traceId: 'trace-1' } as any,
        'Mozilla/5.0 Firefox/149.0',
        '1.1.1.1'
      )
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'MFA_REQUIRED',
        challenge: { challengeId: 'challenge-1' }
      })
    )

    expect(loginUseCase.execute).toHaveBeenCalledWith(
      {
        method: 'EMAIL_PASSWORD',
        identifier: 'alice@example.com',
        credential: 'secret-1',
        device: {
          deviceName: 'Alice MacBook Pro'
        }
      },
      {
        requestId: 'req-1',
        traceId: 'trace-1'
      },
      {
        userAgent: 'Mozilla/5.0 Firefox/149.0',
        ipAddress: '1.1.1.1'
      },
      'WEB'
    )
  })

  it('forwards trusted-device self-service endpoints to the session self-service use case', async () => {
    sessionSelfServiceUseCase.listTrustedDevices.mockResolvedValue({
      devices: [
        {
          id: 'trusted-1',
          deviceId: 'device-1',
          trustedAt: '2026-04-22T08:00:00.000Z',
          lastActiveAt: '2026-04-22T09:00:00.000Z',
          expiresAt: '2026-05-22T08:00:00.000Z',
          isCurrentDevice: false
        }
      ]
    })
    sessionSelfServiceUseCase.revokeTrustedDevice.mockResolvedValue({
      success: true,
      deviceCount: 1
    })
    sessionSelfServiceUseCase.revokeOtherTrustedDevices.mockResolvedValue({
      success: true,
      deviceCount: 2
    })

    await expect(
      controller.listTrustedDevices({ user: { sub: 'user-1', tid: 'tenant-1' } } as any)
    ).resolves.toEqual(
      expect.objectContaining({
        devices: [expect.objectContaining({ id: 'trusted-1' })]
      })
    )

    await expect(
      controller.revokeTrustedDevice('trusted-1', {
        user: { sub: 'user-1', tid: 'tenant-1' }
      } as any)
    ).resolves.toEqual({
      success: true,
      deviceCount: 1
    })

    await expect(
      controller.revokeOtherTrustedDevices({ user: { sub: 'user-1', tid: 'tenant-1' } } as any)
    ).resolves.toEqual({
      success: true,
      deviceCount: 2
    })

    expect(sessionSelfServiceUseCase.listTrustedDevices).toHaveBeenCalledWith(
      expect.objectContaining({ user: { sub: 'user-1', tid: 'tenant-1' } })
    )
    expect(sessionSelfServiceUseCase.revokeTrustedDevice).toHaveBeenCalledWith(
      'trusted-1',
      expect.objectContaining({ user: { sub: 'user-1', tid: 'tenant-1' } })
    )
    expect(sessionSelfServiceUseCase.revokeOtherTrustedDevices).toHaveBeenCalledWith(
      expect.objectContaining({ user: { sub: 'user-1', tid: 'tenant-1' } })
    )
  })

  it('forwards public password recovery endpoints to the password recovery use case', async () => {
    passwordRecoveryUseCase.inspectChannels.mockResolvedValue({
      channels: [{ channel: 'EMAIL', maskedDestination: 'u***@example.com' }],
      defaultChannel: 'EMAIL'
    })
    passwordRecoveryUseCase.requestChallenge.mockResolvedValue({
      accepted: true,
      challengeId: 'challenge-1'
    })
    passwordRecoveryUseCase.verifyChallenge.mockResolvedValue({
      verified: true,
      resetToken: 'reset-token-1'
    })
    passwordRecoveryUseCase.complete.mockResolvedValue({
      success: true,
      sessionsRevoked: true
    })

    const source = { requestId: 'req-1', traceId: 'trace-1' }

    await expect(
      controller.inspectPasswordRecoveryChannels(
        {
          identifier: 'user@example.com'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      channels: [{ channel: 'EMAIL', maskedDestination: 'u***@example.com' }],
      defaultChannel: 'EMAIL'
    })

    await expect(
      controller.requestPasswordRecoveryChallenge(
        {
          channel: 'EMAIL',
          identifier: 'user@example.com'
        } as any,
        source as any
      )
    ).resolves.toEqual(
      expect.objectContaining({
        accepted: true,
        challengeId: 'challenge-1'
      })
    )

    await expect(
      controller.verifyPasswordRecoveryChallenge(
        'challenge-1',
        { otp: '123456' } as any,
        source as any
      )
    ).resolves.toEqual({
      verified: true,
      resetToken: 'reset-token-1'
    })

    await expect(
      controller.completePasswordRecovery(
        {
          resetToken: 'reset-token-1',
          newPassword: 'NewSecret123!',
          confirmPassword: 'NewSecret123!'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      success: true,
      sessionsRevoked: true
    })

    expect(passwordRecoveryUseCase.inspectChannels).toHaveBeenCalledWith(
      {
        identifier: 'user@example.com'
      },
      {
        requestId: 'req-1',
        traceId: 'trace-1'
      }
    )
    expect(passwordRecoveryUseCase.requestChallenge).toHaveBeenCalledWith(
      {
        channel: 'EMAIL',
        identifier: 'user@example.com'
      },
      {
        requestId: 'req-1',
        traceId: 'trace-1'
      }
    )
    expect(passwordRecoveryUseCase.verifyChallenge).toHaveBeenCalledWith(
      'challenge-1',
      { otp: '123456' },
      {
        requestId: 'req-1',
        traceId: 'trace-1'
      }
    )
    expect(passwordRecoveryUseCase.complete).toHaveBeenCalledWith(
      {
        resetToken: 'reset-token-1',
        newPassword: 'NewSecret123!',
        confirmPassword: 'NewSecret123!'
      },
      {
        requestId: 'req-1',
        traceId: 'trace-1'
      }
    )
  })

  it('forwards public login-mfa factor challenge requests to the dedicated use case', async () => {
    requestMfaFactorChallengeUseCase.execute.mockResolvedValue({
      challengeId: 'factor-challenge-1',
      destination: 'a***@example.com',
      expiresAt: '2026-04-21T08:00:00.000Z'
    })

    await expect(
      controller.requestMfaFactorChallenge(
        {
          challengeId: 'login-challenge-1',
          factor: 'EMAIL_OTP'
        } as any,
        { requestId: 'req-1', traceId: 'trace-1' } as any
      )
    ).resolves.toEqual({
      challengeId: 'factor-challenge-1',
      destination: 'a***@example.com',
      expiresAt: '2026-04-21T08:00:00.000Z'
    })

    expect(requestMfaFactorChallengeUseCase.execute).toHaveBeenCalledWith(
      {
        challengeId: 'login-challenge-1',
        factor: 'EMAIL_OTP'
      },
      {
        requestId: 'req-1',
        traceId: 'trace-1'
      }
    )
  })

  it('forwards self-service endpoints to their dedicated use cases', async () => {
    sessionSelfServiceUseCase.listSessions.mockResolvedValue({ sessions: [] })
    sessionSelfServiceUseCase.listLoginHistory.mockResolvedValue({ items: [], nextCursor: '' })
    sessionSelfServiceUseCase.logout.mockResolvedValue({ success: true })
    sessionSelfServiceUseCase.logoutSession.mockResolvedValue({ success: true })
    mfaSelfServiceUseCase.listBindings.mockResolvedValue({ bindings: [] })
    adminSecurityUseCase.listOnlineUsers.mockResolvedValue({
      items: [
        {
          userId: 'user-1',
          displayName: 'Vic Chen',
          tenantId: 'tenant-1',
          tenantName: 'Tenant A',
          activeSessionCount: 2,
          lastActiveAt: '2026-04-09T10:10:00.000Z'
        }
      ]
    })
    sessionAccessSummaryUseCase.execute.mockResolvedValue({
      roles: [],
      actionCodes: ['role.create']
    })
    sessionContextUseCase.execute.mockResolvedValue({
      operator: { userId: 'user-1', scopeLevel: 'TENANT' },
      account: { accountId: 'account-1', scopeLevel: 'TENANT' },
      tenant: { tenantId: 'tenant-1' },
      org: null,
      navigation: {
        defaultEntry: 'workbench.home',
        visibleEntries: ['workbench.home'],
        defaultHomePath: '/workbench/home',
        menus: []
      },
      access: { actionCodes: [] },
      scopeLevel: 'TENANT'
    })
    personalCenterUseCase.execute.mockResolvedValue({
      userProfile: {
        loginMethods: []
      },
      accountContext: {
        accountId: 'account-1',
        displayName: 'Vic Chen',
        scopeLevel: 'TENANT',
        roles: []
      },
      securityEntries: []
    })
    accountProfileUseCase.execute.mockResolvedValue({
      accountContext: {
        accountId: 'account-1',
        displayName: 'Vic Chen',
        scopeLevel: 'TENANT',
        roles: []
      }
    })
    sessionContextsUseCase.execute.mockResolvedValue({
      items: [
        {
          accountId: 'account-1',
          displayName: 'Tenant A',
          isCurrent: true,
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Tenant A'
        }
      ]
    })
    switchContextUseCase.execute.mockResolvedValue({
      status: 'SUCCESS',
      context: {
        accountId: 'account-2',
        scopeLevel: 'SYSTEM',
        tenantId: null
      },
      session: {
        accessToken: 'next-access',
        refreshToken: 'next-refresh',
        expiresIn: 3600
      }
    })

    const source = {
      user: { userId: 'user-1', sid: 'session-1' },
      requestId: 'req-1',
      traceId: 'trace-1'
    }

    await expect(controller.getSessionContext(source as any)).resolves.toEqual(
      expect.objectContaining({
        operator: { userId: 'user-1', scopeLevel: 'TENANT' },
        navigation: {
          defaultEntry: 'workbench.home',
          visibleEntries: ['workbench.home'],
          defaultHomePath: '/workbench/home',
          menus: []
        }
      })
    )
    await expect(controller.getPersonalCenter(source as any)).resolves.toEqual({
      userProfile: {
        loginMethods: []
      },
      accountContext: {
        accountId: 'account-1',
        displayName: 'Vic Chen',
        scopeLevel: 'TENANT',
        roles: []
      },
      securityEntries: []
    })
    await expect(
      controller.updateAccountProfile({ displayName: 'Vic Chen' } as any, source as any)
    ).resolves.toEqual({
      accountContext: {
        accountId: 'account-1',
        displayName: 'Vic Chen',
        scopeLevel: 'TENANT',
        roles: []
      }
    })
    await expect(controller.getSessionAccessSummary(source as any)).resolves.toEqual({
      roles: [],
      actionCodes: ['role.create']
    })
    await expect(controller.listSessionContexts(source as any)).resolves.toEqual({
      items: [
        {
          accountId: 'account-1',
          displayName: 'Tenant A',
          isCurrent: true,
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Tenant A'
        }
      ]
    })
    await expect(
      controller.switchContext(
        { accountId: 'account-2' } as any,
        source as any,
        'browser',
        '1.1.1.1'
      )
    ).resolves.toEqual({
      status: 'SUCCESS',
      context: {
        accountId: 'account-2',
        scopeLevel: 'SYSTEM',
        tenantId: null
      },
      session: {
        accessToken: 'next-access',
        refreshToken: 'next-refresh',
        expiresIn: 3600
      }
    })
    await expect(controller.listSessions(source as any)).resolves.toEqual({ sessions: [] })
    await expect(
      controller.listLoginHistory({ result: 'FAILED' } as any, source as any)
    ).resolves.toEqual({ items: [], nextCursor: '' })
    await expect(controller.logout(source as any)).resolves.toEqual({ success: true })
    await expect(controller.logoutSession('session-target-1', source as any)).resolves.toEqual({
      success: true
    })
    await expect(controller.listMfaBindings(source as any)).resolves.toEqual({ bindings: [] })
    await expect(
      controller.adminListOnlineUsers({ tenantId: 'tenant-1', query: 'vic' } as any, source as any)
    ).resolves.toEqual({
      items: [
        {
          userId: 'user-1',
          displayName: 'Vic Chen',
          tenantId: 'tenant-1',
          tenantName: 'Tenant A',
          activeSessionCount: 2,
          lastActiveAt: '2026-04-09T10:10:00.000Z'
        }
      ]
    })
    adminSecurityUseCase.listAccounts.mockResolvedValue({
      items: [
        {
          accountId: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          tenantName: 'Tenant A',
          accountDisplayName: 'Vic Tenant',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    adminSecurityUseCase.createAccount.mockResolvedValue({
      accountId: 'account-2',
      userId: 'user-2',
      tenantId: 'tenant-1',
      tenantName: 'Tenant A',
      accountDisplayName: 'New User',
      scopeLevel: 'TENANT',
      isEnabled: true
    })
    adminSecurityUseCase.updateAccountBasicInfo.mockResolvedValue({
      accountId: 'account-2',
      userId: 'user-2',
      tenantId: 'tenant-1',
      tenantName: 'Tenant A',
      accountDisplayName: 'New User',
      scopeLevel: 'TENANT',
      isEnabled: false
    })
    adminSecurityUseCase.listTenantOptions.mockResolvedValue({
      items: [
        {
          id: 'tenant-1',
          code: 'alpha',
          name: 'Alpha Tenant',
          isActive: true
        }
      ]
    })
    completeFirstLoginPasswordSetupUseCase.execute.mockResolvedValue({ completed: true })
    await expect(
      controller.adminListAccounts(
        {
          page: 1,
          pageSize: 20,
          scopeLevel: 'TENANT',
          status: 'ENABLED',
          tenantId: 'tenant-1'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      items: [
        {
          accountId: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          tenantName: 'Tenant A',
          accountDisplayName: 'Vic Tenant',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    await expect(
      controller.adminCreateAccount(
        {
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          displayName: 'New User',
          phone: '+15550000001',
          initialRoleIds: ['role-1']
        } as any,
        source as any
      )
    ).resolves.toEqual({
      accountId: 'account-2',
      userId: 'user-2',
      tenantId: 'tenant-1',
      tenantName: 'Tenant A',
      accountDisplayName: 'New User',
      scopeLevel: 'TENANT',
      isEnabled: true
    })
    await expect(
      controller.adminUpdateAccountBasicInfo(
        'account-2',
        { displayName: 'New User', isEnabled: false } as any,
        source as any
      )
    ).resolves.toEqual({
      accountId: 'account-2',
      userId: 'user-2',
      tenantId: 'tenant-1',
      tenantName: 'Tenant A',
      accountDisplayName: 'New User',
      scopeLevel: 'TENANT',
      isEnabled: false
    })
    await expect(
      controller.adminListAccountTenantOptions(
        { keyword: 'alpha', pageSize: 10 } as any,
        source as any
      )
    ).resolves.toEqual({
      items: [
        {
          id: 'tenant-1',
          code: 'alpha',
          name: 'Alpha Tenant',
          isActive: true
        }
      ]
    })
    adminSecurityUseCase.searchUsers.mockResolvedValue({
      items: [
        {
          userId: 'user-2',
          displayName: 'Victor / Tenant',
          emailMasked: 'v***@example.com',
          phoneMasked: '+1*******001',
          accountSummaries: [
            {
              accountId: 'account-2',
              tenantId: 'tenant-1',
              tenantName: 'Tenant A',
              scopeLevel: 'TENANT'
            }
          ],
          isOnline: true,
          activeSessionCount: 1
        }
      ]
    })
    await expect(
      controller.adminSearchUsers(
        { keyword: 'victor@example.com', limit: 10 } as any,
        source as any
      )
    ).resolves.toEqual({
      items: [
        {
          userId: 'user-2',
          displayName: 'Victor / Tenant',
          emailMasked: 'v***@example.com',
          phoneMasked: '+1*******001',
          accountSummaries: [
            {
              accountId: 'account-2',
              tenantId: 'tenant-1',
              tenantName: 'Tenant A',
              scopeLevel: 'TENANT'
            }
          ],
          isOnline: true,
          activeSessionCount: 1
        }
      ]
    })
    await expect(
      controller.completeFirstLoginPasswordSetup(
        { newPassword: 'secret-123', confirmPassword: 'secret-123' } as any,
        source as any
      )
    ).resolves.toEqual({ completed: true })

    expect(sessionContextUseCase.execute).toHaveBeenCalledWith(source)
    expect(personalCenterUseCase.execute).toHaveBeenCalledWith(source)
    expect(accountProfileUseCase.execute).toHaveBeenCalledWith({ displayName: 'Vic Chen' }, source)
    expect(sessionAccessSummaryUseCase.execute).toHaveBeenCalledWith(source)
    expect(sessionContextsUseCase.execute).toHaveBeenCalledWith(source)
    expect(switchContextUseCase.execute).toHaveBeenCalledWith({ accountId: 'account-2' }, source, {
      userAgent: 'browser',
      ipAddress: '1.1.1.1'
    })
    expect(sessionSelfServiceUseCase.listSessions).toHaveBeenCalledWith(source)
    expect(sessionSelfServiceUseCase.listLoginHistory).toHaveBeenCalledWith(
      { result: 'FAILED' },
      source
    )
    expect(sessionSelfServiceUseCase.logout).toHaveBeenCalledWith(source)
    expect(sessionSelfServiceUseCase.logoutSession).toHaveBeenCalledWith('session-target-1', source)
    expect(mfaSelfServiceUseCase.listBindings).toHaveBeenCalledWith(source)
    expect(adminSecurityUseCase.listOnlineUsers).toHaveBeenCalledWith(
      { tenantId: 'tenant-1', query: 'vic' },
      source
    )
    expect(adminSecurityUseCase.listAccounts).toHaveBeenCalledWith(
      { page: 1, pageSize: 20, scopeLevel: 'TENANT', status: 'ENABLED', tenantId: 'tenant-1' },
      source
    )
    expect(adminSecurityUseCase.createAccount).toHaveBeenCalledWith(
      {
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        displayName: 'New User',
        phone: '+15550000001',
        initialRoleIds: ['role-1']
      },
      source
    )
    expect(adminSecurityUseCase.updateAccountBasicInfo).toHaveBeenCalledWith(
      'account-2',
      { displayName: 'New User', isEnabled: false },
      source
    )
    expect(adminSecurityUseCase.listTenantOptions).toHaveBeenCalledWith(
      { keyword: 'alpha', pageSize: 10 },
      source
    )
    expect(adminSecurityUseCase.searchUsers).toHaveBeenCalledWith(
      { keyword: 'victor@example.com', limit: 10 },
      source
    )
    expect(completeFirstLoginPasswordSetupUseCase.execute).toHaveBeenCalledWith(
      { newPassword: 'secret-123', confirmPassword: 'secret-123' },
      source
    )
  })

  it('declares coarse-grained permissions on the admin security endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, AuthController.prototype.adminListOnlineUsers)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, AuthController.prototype.adminListAccounts)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AuthController.prototype.adminGetAccountDeletionImpact
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AuthController.prototype.adminGetAccountBasicInfo
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, AuthController.prototype.adminCreateAccount)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AuthController.prototype.adminUpdateAccountBasicInfo
      )
    ).toEqual(expect.objectContaining({ any: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, AuthController.prototype.adminDeleteAccount)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AuthController.prototype.adminListAccountTenantOptions
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, AuthController.prototype.adminSearchUsers)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AuthController.prototype.adminListUserSessions
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, AuthController.prototype.adminRevokeSession)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, AuthController.prototype.adminListAuditEvents)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AuthController.prototype.adminGetTenantMfaPolicy
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        AuthController.prototype.adminUpdateTenantMfaPolicy
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards admin account deletion endpoints to the admin security use case', async () => {
    adminSecurityUseCase.getAccountDeletionImpact.mockResolvedValue({
      accountId: 'account-1',
      canDelete: true,
      userRetained: true,
      cleanupPlan: {
        willDeleteSessions: true,
        willClearRoles: true,
        willDeleteContactAssets: true
      },
      blockingReasons: [],
      contactAssetCount: 2
    })
    adminSecurityUseCase.deleteAccount.mockResolvedValue({
      accountId: 'account-1',
      success: true,
      deletedSessionCount: 3,
      clearedRoleCount: 2,
      deletedPolicyCount: 2,
      deletedContactAssetCount: 2,
      userRetained: true
    })

    const source = { user: { sub: 'operator-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' } }

    await expect(
      controller.adminGetAccountDeletionImpact('account-1', source as any)
    ).resolves.toEqual(
      expect.objectContaining({
        accountId: 'account-1',
        canDelete: true
      })
    )

    await expect(controller.adminDeleteAccount('account-1', source as any)).resolves.toEqual({
      accountId: 'account-1',
      success: true,
      deletedSessionCount: 3,
      clearedRoleCount: 2,
      deletedPolicyCount: 2,
      deletedContactAssetCount: 2,
      userRetained: true
    })

    expect(adminSecurityUseCase.getAccountDeletionImpact).toHaveBeenCalledWith('account-1', source)
    expect(adminSecurityUseCase.deleteAccount).toHaveBeenCalledWith('account-1', source)
  })
})
