import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@oes/common/auth'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { AuthController } from './auth.controller'

// Verifies the auth-bff controller exposes the expected public and protected HTTP entry points.
describe('AuthController', () => {
  const loginUseCase = { execute: jest.fn() }
  const requestEmailOtpChallengeUseCase = { execute: jest.fn() }
  const requestPhoneOtpChallengeUseCase = { execute: jest.fn() }
  const completeMfaUseCase = { execute: jest.fn() }
  const selectAccountUseCase = { execute: jest.fn() }
  const refreshSessionUseCase = { execute: jest.fn() }
  const sessionSelfServiceUseCase = {
    listSessions: jest.fn(),
    logout: jest.fn(),
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

  const controller = new AuthController(
    loginUseCase as any,
    requestEmailOtpChallengeUseCase as any,
    requestPhoneOtpChallengeUseCase as any,
    completeMfaUseCase as any,
    selectAccountUseCase as any,
    refreshSessionUseCase as any,
    sessionSelfServiceUseCase as any,
    mfaSelfServiceUseCase as any,
    adminSecurityUseCase as any,
    sessionAccessSummaryUseCase as any,
    sessionContextUseCase as any
  )

  it('marks only the login flow endpoints as public', () => {
    const reflector = new Reflector()

    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.login)).toBe(true)
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.requestEmailOtpChallenge)).toBe(true)
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.requestPhoneOtpChallenge)).toBe(true)
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.completeMfa)).toBe(true)
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.selectAccount)).toBe(true)
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.refreshSession)).toBe(true)

    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.getSessionContext)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.getSessionAccessSummary)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.listSessions)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.logout)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.listMfaBindings)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminListUserSessions)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminRevokeSession)).toBeUndefined()
    expect(reflector.get(IS_PUBLIC_KEY, AuthController.prototype.adminListAuditEvents)).toBeUndefined()
  })

  it('forwards self-service endpoints to their dedicated use cases', async () => {
    sessionSelfServiceUseCase.listSessions.mockResolvedValue({ sessions: [] })
    sessionSelfServiceUseCase.logout.mockResolvedValue({ success: true })
    mfaSelfServiceUseCase.listBindings.mockResolvedValue({ bindings: [] })
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

    const source = { user: { userId: 'user-1', sid: 'session-1' }, requestId: 'req-1', traceId: 'trace-1' }

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
    await expect(controller.getSessionAccessSummary(source as any)).resolves.toEqual({
      roles: [],
      actionCodes: ['role.create']
    })
    await expect(controller.listSessions(source as any)).resolves.toEqual({ sessions: [] })
    await expect(controller.logout(source as any)).resolves.toEqual({ success: true })
    await expect(controller.listMfaBindings(source as any)).resolves.toEqual({ bindings: [] })

    expect(sessionContextUseCase.execute).toHaveBeenCalledWith(source)
    expect(sessionAccessSummaryUseCase.execute).toHaveBeenCalledWith(source)
    expect(sessionSelfServiceUseCase.listSessions).toHaveBeenCalledWith(source)
    expect(sessionSelfServiceUseCase.logout).toHaveBeenCalledWith(source)
    expect(mfaSelfServiceUseCase.listBindings).toHaveBeenCalledWith(source)
  })

  it('declares coarse-grained permissions on the admin security endpoints', () => {
    const reflector = new Reflector()

    expect(reflector.get(PERMISSION_CHECK_KEY, AuthController.prototype.adminListUserSessions)).toEqual({
      type: 'ALL',
      permissions: ['auth.session.admin.view']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, AuthController.prototype.adminRevokeSession)).toEqual({
      type: 'ALL',
      permissions: ['auth.session.admin.revoke']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, AuthController.prototype.adminListAuditEvents)).toEqual({
      type: 'ALL',
      permissions: ['auth.audit.list']
    })
  })
})
