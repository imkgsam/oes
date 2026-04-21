import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

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
const getSessionAccessSummaryApiMock = vi.fn()
const getSessionContextApiMock = vi.fn()
const generateAccessMock = vi.fn()
const accessStoreMock: {
  accessToken: null | string
  loginExpired: boolean
  setAccessMenus: ReturnType<typeof vi.fn>
  setAccessCodes: ReturnType<typeof vi.fn>
  setAccessToken: ReturnType<typeof vi.fn>
  setAccessRoutes: ReturnType<typeof vi.fn>
  setIsAccessChecked: ReturnType<typeof vi.fn>
  setLoginExpired: ReturnType<typeof vi.fn>
  setRefreshToken: ReturnType<typeof vi.fn>
} = {
  accessToken: 'access-token',
  loginExpired: false,
  setAccessMenus: vi.fn(),
  setAccessCodes: vi.fn(),
  setAccessToken: vi.fn(),
  setAccessRoutes: vi.fn(),
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
  completeMfaApi: vi.fn(),
  getSessionAccessSummaryApi: getSessionAccessSummaryApiMock,
  getSessionContextApi: getSessionContextApiMock,
  loginApi: loginApiMock,
  logoutApi: logoutApiMock,
  requestEmailOtpChallengeApi: vi.fn(),
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
    success: vi.fn()
  },
  notification: {
    success: vi.fn()
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
    getSessionAccessSummaryApiMock.mockReset()
    getSessionContextApiMock.mockReset()
    generateAccessMock.mockReset()
    accessStoreMock.accessToken = 'access-token'
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
})
