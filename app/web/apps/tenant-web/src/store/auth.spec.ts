import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const replaceMock = vi.fn()
const pushMock = vi.fn()
const routerMock = {
  currentRoute: {
    value: {
      fullPath: '/workbench/home',
      meta: {}
    }
  },
  push: pushMock,
  replace: replaceMock
}
const resetAllStoresMock = vi.fn()
const logoutApiMock = vi.fn()
const loginApiMock = vi.fn()
const selectAccountApiMock = vi.fn()
const completeFirstLoginPasswordSetupApiMock = vi.fn()
const completeMfaApiMock = vi.fn()
const getSessionAccessSummaryApiMock = vi.fn()
const getSessionContextApiMock = vi.fn()
const generateAccessMock = vi.fn()
const requestMfaFactorChallengeApiMock = vi.fn()
const accessStoreMock: {
  accessToken: null | string
  isAccessChecked: boolean
  loginExpired: boolean
  setAccessCodes: ReturnType<typeof vi.fn>
  setAccessMenus: ReturnType<typeof vi.fn>
  setAccessRoutes: ReturnType<typeof vi.fn>
  setAccessToken: ReturnType<typeof vi.fn>
  setIsAccessChecked: ReturnType<typeof vi.fn>
  setLoginExpired: ReturnType<typeof vi.fn>
  setRefreshToken: ReturnType<typeof vi.fn>
} = {
  accessToken: 'access-token',
  isAccessChecked: true,
  loginExpired: false,
  setAccessCodes: vi.fn(),
  setAccessMenus: vi.fn(),
  setAccessRoutes: vi.fn(),
  setAccessToken: vi.fn(),
  setIsAccessChecked: vi.fn(),
  setLoginExpired: vi.fn(),
  setRefreshToken: vi.fn()
}
const userStoreMock = {
  setUserInfo: vi.fn(),
  userInfo: {
    avatar: '',
    desc: '系统平台 / System Admin',
    homePath: '/admin/role-management',
    realName: 'System Admin',
    roles: ['SYSTEM_ADMIN'],
    token: 'access-token',
    userId: 'user-1',
    username: 'system-admin'
  }
}
const authContextStoreMock = {
  $reset: vi.fn(),
  homePath: '/admin/role-management',
  roleCodes: ['SYSTEM_ADMIN'],
  visibleEntries: ['admin.role-management', 'admin.navigation-management'],
  sessionContext: {
    navigation: {
      defaultEntry: 'admin.role-management',
      defaultHomePath: '/admin/role-management',
      visibleEntries: ['admin.role-management', 'admin.navigation-management']
    },
    passwordSetupRequired: false,
    scopeLevel: 'SYSTEM'
  },
  setAuthContext: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => routerMock
}))

vi.mock('@vben/stores', () => ({
  resetAllStores: resetAllStoresMock,
  useAccessStore: () => accessStoreMock,
  useTabbarStore: () => ({
    setTabs: vi.fn()
  }),
  useUserStore: () => userStoreMock
}))

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      defaultAvatar: '',
      defaultHomePath: '/workbench/home',
      loginExpiredMode: 'page'
    }
  }
}))

vi.mock('@vben/constants', () => ({
  LOGIN_PATH: '/login'
}))

vi.mock('#/api', () => ({
  completeFirstLoginPasswordSetupApi: completeFirstLoginPasswordSetupApiMock,
  completeMfaApi: completeMfaApiMock,
  getSessionAccessSummaryApi: getSessionAccessSummaryApiMock,
  getSessionContextApi: getSessionContextApiMock,
  loginApi: loginApiMock,
  logoutApi: logoutApiMock,
  requestEmailOtpChallengeApi: vi.fn(),
  requestMfaFactorChallengeApi: requestMfaFactorChallengeApiMock,
  requestPhoneOtpChallengeApi: vi.fn(),
  selectAccountApi: selectAccountApiMock,
  switchSessionContextApi: vi.fn()
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextStoreMock
}))

vi.mock('#/router/access', () => ({
  generateAccess: generateAccessMock
}))

vi.mock('#/router/routes', () => ({
  accessRoutes: []
}))

