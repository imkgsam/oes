/* @vitest-environment happy-dom */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@vben/hooks', () => ({
  useAppConfig: () => ({
    apiURL: '/api'
  })
}))

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      enableRefreshToken: true,
      locale: 'zh-CN',
      loginExpiredMode: 'page'
    }
  }
}))

vi.mock('@vben/request', async () => {
  const actual = await vi.importActual<typeof import('@vben/request')>('@vben/request')
  return actual
})

vi.mock('#/store', () => ({
  useAuthStore: () => ({
    logout: vi.fn()
  })
}))

vi.mock('ant-design-vue', () => ({
  message: {
    error: vi.fn()
  }
}))

vi.mock('./core', () => ({
  refreshTokenApi: vi.fn()
}))

// Verifies refresh uses the persisted token truth when another page has already rotated the session token pair.
describe('tenant-web request refresh token resolution', () => {
  beforeEach(() => {
    const storage = new Map<string, string>()
    ;(import.meta as any).env.VITE_APP_VERSION = '5.7.0'
    ;(import.meta as any).env.VITE_APP_NAMESPACE = undefined

    vi.stubGlobal('localStorage', {
      clear() {
        storage.clear()
      },
      getItem(key: string) {
        return storage.has(key) ? storage.get(key)! : null
      },
      key(index: number) {
        return [...storage.keys()][index] ?? null
      },
      get length() {
        return storage.size
      },
      removeItem(key: string) {
        storage.delete(key)
      },
      setItem(key: string, value: string) {
        storage.set(key, value)
      }
    })

    localStorage.clear()
    vi.resetModules()
  })

  it('prefers the persisted refresh token when memory still holds a stale token', async () => {
    const { resolveAccessStoreStorageKey, resolveRefreshTokenForRequestWithKey } =
      await import('./request')

    localStorage.setItem(
      resolveAccessStoreStorageKey({
        appVersion: '5.7.0',
        prod: false
      })!,
      JSON.stringify({
        accessToken: 'new-access-token',
        refreshToken: 'persisted-refresh-token'
      })
    )

    const setRefreshToken = vi.fn()

    const nextRefreshToken = resolveRefreshTokenForRequestWithKey(
      {
        refreshToken: 'stale-refresh-token',
        setRefreshToken
      },
      {
        appVersion: '5.7.0',
        prod: false
      }
    )

    expect(nextRefreshToken).toBe('persisted-refresh-token')
    expect(setRefreshToken).toHaveBeenCalledWith('persisted-refresh-token')
  })

  it('keeps using the in-memory refresh token when no persisted override exists', async () => {
    const setRefreshToken = vi.fn()
    const { resolveRefreshTokenForRequest } = await import('./request')

    const nextRefreshToken = resolveRefreshTokenForRequest({
      refreshToken: 'in-memory-refresh-token',
      setRefreshToken
    })

    expect(nextRefreshToken).toBe('in-memory-refresh-token')
    expect(setRefreshToken).not.toHaveBeenCalled()
  })

  it('uses the current tenant-web storage key instead of a stale legacy access store snapshot', async () => {
    const {
      resolveAccessStoreStorageKey,
      resolveAccessStoreStorageKeys,
      resolveRefreshTokenForRequestWithKey,
    } =
      await import('./request')

    const [currentKey, legacyKey] = resolveAccessStoreStorageKeys({
      appVersion: '5.7.0',
      prod: false
    })

    expect(currentKey).toBe(resolveAccessStoreStorageKey({
      appVersion: '5.7.0',
      prod: false
    }))

    localStorage.setItem(
      legacyKey!,
      JSON.stringify({
        refreshToken: 'legacy-refresh-token'
      })
    )
    localStorage.setItem(
      resolveAccessStoreStorageKey({
        appVersion: '5.7.0',
        prod: false
      })!,
      JSON.stringify({
        refreshToken: 'current-refresh-token'
      })
    )

    const setRefreshToken = vi.fn()

    const nextRefreshToken = resolveRefreshTokenForRequestWithKey(
      {
        refreshToken: 'stale-memory-token',
        setRefreshToken
      },
      {
        appVersion: '5.7.0',
        prod: false
      }
    )

    expect(nextRefreshToken).toBe('current-refresh-token')
    expect(setRefreshToken).toHaveBeenCalledWith('current-refresh-token')
  })

  it('falls back to the legacy undefined namespace key when the current key is absent', async () => {
    const { resolveAccessStoreStorageKeys, resolveRefreshTokenForRequestWithKey } =
      await import('./request')

    const [_currentKey, legacyKey] = resolveAccessStoreStorageKeys({
      appVersion: '5.7.0',
      prod: false
    })

    localStorage.setItem(
      legacyKey!,
      JSON.stringify({
        refreshToken: 'legacy-refresh-token'
      })
    )

    const setRefreshToken = vi.fn()
    const nextRefreshToken = resolveRefreshTokenForRequestWithKey(
      {
        refreshToken: 'stale-memory-token',
        setRefreshToken
      },
      {
        appVersion: '5.7.0',
        prod: false
      }
    )

    expect(nextRefreshToken).toBe('legacy-refresh-token')
    expect(setRefreshToken).toHaveBeenCalledWith('legacy-refresh-token')
  })
})

