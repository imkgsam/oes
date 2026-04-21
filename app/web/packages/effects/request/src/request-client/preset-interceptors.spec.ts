import { describe, expect, it, vi } from 'vitest'

import { authenticateResponseInterceptor } from './preset-interceptors'
import { RequestClient } from './request-client'

function create401Error(config: Record<string, any> = {}) {
  return {
    config: {
      headers: {},
      url: '/protected',
      ...config
    },
    response: {
      data: {
        code: 'APP_AUTH_004',
        messageKey: 'app.auth.jwt_invalid'
      },
      status: 401
    }
  }
}

// Verifies refresh failures release the refresh lock before re-authentication starts.
describe('authenticateResponseInterceptor', () => {
  it('clears refreshing state before running re-authentication after refresh failure', async () => {
    const client = new RequestClient()
    client.isRefreshing = false
    client.refreshTokenQueue = []

    const doReAuthenticate = vi.fn(async () => {
      expect(client.isRefreshing).toBe(false)
    })
    const refreshError = new Error('refresh token invalid')

    const interceptor = authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken: vi.fn().mockRejectedValue(refreshError),
      enableRefreshToken: true,
      formatToken: (token) => (token ? `Bearer ${token}` : null)
    })

    await expect(
      interceptor.rejected?.(create401Error({ url: '/sessions' }))
    ).rejects.toBe(refreshError)

    expect(doReAuthenticate).toHaveBeenCalledTimes(1)
  })

  it('does not treat a retried request failure as a refresh failure after refresh succeeds', async () => {
    const client = new RequestClient()
    client.isRefreshing = false
    client.refreshTokenQueue = []

    const retriedRequestError = new Error('retried request failed')
    const requestSpy = vi
      .spyOn(client, 'request')
      .mockRejectedValue(retriedRequestError)
    const doReAuthenticate = vi.fn()

    const interceptor = authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken: vi.fn().mockResolvedValue('next-access-token'),
      enableRefreshToken: true,
      formatToken: (token) => (token ? `Bearer ${token}` : null)
    })

    await expect(
      interceptor.rejected?.(
        create401Error({
          headers: {
            Authorization: 'Bearer stale-token'
          },
          url: '/personal-center'
        })
      )
    ).rejects.toBe(retriedRequestError)

    expect(doReAuthenticate).not.toHaveBeenCalled()
    expect(requestSpy).toHaveBeenCalledWith('/personal-center', {
      __isRetryRequest: true,
      __retryAfterRefresh: true,
      headers: {
        Authorization: 'Bearer next-access-token'
      },
      url: '/personal-center'
    })
  })

  it('does not force re-authentication when a post-refresh retry still returns 401', async () => {
    const client = new RequestClient()
    client.isRefreshing = false
    client.refreshTokenQueue = []

    const doReAuthenticate = vi.fn()

    const interceptor = authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken: vi.fn(),
      enableRefreshToken: true,
      formatToken: (token) => (token ? `Bearer ${token}` : null)
    })

    const retried401 = create401Error({
      __isRetryRequest: true,
      __retryAfterRefresh: true,
      headers: {
        Authorization: 'Bearer refreshed-token'
      },
      url: '/personal-center'
    })

    await expect(interceptor.rejected?.(retried401)).rejects.toBe(retried401)
    expect(doReAuthenticate).not.toHaveBeenCalled()
  })
})
