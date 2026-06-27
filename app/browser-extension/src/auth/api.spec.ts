import { afterEach, describe, expect, it, vi } from 'vitest'

import { ExtensionAuthApi } from './api'

describe('ExtensionAuthApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls the browser fetch through globalThis so the host binding is preserved', async () => {
    const originalFetch = globalThis.fetch
    const fetchMock = vi.fn(function (this: typeof globalThis) {
      if (this !== globalThis) {
        throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation")
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              accountOptions: [],
              nextStep: 'NONE',
              session: null,
              status: 'ACCOUNT_SELECTION_REQUIRED'
            },
            success: true
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          }
        )
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const api = new ExtensionAuthApi({ baseUrl: 'http://localhost:9101/api/v1' })

    await expect(
      api.login({
        credential: 'Passw0rd!123',
        identifier: 'csp@ml.lc',
        method: 'EMAIL_PASSWORD'
      })
    ).resolves.toEqual({
      accountOptions: [],
      nextStep: 'NONE',
      session: null,
      status: 'ACCOUNT_SELECTION_REQUIRED'
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:9101/api/v1/extension/auth/login',
      expect.objectContaining({
        method: 'POST'
      })
    )

    vi.stubGlobal('fetch', originalFetch)
  })

  it('loads the extension session access summary with the bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            actionCodes: ['crm.account.read'],
            roleCodes: ['crm.sales']
          },
          success: true
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const api = new ExtensionAuthApi({ baseUrl: 'http://localhost:9101/api/v1' })

    await expect(api.getSessionAccessSummary('access-token-1')).resolves.toEqual({
      actionCodes: ['crm.account.read'],
      roleCodes: ['crm.sales']
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:9101/api/v1/extension/auth/session/access-summary',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token-1'
        }),
        method: 'GET'
      })
    )
  })
})
