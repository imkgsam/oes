import { describe, expect, it, vi } from 'vitest'

import { createCrmOfficialSiteAutomation, isSupportedOfficialSiteUrl } from './crm-official-site-automation'

describe('CRM official-site automation', () => {
  it('recognizes customer website URLs without treating search pages as official sites', () => {
    expect(isSupportedOfficialSiteUrl('https://swissmadison.com/collections/console-sinks')).toBe(true)
    expect(isSupportedOfficialSiteUrl('https://swissmadison.com/collections/psc-console-sinks?srsltid=AfmBOoq5aiPA59jPDeL2CUQoJ_bTK044XsMEo9uxBB1NmV8j-L1UuHre')).toBe(true)
    expect(isSupportedOfficialSiteUrl('https://www.google.com/search?q=console+sink')).toBe(false)
    expect(isSupportedOfficialSiteUrl('chrome://extensions')).toBe(false)
  })

  it('resolves the current official site and injects a floating panel when the floating panel is enabled', async () => {
    const executeScript = vi.fn()
      .mockResolvedValueOnce([
        {
          result: {
            page: {
              capturedAt: '2026-06-24T00:00:00.000Z',
              companyNameCandidates: ['Swiss Madison'],
              domain: 'swissmadison.com',
              pageKind: 'OFFICIAL_SITE',
              selectedText: '',
              socialLinks: [],
              title: 'Swiss Madison',
              url: 'https://swissmadison.com/',
              visibleEmails: [],
              visiblePhones: []
            }
          }
        }
      ])
      .mockResolvedValueOnce([{ result: { rendered: true, skipped: false } }])
    const api = {
      resolvePageContext: vi.fn().mockResolvedValue({
        allowedActions: ['OPEN_OES_DETAIL'],
        matchedAccount: {
          crmAccountId: 'crm-swiss-1',
          displayName: 'Swiss Madison',
          lifecycleStage: 'LEAD',
          ownerKind: 'SELF',
          recordStatus: 'ACTIVE'
        },
        status: 'OWNED_LEAD'
      })
    }

    const automation = createCrmOfficialSiteAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } }
        })
      },
      executeScript,
      tenantWebBaseUrl: 'http://localhost:5771',
      workspacePreferences: {
        getPanelEnabled: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true)
      }
    })

    await expect(
      automation.renderTab({ id: 9, url: 'https://swissmadison.com/' })
    ).resolves.toEqual({ rendered: true, skipped: false })

    expect(api.resolvePageContext).toHaveBeenCalledWith({
      page: expect.objectContaining({
        domain: 'swissmadison.com',
        pageKind: 'OFFICIAL_SITE'
      })
    })
    expect(executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [
          expect.objectContaining({
            resolvedPage: expect.objectContaining({ status: 'OWNED_LEAD' }),
            tenantWebBaseUrl: 'http://localhost:5771'
          })
        ],
        target: { tabId: 9 }
      })
    )
  })

  it('uses the live official-site URL and domain when rendering a matched Swiss Madison collection page', async () => {
    const currentUrl = 'https://swissmadison.com/collections/psc-console-sinks?srsltid=AfmBOoq5aiPA59jPDeL2CUQoJ_bTK044XsMEo9uxBB1NmV8j-L1UuHre'
    const executeScript = vi.fn()
      .mockResolvedValueOnce([
        {
          result: {
            page: {
              capturedAt: '2026-06-24T00:00:00.000Z',
              companyNameCandidates: ['Swiss Madison'],
              domain: 'swissmadison.com',
              pageKind: 'OFFICIAL_SITE',
              selectedText: '',
              socialLinks: [],
              title: 'Console Sinks - Swiss Madison',
              url: currentUrl,
              visibleEmails: [],
              visiblePhones: []
            }
          }
        }
      ])
      .mockResolvedValueOnce([{ result: { rendered: true, skipped: false } }])
    const api = {
      resolvePageContext: vi.fn().mockResolvedValue({
        allowedActions: ['OPEN_OES_DETAIL'],
        matchedAccount: {
          crmAccountId: 'crm-swiss-1',
          displayName: 'Swiss Madison',
          lifecycleStage: 'LEAD',
          ownerKind: 'SELF',
          recordStatus: 'ACTIVE'
        },
        status: 'OWNED_LEAD'
      })
    }

    const automation = createCrmOfficialSiteAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } }
        })
      },
      executeScript,
      tenantWebBaseUrl: 'http://localhost:5771',
      workspacePreferences: {
        getPanelEnabled: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true)
      }
    })

    await expect(automation.renderTab({ id: 9, url: currentUrl })).resolves.toEqual({ rendered: true, skipped: false })

    expect(executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [
          expect.objectContaining({
            resolvedPage: expect.objectContaining({
              domain: 'swissmadison.com',
              title: 'Console Sinks - Swiss Madison',
              url: currentUrl
            })
          })
        ],
        target: { tabId: 9 }
      })
    )
  })

  it('preserves the Open OES action by synthesizing account deep links when the resolver omits them', async () => {
    const executeScript = vi.fn()
      .mockResolvedValueOnce([
        {
          result: {
            page: {
              capturedAt: '2026-06-24T00:00:00.000Z',
              companyNameCandidates: ['Swiss Madison'],
              domain: 'swissmadison.com',
              pageKind: 'OFFICIAL_SITE',
              selectedText: '',
              socialLinks: [],
              title: 'Swiss Madison',
              url: 'https://swissmadison.com/collections/psc-console-sinks',
              visibleEmails: [],
              visiblePhones: []
            }
          }
        }
      ])
      .mockResolvedValueOnce([{ result: { rendered: true, skipped: false } }])
    const api = {
      resolvePageContext: vi.fn().mockResolvedValue({
        allowedActions: ['OPEN_OES_DETAIL'],
        matchedAccount: {
          crmAccountId: 'crm-swiss-1',
          displayName: 'Swiss Madison',
          lifecycleStage: 'LEAD',
          ownerKind: 'SELF',
          recordStatus: 'ACTIVE'
        },
        status: 'OWNED_LEAD'
      })
    }

    const automation = createCrmOfficialSiteAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } }
        })
      },
      executeScript,
      tenantWebBaseUrl: 'http://localhost:5771',
      workspacePreferences: {
        getPanelEnabled: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true)
      }
    })

    await expect(automation.renderTab({ id: 9, url: 'https://swissmadison.com/collections/psc-console-sinks' })).resolves.toEqual({
      rendered: true,
      skipped: false
    })

    expect(executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [
          expect.objectContaining({
            resolvedPage: expect.objectContaining({
              deepLinks: { tenantWebCrmAccountUrl: '/crm/accounts/crm-swiss-1' }
            })
          })
        ],
        target: { tabId: 9 }
      })
    )
  })

  it('does not render the floating panel when CRM runtime is enabled but the panel is still opt-in disabled', async () => {
    const executeScript = vi.fn()
    const api = { resolvePageContext: vi.fn() }
    const automation = createCrmOfficialSiteAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } }
        })
      },
      executeScript,
      workspacePreferences: {
        getPanelEnabled: vi.fn().mockResolvedValue(null),
        isEnabled: vi.fn().mockResolvedValue(true)
      }
    })

    await expect(automation.renderTab({ id: 9, url: 'http://deervalleybath.com/collections/console-sink' })).resolves.toEqual({
      rendered: false,
      skipped: true
    })

    expect(api.resolvePageContext).not.toHaveBeenCalled()
    expect(executeScript).not.toHaveBeenCalled()
  })

  it('does not collect official-site signals while CRM is disabled', async () => {
    const executeScript = vi.fn()
    const api = { resolvePageContext: vi.fn() }
    const automation = createCrmOfficialSiteAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } }
        })
      },
      executeScript,
      workspacePreferences: { isEnabled: vi.fn().mockResolvedValue(false) }
    })

    await expect(automation.renderTab({ id: 9, url: 'https://swissmadison.com/' })).resolves.toEqual({
      rendered: false,
      skipped: true
    })

    expect(api.resolvePageContext).not.toHaveBeenCalled()
    expect(executeScript).not.toHaveBeenCalled()
  })

  it('lets the explicit floating-panel preference override legacy CRM runtime enablement', async () => {
    const executeScript = vi.fn()
    const api = { resolvePageContext: vi.fn() }
    const automation = createCrmOfficialSiteAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } }
        })
      },
      executeScript,
      workspacePreferences: {
        getPanelEnabled: vi.fn().mockResolvedValue(false),
        isEnabled: vi.fn().mockResolvedValue(true)
      }
    })

    await expect(automation.renderTab({ id: 9, url: 'https://swissmadison.com/' })).resolves.toEqual({
      rendered: false,
      skipped: true
    })

    expect(api.resolvePageContext).not.toHaveBeenCalled()
    expect(executeScript).not.toHaveBeenCalled()
  })

  it('skips rendering when the tab disappears during script execution or cleanup', async () => {
    const executeScript = vi.fn().mockRejectedValue(new Error('No tab with id: 1572973049'))
    const api = { resolvePageContext: vi.fn() }
    const automation = createCrmOfficialSiteAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } }
        })
      },
      executeScript,
      workspacePreferences: {
        getPanelEnabled: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true)
      }
    })

    await expect(automation.renderTab({ id: 1572973049, url: 'https://swissmadison.com/' })).resolves.toEqual({
      rendered: false,
      skipped: true
    })

    expect(api.resolvePageContext).not.toHaveBeenCalled()
    expect(executeScript).toHaveBeenCalledTimes(2)
  })

  it('clears the panel instead of rendering when the official site is not in CRM', async () => {
    const executeScript = vi.fn()
      .mockResolvedValueOnce([
        {
          result: {
            page: {
              capturedAt: '2026-06-24T00:00:00.000Z',
              companyNameCandidates: ['Unknown Example'],
              domain: 'unknown.example',
              pageKind: 'OFFICIAL_SITE',
              selectedText: '',
              socialLinks: [],
              title: 'Unknown Example',
              url: 'https://unknown.example/',
              visibleEmails: [],
              visiblePhones: []
            }
          }
        }
      ])
      .mockResolvedValueOnce([{ result: { removedCount: 1 } }])
    const api = {
      resolvePageContext: vi.fn().mockResolvedValue({
        allowedActions: ['CREATE_DRAFT_LEAD'],
        matchedAccount: null,
        status: 'UNKNOWN'
      })
    }
    const automation = createCrmOfficialSiteAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } }
        })
      },
      executeScript,
      workspacePreferences: {
        getPanelEnabled: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true)
      }
    })

    await expect(automation.renderTab({ id: 10, url: 'https://unknown.example/' })).resolves.toEqual({
      rendered: false,
      skipped: true
    })

    expect(executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        func: expect.any(Function),
        target: { tabId: 10 }
      })
    )
    expect(executeScript.mock.calls[1]?.[0].func.name).toBe('clearCrmOfficialSitePanelInCurrentDocument')
  })

  it('injects public context for other-owned CRM pages even when account details are restricted', async () => {
    const executeScript = vi.fn()
      .mockResolvedValueOnce([
        {
          result: {
            page: {
              capturedAt: '2026-06-24T00:00:00.000Z',
              companyNameCandidates: ['Other Owned Fixtures'],
              domain: 'other-owned.example',
              pageKind: 'OFFICIAL_SITE',
              selectedText: '',
              socialLinks: [],
              title: 'Other Owned Fixtures',
              url: 'https://other-owned.example/',
              visibleEmails: [],
              visiblePhones: []
            }
          }
        }
      ])
      .mockResolvedValueOnce([{ result: { rendered: true, skipped: false } }])
    const api = {
      resolvePageContext: vi.fn().mockResolvedValue({
        allowedActions: [],
        matchedAccount: null,
        status: 'OTHER_OWNER_LEAD',
        summary: {
          description: 'CRM status is available.',
          displayName: 'Other Owned Fixtures',
          label: 'OTHER_OWNER_LEAD',
          sensitivity: 'LOW'
        }
      })
    }
    const automation = createCrmOfficialSiteAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } }
        })
      },
      executeScript,
      workspacePreferences: {
        getPanelEnabled: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true)
      }
    })

    await expect(automation.renderTab({ id: 11, url: 'https://other-owned.example/' })).resolves.toEqual({
      rendered: true,
      skipped: false
    })

    expect(executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [
          expect.objectContaining({
            resolvedPage: expect.objectContaining({ status: 'OTHER_OWNER_LEAD' })
          })
        ],
        target: { tabId: 11 }
      })
    )
  })

  it('injects the floating panel for visible pool hints even when the resolved status is legacy unknown', async () => {
    const executeScript = vi.fn()
      .mockResolvedValueOnce([
        {
          result: {
            page: {
              capturedAt: '2026-06-24T00:00:00.000Z',
              companyNameCandidates: ['Pool Fixtures'],
              domain: 'pool.example',
              pageKind: 'OFFICIAL_SITE',
              selectedText: '',
              socialLinks: [],
              title: 'Pool Fixtures',
              url: 'https://pool.example/',
              visibleEmails: [],
              visiblePhones: []
            }
          }
        }
      ])
      .mockResolvedValueOnce([{ result: { rendered: true, skipped: false } }])
    const api = {
      resolvePageContext: vi.fn().mockResolvedValue({
        allowedActions: ['OPEN_OES_DETAIL'],
        duplicateHints: [
          {
            confidence: 'HIGH',
            crmAccountId: 'crm-pool-1',
            displayName: 'Pool Fixtures',
            lifecycleStage: 'LEAD',
            matchedFields: ['leadDomain'],
            ownerKind: 'POOL'
          }
        ],
        matchedAccount: null,
        status: 'UNKNOWN',
        summary: {
          description: 'CRM status is available.',
          displayName: 'Pool Fixtures',
          label: 'POOL_LEAD',
          sensitivity: 'LOW'
        }
      })
    }
    const automation = createCrmOfficialSiteAutomation({
      api,
      authStorage: {
        load: vi.fn().mockResolvedValue({
          accessToken: 'access-token-1',
          context: { account: { accountId: 'acc-1' }, tenant: { tenantId: 'tenant-1' } }
        })
      },
      executeScript,
      workspacePreferences: {
        getPanelEnabled: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true)
      }
    })

    await expect(automation.renderTab({ id: 12, url: 'https://pool.example/' })).resolves.toEqual({
      rendered: true,
      skipped: false
    })

    expect(executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [
          expect.objectContaining({
            resolvedPage: expect.objectContaining({
              duplicateHints: [expect.objectContaining({ ownerKind: 'POOL' })]
            })
          })
        ],
        target: { tabId: 12 }
      })
    )
  })
})
