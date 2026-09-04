import { describe, expect, it, vi } from 'vitest'

import { createCrmSearchPageAutomation, isSupportedSearchPageUrl } from './crm-search-automation'

describe('CRM search page automation', () => {
  it('recognizes Google search result URLs only', () => {
    expect(isSupportedSearchPageUrl('https://www.google.com/search?q=ceramic+fixtures')).toBe(true)
    expect(isSupportedSearchPageUrl('https://www.google.com/search?q=ceramic+fixtures&tbm=isch')).toBe(false)
    expect(isSupportedSearchPageUrl('https://www.google.com/search?q=ceramic+fixtures&udm=2')).toBe(false)
    expect(isSupportedSearchPageUrl('https://www.google.com/maps?q=ceramic+fixtures')).toBe(false)
    expect(isSupportedSearchPageUrl('https://serrano.example/about')).toBe(false)
  })

  it('clears stale CRM tags on Google Images tab without resolving or annotating image results', async () => {
    const executeScript = vi.fn().mockResolvedValueOnce([{ result: { removedCount: 2 } }])
    const api = { resolveSearchResults: vi.fn() }
    const automation = createCrmSearchPageAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: {
            account: { accountId: 'acc-1' },
            tenant: { tenantId: 'tenant-1' }
          },
          refreshToken: 'refresh-token-1'
        })
      },
      executeScript,
      tenantWebBaseUrl: 'http://localhost:5771',
      workspacePreferences: {
        isEnabled: vi.fn().mockResolvedValue(true)
      }
    })

    await expect(
      automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=console+sink&tbm=isch' })
    ).resolves.toEqual({ annotatedCount: 0, skipped: true })

    expect(api.resolveSearchResults).not.toHaveBeenCalled()
    expect(executeScript).toHaveBeenCalledTimes(1)
    expect(executeScript.mock.calls[0]?.[0].func.name).toBe('clearCrmSearchResultsAnnotationsInCurrentDocument')
  })

  it('automatically resolves and annotates Google results when CRM is enabled', async () => {
    const executeScript = vi.fn()
      .mockResolvedValueOnce([
        {
          result: { installed: true, skipped: false }
        }
      ])
      .mockResolvedValueOnce([
        {
          result: {
            searchResults: {
              capturedAt: '2026-06-23T00:00:00.000Z',
              query: 'ceramic fixtures',
              results: [
                {
                  domain: 'serrano.example',
                  title: 'Serrano Fixtures',
                  url: 'https://serrano.example/about'
                }
              ],
              searchEngine: 'GOOGLE'
            }
          }
        }
      ])
      .mockResolvedValueOnce([{ result: { annotatedCount: 1 } }])
    const api = {
      resolveSearchResults: vi.fn().mockResolvedValue({
        results: [
          {
            domain: 'serrano.example',
            status: 'CUSTOMER',
            summary: { displayName: 'Serrano Fixtures', label: 'Customer' },
            title: 'Serrano Fixtures',
            url: 'https://serrano.example/about'
          }
        ]
      })
    }

    const automation = createCrmSearchPageAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: {
            account: { accountId: 'acc-1' },
            tenant: { tenantId: 'tenant-1' }
          },
          refreshToken: 'refresh-token-1'
        })
      },
      executeScript,
      tenantWebBaseUrl: 'http://localhost:5771',
      workspacePreferences: {
        isEnabled: vi.fn().mockResolvedValue(true)
      }
    })

    await expect(
      automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=ceramic+fixtures' })
    ).resolves.toEqual({ annotatedCount: 1, skipped: false })

    expect(api.resolveSearchResults).toHaveBeenCalledWith({
      capturedAt: '2026-06-23T00:00:00.000Z',
      query: 'ceramic fixtures',
      results: [
        {
          domain: 'serrano.example',
          title: 'Serrano Fixtures',
          url: 'https://serrano.example/about'
        }
      ],
      searchEngine: 'GOOGLE'
    })
    expect(executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [
          expect.objectContaining({
            results: [expect.objectContaining({ status: 'CUSTOMER' })],
            tenantWebBaseUrl: 'http://localhost:5771'
          })
        ],
        target: { tabId: 7 }
      })
    )
    expect(executeScript.mock.calls[0]?.[0].func.name).toBe('installCrmSearchAutoRequestInCurrentDocument')
  })

  it('does not scan Google pages while CRM is disabled for the current tenant account', async () => {
    const executeScript = vi.fn()
    const api = { resolveSearchResults: vi.fn() }
    const automation = createCrmSearchPageAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: {
            account: { accountId: 'acc-1' },
            tenant: { tenantId: 'tenant-1' }
          },
          refreshToken: 'refresh-token-1'
        })
      },
      executeScript,
      tenantWebBaseUrl: 'http://localhost:5771',
      workspacePreferences: {
        isEnabled: vi.fn().mockResolvedValue(false)
      }
    })

    await expect(
      automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=ceramic+fixtures' })
    ).resolves.toEqual({ annotatedCount: 0, skipped: true })

    expect(api.resolveSearchResults).not.toHaveBeenCalled()
    expect(executeScript).not.toHaveBeenCalled()
  })

  it('keeps multiple resolved search candidates through the automatic annotation pipeline', async () => {
    const executeScript = vi.fn()
      .mockResolvedValueOnce([
        {
          result: { installed: true, skipped: false }
        }
      ])
      .mockResolvedValueOnce([
        {
          result: {
            searchResults: {
              capturedAt: '2026-06-23T00:00:00.000Z',
              query: 'console sink',
              results: [
                { domain: 'owned-console.example', title: 'Owned Console Sink', url: 'https://owned-console.example' },
                { domain: 'customer-console.example', title: 'Customer Console Sink', url: 'https://customer-console.example' },
                { domain: 'pool-console.example', title: 'Pool Console Sink', url: 'https://pool-console.example' }
              ],
              searchEngine: 'GOOGLE'
            }
          }
        }
      ])
      .mockResolvedValueOnce([{ result: { annotatedCount: 3 } }])
    const api = {
      resolveSearchResults: vi.fn().mockResolvedValue({
        results: [
          { status: 'OWNED_LEAD', title: 'Owned Console Sink', url: 'https://owned-console.example' },
          { status: 'CUSTOMER', title: 'Customer Console Sink', url: 'https://customer-console.example' },
          { status: 'POOL_LEAD', title: 'Pool Console Sink', url: 'https://pool-console.example' }
        ]
      })
    }

    const automation = createCrmSearchPageAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } },
          refreshToken: 'refresh-token-1'
        })
      },
      executeScript,
      tenantWebBaseUrl: 'http://localhost:5771',
      workspacePreferences: { isEnabled: vi.fn().mockResolvedValue(true) }
    })

    await expect(
      automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=console+sink' })
    ).resolves.toEqual({ annotatedCount: 3, skipped: false })

    expect(api.resolveSearchResults).toHaveBeenCalledWith(
      expect.objectContaining({
        results: [
          expect.objectContaining({ domain: 'owned-console.example' }),
          expect.objectContaining({ domain: 'customer-console.example' }),
          expect.objectContaining({ domain: 'pool-console.example' })
        ]
      })
    )
    expect(executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [
          expect.objectContaining({
            results: [
              expect.objectContaining({ status: 'OWNED_LEAD' }),
              expect.objectContaining({ status: 'CUSTOMER' }),
              expect.objectContaining({ status: 'POOL_LEAD' })
            ]
          })
        ]
      })
    )
  })

  it('reuses resolved results for repeated identical Google mutations without hitting the BFF again', async () => {
    const executeScript = vi.fn()
      .mockResolvedValueOnce([{ result: { installed: true, skipped: false } }])
      .mockResolvedValueOnce([
        {
          result: {
            searchResults: {
              capturedAt: '2026-06-23T00:00:00.000Z',
              query: 'console sink',
              results: [{ domain: 'console.example', title: 'Console Sink', url: 'https://console.example' }],
              searchEngine: 'GOOGLE'
            }
          }
        }
      ])
      .mockResolvedValueOnce([{ result: { annotatedCount: 1 } }])
      .mockResolvedValueOnce([{ result: { installed: true, skipped: false } }])
      .mockResolvedValueOnce([
        {
          result: {
            searchResults: {
              capturedAt: '2026-06-23T00:00:01.000Z',
              query: 'console sink',
              results: [{ domain: 'console.example', title: 'Console Sink', url: 'https://console.example' }],
              searchEngine: 'GOOGLE'
            }
          }
        }
      ])
      .mockResolvedValueOnce([{ result: { annotatedCount: 1 } }])
    const api = {
      resolveSearchResults: vi.fn().mockResolvedValue({
        results: [{ status: 'CUSTOMER', title: 'Console Sink', url: 'https://console.example' }]
      })
    }
    const automation = createCrmSearchPageAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } },
          refreshToken: 'refresh-token-1'
        })
      },
      executeScript,
      tenantWebBaseUrl: 'http://localhost:5771',
      workspacePreferences: { isEnabled: vi.fn().mockResolvedValue(true) }
    })

    await expect(
      automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=console+sink' })
    ).resolves.toEqual({ annotatedCount: 1, skipped: false })
    await expect(
      automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=console+sink' })
    ).resolves.toEqual({ annotatedCount: 1, skipped: false })

    expect(api.resolveSearchResults).toHaveBeenCalledTimes(1)
    expect(executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [
          expect.objectContaining({
            results: [expect.objectContaining({ status: 'CUSTOMER' })]
          })
        ]
      })
    )
  })

  it('deduplicates concurrent identical automatic annotations before the first cache write', async () => {
    let resolveBff: ((value: unknown) => void) | undefined
    const executeScript = vi.fn().mockImplementation((options: { func: { name?: string } }) => {
      if (options.func.name === 'installCrmSearchAutoRequestInCurrentDocument') {
        return Promise.resolve([{ result: { installed: true, skipped: false } }])
      }
      if (options.func.name === 'collectCurrentPageSignals') {
        return Promise.resolve([
          {
            result: {
              searchResults: {
                capturedAt: '2026-06-23T00:00:00.000Z',
                query: 'console sink',
                results: [{ domain: 'console.example', title: 'Console Sink', url: 'https://console.example' }],
                searchEngine: 'GOOGLE'
              }
            }
          }
        ])
      }
      return Promise.resolve([{ result: { annotatedCount: 1 } }])
    })
    const api = {
      resolveSearchResults: vi.fn().mockImplementation(() => new Promise((resolve) => {
        resolveBff = resolve
      }))
    }
    const automation = createCrmSearchPageAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } },
          refreshToken: 'refresh-token-1'
        })
      },
      executeScript,
      tenantWebBaseUrl: 'http://localhost:5771',
      workspacePreferences: { isEnabled: vi.fn().mockResolvedValue(true) }
    })

    const first = automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=console+sink' })
    const second = automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=console+sink' })
    await vi.waitFor(() => expect(api.resolveSearchResults).toHaveBeenCalledTimes(1))
    resolveBff?.({ results: [{ status: 'CUSTOMER', title: 'Console Sink', url: 'https://console.example' }] })

    await expect(Promise.all([first, second])).resolves.toEqual([
      { annotatedCount: 1, skipped: false },
      { annotatedCount: 1, skipped: false }
    ])
    expect(api.resolveSearchResults).toHaveBeenCalledTimes(1)
  })

  it('resolves expanded Google image candidates separately while an older resolve is still in flight', async () => {
    const resolveBffCalls: Array<(value: unknown) => void> = []
    const executeScript = vi.fn().mockImplementation((options: { func: { name?: string } }) => {
      if (options.func.name === 'installCrmSearchAutoRequestInCurrentDocument') {
        return Promise.resolve([{ result: { installed: true, skipped: false } }])
      }
      if (options.func.name === 'collectCurrentPageSignals') {
        const callIndex = executeScript.mock.calls.filter((call) =>
          call[0]?.func?.name === 'collectCurrentPageSignals'
        ).length
        const results = callIndex === 1
          ? [{ domain: 'signaturehardware.example', title: 'Signature Hardware', url: 'https://signaturehardware.example/a' }]
          : [
            { domain: 'signaturehardware.example', title: 'Signature Hardware', url: 'https://signaturehardware.example/a' },
            { domain: 'rejuvenation.example', title: 'Rejuvenation', url: 'https://rejuvenation.example/b' }
          ]
        return Promise.resolve([
          {
            result: {
              searchResults: {
                capturedAt: '2026-06-26T14:00:00.000Z',
                query: 'console sink',
                results,
                searchEngine: 'GOOGLE'
              }
            }
          }
        ])
      }
      return Promise.resolve([{ result: { annotatedCount: 1 } }])
    })
    const api = {
      resolveSearchResults: vi.fn().mockImplementation(() => new Promise((resolve) => {
        resolveBffCalls.push(resolve)
      }))
    }
    const automation = createCrmSearchPageAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } },
          refreshToken: 'refresh-token-1'
        })
      },
      executeScript,
      tenantWebBaseUrl: 'http://localhost:5771',
      workspacePreferences: { isEnabled: vi.fn().mockResolvedValue(true) }
    })

    const first = automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=console+sink' })
    const second = automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=console+sink' })
    await vi.waitFor(() => expect(api.resolveSearchResults).toHaveBeenCalledTimes(2))

    resolveBffCalls[0]?.({ results: [{ status: 'CUSTOMER', title: 'Signature Hardware', url: 'https://signaturehardware.example/a' }] })
    resolveBffCalls[1]?.({
      results: [
        { status: 'CUSTOMER', title: 'Signature Hardware', url: 'https://signaturehardware.example/a' },
        { status: 'POOL_LEAD', title: 'Rejuvenation', url: 'https://rejuvenation.example/b' }
      ]
    })

    await expect(Promise.all([first, second])).resolves.toEqual([
      { annotatedCount: 1, skipped: false },
      { annotatedCount: 1, skipped: false }
    ])
    expect(api.resolveSearchResults).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        results: [
          expect.objectContaining({ domain: 'signaturehardware.example' }),
          expect.objectContaining({ domain: 'rejuvenation.example' })
        ]
      })
    )
  })

  it('backs off after a throttled BFF response instead of retrying immediately', async () => {
    const executeScript = vi.fn().mockImplementation((options: { func: { name?: string } }) => {
      if (options.func.name === 'installCrmSearchAutoRequestInCurrentDocument') {
        return Promise.resolve([{ result: { installed: true, skipped: false } }])
      }
      if (options.func.name === 'collectCurrentPageSignals') {
        return Promise.resolve([
          {
            result: {
              searchResults: {
                capturedAt: '2026-06-23T00:00:00.000Z',
                query: 'console sink',
                results: [{ domain: 'console.example', title: 'Console Sink', url: 'https://console.example' }],
                searchEngine: 'GOOGLE'
              }
            }
          }
        ])
      }
      return Promise.resolve([{ result: { annotatedCount: 0 } }])
    })
    const api = {
      resolveSearchResults: vi.fn()
        .mockRejectedValueOnce(new Error('ThrottlerException: Too Many Requests'))
        .mockResolvedValue({ results: [{ status: 'CUSTOMER', title: 'Console Sink', url: 'https://console.example' }] })
    }
    const automation = createCrmSearchPageAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } },
          refreshToken: 'refresh-token-1'
        })
      },
      executeScript,
      tenantWebBaseUrl: 'http://localhost:5771',
      workspacePreferences: { isEnabled: vi.fn().mockResolvedValue(true) }
    })

    await expect(
      automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=console+sink' })
    ).resolves.toMatchObject({ annotatedCount: 0, skipped: true })
    await expect(
      automation.annotateTab({ id: 7, url: 'https://www.google.com/search?q=console+sink' })
    ).resolves.toEqual({ annotatedCount: 0, skipped: true })

    expect(api.resolveSearchResults).toHaveBeenCalledTimes(1)
  })
})