// Verifies auth recovery failures stay silent so token expiry does not spam the user with redundant errors.
describe('tenant-web request auth recovery error suppression', () => {
  it('suppresses expected auth recovery errors', async () => {
    const { shouldSuppressAuthRecoveryError } = await import('./request')

    expect(
      shouldSuppressAuthRecoveryError({
        response: {
          data: {
            code: 'APP_AUTH_004',
            messageKey: 'app.auth.jwt_invalid'
          },
          status: 401
        }
      })
    ).toBe(true)

    expect(
      shouldSuppressAuthRecoveryError({
        response: {
          data: {
            code: 'AUTH_MFA_FACTOR_UNAVAILABLE',
            messageKey: 'auth.mfa_factor_unavailable'
          },
          status: 400
        }
      })
    ).toBe(true)

    expect(
      shouldSuppressAuthRecoveryError({
        response: {
          data: {
            code: 'AUTH_REFRESH_TOKEN_INVALID',
            messageKey: 'auth.refresh_token_invalid'
          },
          status: 401
        }
      })
    ).toBe(true)
  })

  it('keeps business errors visible', async () => {
    const { shouldSuppressAuthRecoveryError } = await import('./request')

    expect(
      shouldSuppressAuthRecoveryError({
        response: {
          data: {
            code: 'APP_VALIDATION_001',
            messageKey: 'app.validation.failed'
          },
          status: 400
        }
      })
    ).toBe(false)
  })
})

// Verifies generic validation failures do not reuse login-only error copy in unrelated admin workflows.
describe('tenant-web request validation message mapping', () => {
  it('keeps APP_VALIDATION_001 as a generic form validation message', async () => {
    const { resolveUserFacingErrorMessage } = await import('./request')

    expect(
      resolveUserFacingErrorMessage(
        {
          code: 'APP_VALIDATION_001',
          message: 'Request validation failed'
        },
        'fallback'
      )
    ).toBe('请求数据校验失败，请检查输入后重试。')
  })

  it('maps unavailable login-scene MFA factors to a clear remediation hint', async () => {
    const { resolveUserFacingErrorMessage } = await import('./request')

    expect(
      resolveUserFacingErrorMessage(
        {
          code: 'AUTH_MFA_FACTOR_UNAVAILABLE',
          message: 'No available MFA factor can satisfy the current login challenge'
        },
        'fallback'
      )
    ).toBe('当前账号没有可用于本次登录验证的独立 MFA 因子，请改用密码登录后完成二次验证，或先配置其他 MFA 因子。')
  })
})

// Verifies refresh-response parsing reads the wrapped gateway payload instead of treating the envelope itself as the token body.
describe('tenant-web refresh session payload extraction', () => {
  it('extracts the nested refresh session payload from the gateway success envelope', async () => {
    const { extractRefreshSessionPayload } = await import('./request')

    expect(
      extractRefreshSessionPayload({
        data: {
          code: 'SYS_000000',
          data: {
            accessToken: 'next-access-token',
            expiresIn: 60,
            refreshToken: 'next-refresh-token',
            sessionId: 'session-1'
          }
        }
      })
    ).toEqual({
      accessToken: 'next-access-token',
      expiresIn: 60,
      refreshToken: 'next-refresh-token',
      sessionId: 'session-1'
    })
  })

  it('keeps supporting already-unwrapped refresh session payloads', async () => {
    const { extractRefreshSessionPayload } = await import('./request')

    expect(
      extractRefreshSessionPayload({
        data: {
          accessToken: 'next-access-token',
          expiresIn: 60,
          refreshToken: 'next-refresh-token',
          sessionId: 'session-1'
        }
      })
    ).toEqual({
      accessToken: 'next-access-token',
      expiresIn: 60,
      refreshToken: 'next-refresh-token',
      sessionId: 'session-1'
    })
  })
})