vi.mock('#/store/test-user-avatar', () => ({
  resolveTestUserAvatar: vi.fn(() => '')
}))

vi.mock('#/utils/auth-device', () => ({
  resolveAuthDeviceHints: vi.fn(() => ({
    deviceId: 'device-1',
    deviceName: 'Firefox on macOS'
  }))
}))

vi.mock('ant-design-vue', () => ({
  message: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  },
  notification: {
    success: vi.fn(),
    warning: vi.fn()
  }
}))

// Verifies logout remains single-flight so interceptor-driven re-authentication cannot recurse.
describe('tenant-web auth store logout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    replaceMock.mockReset()
    pushMock.mockReset()
    routerMock.currentRoute.value = {
      fullPath: '/workbench/home',
      meta: {}
    }
    resetAllStoresMock.mockReset()
    logoutApiMock.mockReset()
    loginApiMock.mockReset()
    selectAccountApiMock.mockReset()
    completeFirstLoginPasswordSetupApiMock.mockReset()
    completeMfaApiMock.mockReset()
    getSessionAccessSummaryApiMock.mockReset()
    getSessionContextApiMock.mockReset()
    generateAccessMock.mockReset()
    requestMfaFactorChallengeApiMock.mockReset()
    accessStoreMock.accessToken = 'access-token'
    accessStoreMock.isAccessChecked = true
    accessStoreMock.loginExpired = false
    accessStoreMock.setAccessMenus.mockReset()
    accessStoreMock.setAccessCodes.mockReset()
    accessStoreMock.setAccessToken.mockReset()
    accessStoreMock.setAccessRoutes.mockReset()
    accessStoreMock.setIsAccessChecked.mockReset()
    accessStoreMock.setLoginExpired.mockReset()
    accessStoreMock.setRefreshToken.mockReset()
    userStoreMock.setUserInfo.mockReset()
    userStoreMock.userInfo = {
      avatar: '',
      desc: '系统平台 / System Admin',
      homePath: '/admin/role-management',
      realName: 'System Admin',
      roles: ['SYSTEM_ADMIN'],
      token: 'access-token',
      userId: 'user-1',
      username: 'system-admin'
    }
    authContextStoreMock.$reset.mockReset()
    authContextStoreMock.homePath = '/admin/role-management'
    authContextStoreMock.roleCodes = ['SYSTEM_ADMIN']
    authContextStoreMock.visibleEntries = [
      'admin.role-management',
      'admin.navigation-management'
    ]
    authContextStoreMock.sessionContext = {
      navigation: {
        defaultEntry: 'admin.role-management',
        defaultHomePath: '/admin/role-management',
        visibleEntries: ['admin.role-management', 'admin.navigation-management']
      },
      passwordSetupRequired: false,
      scopeLevel: 'SYSTEM'
    }
    authContextStoreMock.setAuthContext.mockReset()
    authContextStoreMock.setAuthContext.mockImplementation((sessionContext, accessSummary) => {
      authContextStoreMock.sessionContext = sessionContext
      authContextStoreMock.visibleEntries = sessionContext.navigation?.visibleEntries ?? []
      authContextStoreMock.homePath =
        sessionContext.navigation?.defaultHomePath || '/workbench/home'
      authContextStoreMock.roleCodes =
        accessSummary?.roles?.map((role: { code: string }) => role.code) ?? []
    })
  })

  it('ignores re-entrant logout calls while one logout request is already in flight', async () => {
    let resolveLogout: (() => void) | undefined
    logoutApiMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLogout = resolve
        })
    )

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    const firstLogout = store.logout(false)
    const secondLogout = store.logout(false)

    expect(logoutApiMock).toHaveBeenCalledTimes(1)

    resolveLogout?.()
    await firstLogout
    await secondLogout

    expect(resetAllStoresMock).toHaveBeenCalledTimes(1)
    expect(replaceMock).toHaveBeenCalledTimes(1)
  })

  it('skips backend logout when access token is already cleared', async () => {
    accessStoreMock.accessToken = null

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    await store.logout(false)

    expect(logoutApiMock).not.toHaveBeenCalled()
    expect(resetAllStoresMock).toHaveBeenCalledTimes(1)
    expect(replaceMock).toHaveBeenCalledTimes(1)
  })

  it('attaches client device hints to the primary login request', async () => {
    loginApiMock.mockResolvedValue({
      status: 'MFA_REQUIRED',
      nextStep: 'COMPLETE_MFA',
      challenge: { challengeId: 'challenge-1' }
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    await store.authLogin({
      username: 'alice@example.com',
      password: 'secret-1'
    })

    expect(loginApiMock).toHaveBeenCalledWith({
      credential: 'secret-1',
      device: {
        deviceId: 'device-1',
        deviceName: 'Firefox on macOS'
      },
      identifier: 'alice@example.com',
      method: 'EMAIL_PASSWORD'
    })
    expect(pushMock).toHaveBeenCalledWith({ name: 'CompleteMfa' })
  })

  it('blocks terminal access denials without continuing the login flow', async () => {
    const { message } = await import('ant-design-vue')
    loginApiMock.mockResolvedValue({
      status: 'DENIED',
      nextStep: 'NONE',
      reasonCode: 'TERMINAL_ACCESS_DENIED',
      message: 'Current terminal is not allowed.'
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    await expect(
      store.authLogin({
        username: 'worker@example.com',
        password: 'secret-1'
      })
    ).resolves.toEqual({ userInfo: null })

    expect(message.error).toHaveBeenCalledWith('当前账号不允许从 Web 端登录。')
    expect(pushMock).not.toHaveBeenCalled()
    expect(accessStoreMock.setAccessToken).not.toHaveBeenCalled()
    expect(getSessionContextApiMock).not.toHaveBeenCalled()
  })

  it('stores the default MFA factor without treating email OTP as sent before an explicit challenge request', async () => {
    loginApiMock.mockResolvedValue({
      status: 'MFA_REQUIRED',
      nextStep: 'COMPLETE_MFA',
      challenge: {
        challengeId: 'challenge-1',
        defaultFactor: 'EMAIL_OTP',
        availableFactors: [
          { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
          { type: 'TOTP', label: '认证器 App', priority: 2 },
          { type: 'BACKUP_CODE', label: '恢复码', priority: 4 }
        ]
      }
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    await store.authLogin({
      username: 'alice@example.com',
      password: 'secret-1'
    })

    expect(store.pendingMfaFactor).toBe('EMAIL_OTP')
    expect(store.pendingMfaAvailableFactors).toEqual([
      { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
      { type: 'TOTP', label: '认证器 App', priority: 2 },
      { type: 'BACKUP_CODE', label: '恢复码', priority: 4 }
    ])
    expect(store.pendingMfaFactorChallengeId).toBe('')
    expect(store.pendingMfaDestination).toBe('')
    expect(store.pendingMfaResendCooldown).toBe(0)
  })

  it('keeps factor order stable when switching to another MFA factor', async () => {
    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    store.pendingChallengeId = 'challenge-1'
    store.pendingMfaFactor = 'EMAIL_OTP'
    store.pendingMfaAvailableFactors = [
      { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
      { type: 'TOTP', label: '认证器 App', priority: 2 },
      { type: 'BACKUP_CODE', label: '恢复码', priority: 4 }
    ]
    store.pendingMfaFactorChallengeId = 'factor-1'
    store.pendingMfaDestination = 'a***@example.com'

    await store.switchPendingMfaFactor('TOTP')

    expect(store.pendingMfaFactor).toBe('TOTP')
    expect(store.pendingMfaAvailableFactors.map((item) => item.type)).toEqual([
      'EMAIL_OTP',
      'TOTP',
      'BACKUP_CODE'
    ])
    expect(requestMfaFactorChallengeApiMock).not.toHaveBeenCalled()
    expect(store.pendingMfaFactorChallengeId).toBe('')
    expect(store.pendingMfaDestination).toBe('')

    await store.switchPendingMfaFactor('EMAIL_OTP')

    expect(requestMfaFactorChallengeApiMock).not.toHaveBeenCalled()
    expect(store.pendingMfaFactor).toBe('EMAIL_OTP')
    expect(store.pendingMfaAvailableFactors.map((item) => item.type)).toEqual([
      'EMAIL_OTP',
      'TOTP',
      'BACKUP_CODE'
    ])
    expect(store.pendingMfaFactorChallengeId).toBe('')
    expect(store.pendingMfaDestination).toBe('')
  })

  it('cycles MFA factors in policy order and wraps back to the first factor', async () => {
    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    store.pendingChallengeId = 'challenge-1'
    store.pendingMfaFactor = 'EMAIL_OTP'
    store.pendingMfaAvailableFactors = [
      { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
      { type: 'TOTP', label: '认证器 App', priority: 2 },
      { type: 'BACKUP_CODE', label: '恢复码', priority: 4 }
    ]
    store.pendingMfaFactorChallengeId = 'factor-1'
    store.pendingMfaDestination = 'a***@example.com'

    await store.cyclePendingMfaFactor()
    expect(store.pendingMfaFactor).toBe('TOTP')
    expect(store.pendingMfaFactorChallengeId).toBe('')
    expect(requestMfaFactorChallengeApiMock).not.toHaveBeenCalled()

    await store.cyclePendingMfaFactor()
    expect(store.pendingMfaFactor).toBe('BACKUP_CODE')

    await store.cyclePendingMfaFactor()
    expect(store.pendingMfaFactor).toBe('EMAIL_OTP')
    expect(requestMfaFactorChallengeApiMock).not.toHaveBeenCalled()
  })

  it('shows a follow-up security reminder after first-login password setup completes', async () => {
    const { message, notification } = await import('ant-design-vue')
    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    completeFirstLoginPasswordSetupApiMock.mockResolvedValue(undefined)
    userStoreMock.userInfo = {
      ...userStoreMock.userInfo,
      homePath: '/tenant/workbench'
    }
    authContextStoreMock.sessionContext = {
      ...authContextStoreMock.sessionContext,
      passwordSetupRequired: true
    }

    await store.completeFirstLoginPasswordSetup({
      newPassword: 'Secret123!',
      confirmPassword: 'Secret123!'
    })

    expect(completeFirstLoginPasswordSetupApiMock).toHaveBeenCalledWith({
      newPassword: 'Secret123!',
      confirmPassword: 'Secret123!'
    })
    expect(replaceMock).toHaveBeenCalledWith('/tenant/workbench')
    expect(message.success).toHaveBeenCalledWith('密码已设置')
    expect(notification.warning).toHaveBeenCalledWith({
      message: '安全提醒',
      description: '当前账号仍建议尽快配置 MFA，以便后续新设备登录时完成独立二次验证。'
    })
  })

  it('requests the active email MFA factor challenge only after the explicit send step', async () => {
    requestMfaFactorChallengeApiMock.mockResolvedValue({
      challengeId: 'factor-2',
      destination: 'alice@example.com',
      expiresAt: '2026-04-22T10:00:00.000Z'
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    store.pendingChallengeId = 'challenge-1'
    store.pendingMfaFactor = 'EMAIL_OTP'
    store.pendingMfaAvailableFactors = [
      { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
      { type: 'TOTP', label: '认证器 App', priority: 2 }
    ]

    await store.requestPendingMfaFactorChallenge()

    expect(requestMfaFactorChallengeApiMock).toHaveBeenCalledWith({
      challengeId: 'challenge-1',
      factor: 'EMAIL_OTP'
    })
    expect(store.pendingMfaFactorChallengeId).toBe('factor-2')
    expect(store.pendingMfaDestination).toBe('alice@example.com')
  })

  it('does not auto-request the sms MFA factor challenge when switching to sms', async () => {
    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    store.pendingChallengeId = 'challenge-1'
    store.pendingMfaFactor = 'EMAIL_OTP'
    store.pendingMfaAvailableFactors = [
      { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
      { type: 'SMS_OTP', label: '短信验证码', priority: 2 },
      { type: 'TOTP', label: '认证器 App', priority: 3 }
    ]
    store.pendingMfaFactorChallengeId = 'factor-1'
    store.pendingMfaDestination = 'a***@example.com'

    await store.switchPendingMfaFactor('SMS_OTP')

    expect(requestMfaFactorChallengeApiMock).not.toHaveBeenCalled()
    expect(store.pendingMfaFactor).toBe('SMS_OTP')
    expect(store.pendingMfaFactorChallengeId).toBe('')
    expect(store.pendingMfaDestination).toBe('')
  })

  it('requests the active sms MFA factor challenge only after the explicit send step', async () => {
    requestMfaFactorChallengeApiMock.mockResolvedValue({
      challengeId: 'factor-3',
      destination: '+8613912345678',
      expiresAt: '2026-04-22T10:00:00.000Z'
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    store.pendingChallengeId = 'challenge-1'
    store.pendingMfaFactor = 'SMS_OTP'
    store.pendingMfaAvailableFactors = [
      { type: 'SMS_OTP', label: '短信验证码', priority: 1 },
      { type: 'TOTP', label: '认证器 App', priority: 2 }
    ]

    await store.requestPendingMfaFactorChallenge()

    expect(requestMfaFactorChallengeApiMock).toHaveBeenCalledWith({
      challengeId: 'challenge-1',
      factor: 'SMS_OTP'
    })
    expect(store.pendingMfaFactorChallengeId).toBe('factor-3')
    expect(store.pendingMfaDestination).toBe('+8613912345678')
  })

  it('attaches client device hints when submitting account selection', async () => {
    selectAccountApiMock.mockResolvedValue({
      status: 'ACCOUNT_SELECTION_REQUIRED',
      nextStep: 'SELECT_ACCOUNT',
      accountOptions: [],
      operator: { userId: 'user-1' }
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()
    store.pendingUserId = 'user-1'
    store.pendingLoginMethod = 'EMAIL_PASSWORD'

    await store.submitAccountSelection('account-1')

    expect(selectAccountApiMock).toHaveBeenCalledWith({
      accountId: 'account-1',
      device: {
        deviceId: 'device-1',
        deviceName: 'Firefox on macOS'
      },
      loginMethod: 'EMAIL_PASSWORD',
      userId: 'user-1'
    })
  })

  it('requires the complete option, user, and login-method tuple for pending selection', async () => {
    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    store.accountSelectionOptions = [
      {
        accountId: 'account-1',
        displayName: 'Tenant Admin',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        tenantName: 'Tenant 1'
      }
    ]
    expect(store.hasPendingAccountSelection).toBe(false)

    store.pendingUserId = 'user-1'
    expect(store.hasPendingAccountSelection).toBe(false)

    store.pendingLoginMethod = 'EMAIL_PASSWORD'
    expect(store.hasPendingAccountSelection).toBe(true)

    store.resetPendingAuthFlow()
    expect(store.hasPendingAccountSelection).toBe(false)
  })

  it('consumes account-selection state when the selected account advances to MFA', async () => {
    selectAccountApiMock.mockResolvedValue({
      status: 'MFA_REQUIRED',
      challenge: {
        availableFactors: [
          { label: '认证器 App', priority: 1, type: 'TOTP' }
        ],
        challengeId: 'challenge-1',
        defaultFactor: 'TOTP',
        scenario: 'LOGIN'
      }
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()
    store.accountSelectionOptions = [
      {
        accountId: 'account-1',
        displayName: 'Tenant Admin',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        tenantName: 'Tenant 1'
      }
    ]
    store.pendingUserId = 'user-1'
    store.pendingLoginMethod = 'EMAIL_PASSWORD'

    await store.submitAccountSelection('account-1')

    expect(store.hasPendingAccountSelection).toBe(false)
    expect(store.pendingChallengeId).toBe('challenge-1')
    expect(store.pendingLoginMethod).toBe('EMAIL_PASSWORD')
    expect(pushMock).toHaveBeenCalledWith({ name: 'CompleteMfa' })
  })

  it('bounds an expired or consumed server selection response to one login restart', async () => {
    selectAccountApiMock.mockRejectedValue({
      response: {
        data: {
          code: 'AUTH_ACCOUNT_NOT_FOUND'
        },
        status: 409
      }
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()
    store.accountSelectionOptions = [
      {
        accountId: 'account-1',
        displayName: 'Tenant Admin',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        tenantName: 'Tenant 1'
      }
    ]
    store.pendingUserId = 'user-1'
    store.pendingLoginMethod = 'EMAIL_PASSWORD'

    await expect(store.submitAccountSelection('account-1')).resolves.toEqual({
      userInfo: null
    })

    expect(store.hasPendingAccountSelection).toBe(false)
    expect(replaceMock).toHaveBeenCalledWith({ name: 'Login' })
  })

  it.each([401, 409])(
    'preserves pending selection and propagates an unknown %s response',
    async (status) => {
      const conflict = {
        response: {
          data: {
            code: 'UNRELATED_SELECTION_CONFLICT'
          },
          status
        }
      }
      selectAccountApiMock.mockRejectedValue(conflict)

      const { useAuthStore } = await import('./auth')
      const store = useAuthStore()
      store.accountSelectionOptions = [
        {
          accountId: 'account-1',
          displayName: 'Tenant Admin',
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Tenant 1'
        }
      ]
      store.pendingUserId = 'user-1'
      store.pendingLoginMethod = 'EMAIL_PASSWORD'

      await expect(store.submitAccountSelection('account-1')).rejects.toBe(
        conflict
      )

      expect(store.hasPendingAccountSelection).toBe(true)
      expect(replaceMock).not.toHaveBeenCalledWith({ name: 'Login' })
    }
  )

  it('propagates post-selection session hydration conflicts without reclassifying them as stale selection', async () => {
    const hydrationConflict = {
      response: {
        data: {
          code: 'SESSION_CONTEXT_CONFLICT'
        },
        status: 409
      }
    }
    selectAccountApiMock.mockResolvedValue({
      operator: {
        accountId: 'account-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        userId: 'user-1'
      },
      session: {
        accessToken: 'new-access-token',
        expiresIn: 3600,
        refreshToken: 'new-refresh-token'
      },
      status: 'SUCCESS'
    })
    getSessionContextApiMock.mockRejectedValue(hydrationConflict)
    getSessionAccessSummaryApiMock.mockResolvedValue({
      actionCodes: [],
      roles: []
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()
    store.accountSelectionOptions = [
      {
        accountId: 'account-1',
        displayName: 'Tenant Admin',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        tenantName: 'Tenant 1'
      }
    ]
    store.pendingUserId = 'user-1'
    store.pendingLoginMethod = 'EMAIL_PASSWORD'

    await expect(store.submitAccountSelection('account-1')).rejects.toBe(
      hydrationConflict
    )

    expect(accessStoreMock.setAccessToken).toHaveBeenCalledWith(
      'new-access-token'
    )
    expect(accessStoreMock.setRefreshToken).toHaveBeenCalledWith(
      'new-refresh-token'
    )
    expect(store.hasPendingAccountSelection).toBe(true)
    expect(replaceMock).not.toHaveBeenCalledWith({ name: 'Login' })
  })

  it('redirects to the dedicated unavailable-mfa page when account selection hits no usable MFA factor', async () => {
    selectAccountApiMock.mockRejectedValue({
      response: {
        data: {
          code: 'AUTH_MFA_FACTOR_UNAVAILABLE',
          messageKey: 'auth.mfa_factor_unavailable'
        }
      }
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()
    store.pendingUserId = 'user-1'
    store.pendingLoginMethod = 'PHONE_OTP'

    await expect(store.submitAccountSelection('account-1')).resolves.toEqual({
      userInfo: null
    })

    expect(replaceMock).toHaveBeenCalledWith({ name: 'MfaFactorUnavailable' })
    expect(store.pendingChallengeId).toBe('')
    expect(store.pendingMfaFactor).toBe(null)
  })

  it('refreshes the current session navigation and rebuilds access state after governance changes', async () => {
    getSessionContextApiMock.mockResolvedValue({
      account: {
        accountId: 'account-1',
        name: 'System Admin'
      },
      navigation: {
        defaultEntry: 'admin.navigation-management',
        defaultHomePath: '/admin/navigation-management',
        visibleEntries: ['admin.navigation-management']
      },
      operator: {
        displayName: 'System Admin',
        userId: 'user-1'
      },
      scopeLevel: 'SYSTEM'
    })
    getSessionAccessSummaryApiMock.mockResolvedValue({
      actionCodes: ['permission.navigation.entry.update'],
      roles: [{ code: 'SYSTEM_ADMIN', roleId: 'role-1', name: '系统管理员' }]
    })
    generateAccessMock.mockResolvedValue({
      accessibleMenus: [{ name: 'NavigationManagement' }],
      accessibleRoutes: [{ name: 'NavigationManagement' }]
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    await store.refreshCurrentSessionAccess()

    expect(getSessionContextApiMock).toHaveBeenCalledTimes(1)
    expect(getSessionAccessSummaryApiMock).toHaveBeenCalledTimes(1)
    expect(authContextStoreMock.setAuthContext).toHaveBeenCalledTimes(1)
    expect(accessStoreMock.setAccessMenus).toHaveBeenCalledWith([
      { name: 'NavigationManagement' }
    ])
    expect(accessStoreMock.setAccessRoutes).toHaveBeenCalledWith([
      { name: 'NavigationManagement' }
    ])
    expect(userStoreMock.setUserInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        homePath: '/admin/navigation-management'
      })
    )
  })

  it('redirects away from the current page when its entry is no longer visible after refresh', async () => {
    routerMock.currentRoute.value.meta = {
      entryKey: 'admin.role-management'
    }

    getSessionContextApiMock.mockResolvedValue({
      account: {
        accountId: 'account-1',
        name: 'System Admin'
      },
      navigation: {
        defaultEntry: 'admin.navigation-management',
        defaultHomePath: '/admin/navigation-management',
        visibleEntries: ['admin.navigation-management']
      },
      operator: {
        displayName: 'System Admin',
        userId: 'user-1'
      },
      scopeLevel: 'SYSTEM'
    })
    getSessionAccessSummaryApiMock.mockResolvedValue({
      actionCodes: ['permission.navigation.entry.update'],
      roles: [{ code: 'SYSTEM_ADMIN', roleId: 'role-1', name: '系统管理员' }]
    })
    generateAccessMock.mockResolvedValue({
      accessibleMenus: [{ name: 'NavigationManagement' }],
      accessibleRoutes: [{ name: 'NavigationManagement' }]
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    await store.refreshCurrentSessionAccess()

    expect(replaceMock).toHaveBeenCalledWith('/admin/navigation-management')
  })

  it('rehydrates the current session when cached user info exists but access routes were not rebuilt', async () => {
    accessStoreMock.isAccessChecked = false
    getSessionContextApiMock.mockResolvedValue({
      account: {
        accountId: 'account-1',
        name: 'System Admin',
        scopeLevel: 'SYSTEM'
      },
      navigation: {
        defaultEntry: 'sales.quote-orders',
        defaultHomePath: '/sales/quote-orders',
        visibleEntries: ['sales.quote-orders']
      },
      operator: {
        displayName: 'System Admin',
        userId: 'user-1'
      },
      passwordSetupRequired: false,
      scopeLevel: 'SYSTEM'
    })
    getSessionAccessSummaryApiMock.mockResolvedValue({
      actionCodes: ['sales.quote.create'],
      roles: [{ code: 'SALES', roleId: 'role-1', name: '销售' }]
    })

    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    await store.fetchUserInfo()

    expect(getSessionContextApiMock).toHaveBeenCalledTimes(1)
    expect(getSessionAccessSummaryApiMock).toHaveBeenCalledTimes(1)
    expect(accessStoreMock.setAccessCodes).toHaveBeenCalledWith(['sales.quote.create'])
    expect(authContextStoreMock.setAuthContext).toHaveBeenCalledTimes(1)
  })

  it('keeps using the persisted permission snapshot when access routes are already checked', async () => {
    const { useAuthStore } = await import('./auth')
    const store = useAuthStore()

    await store.fetchUserInfo()

    expect(getSessionContextApiMock).not.toHaveBeenCalled()
    expect(getSessionAccessSummaryApiMock).not.toHaveBeenCalled()
    expect(accessStoreMock.setAccessCodes).not.toHaveBeenCalled()
    expect(authContextStoreMock.setAuthContext).not.toHaveBeenCalled()
    await expect(store.fetchUserInfo()).resolves.toEqual(userStoreMock.userInfo)
  })
})
