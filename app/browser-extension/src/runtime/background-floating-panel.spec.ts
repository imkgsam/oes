import { afterEach, describe, expect, it, vi } from 'vitest'

import { SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE } from './messages'

describe('background floating panel capability boundary', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('does not use the floating-panel toggle to enable or disable search-result CRM tags', async () => {
    const chromeMock = createChromeMock()
    vi.stubGlobal('chrome', chromeMock)

    await import('./background')

    await sendRuntimeMessage(chromeMock, {
      enabled: true,
      type: SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE
    })
    await sendRuntimeMessage(chromeMock, {
      enabled: false,
      type: SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE
    })

    const writtenKeys = chromeMock.storage.local.set.mock.calls.flatMap(([value]) => Object.keys(value))
    const executedFunctionNames = chromeMock.scripting.executeScript.mock.calls.map(([options]) => options.func.name)

    expect(writtenKeys).toContain(
      'workspace-panel-enabled:tenant-1:account-1:extension.crm.workspace:crm-floating-panel'
    )
    expect(writtenKeys).not.toContain('workspace-enabled:tenant-1:account-1:extension.crm.workspace')
    expect(chromeMock.contextMenus.removeAll).not.toHaveBeenCalled()
    expect(executedFunctionNames).not.toContain('annotateCrmSearchResultsInCurrentDocument')
    expect(executedFunctionNames).not.toContain('clearCrmSearchResultsAnnotationsInCurrentDocument')
  })

  it('renders the floating panel from the latest tab snapshot after navigating into a lead website', async () => {
    vi.useFakeTimers()
    const chromeMock = createChromeMock()
    chromeMock.tabs.get.mockResolvedValue({
      id: 12,
      status: 'complete',
      url: 'https://lead.example/'
    })
    chromeMock.scripting.executeScript
      .mockResolvedValueOnce([
        {
          result: {
            page: {
              capturedAt: '2026-06-24T00:00:00.000Z',
              companyNameCandidates: ['Lead Example'],
              domain: 'lead.example',
              pageKind: 'OFFICIAL_SITE',
              selectedText: '',
              socialLinks: [],
              title: 'Lead Example',
              url: 'https://lead.example/',
              visibleEmails: [],
              visiblePhones: []
            }
          }
        }
      ])
      .mockResolvedValueOnce([{ result: { rendered: true, skipped: false } }])
    vi.stubGlobal('chrome', chromeMock)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: {
        allowedActions: ['OPEN_OES_DETAIL'],
        matchedAccount: {
          crmAccountId: 'crm-lead-1',
          displayName: 'Lead Example',
          lifecycleStage: 'LEAD',
          ownerKind: 'SELF',
          recordStatus: 'ACTIVE'
        },
        status: 'OWNED_LEAD'
      },
      success: true
    }))))

    await import('./background')
    chromeMock.__sendTabUpdated(12, { url: 'https://lead.example/' }, { id: 12, status: 'loading' })
    await vi.advanceTimersByTimeAsync(1_200)

    expect(chromeMock.tabs.get).toHaveBeenCalledWith(12)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:9101/api/v1/extension/crm/page-context/resolve',
      expect.objectContaining({ method: 'POST' })
    )
    expect(chromeMock.scripting.executeScript).toHaveBeenLastCalledWith(
      expect.objectContaining({
        args: [
          expect.objectContaining({
            resolvedPage: expect.objectContaining({ status: 'OWNED_LEAD' })
          })
        ],
        target: { tabId: 12 }
      })
    )
  })
})

function createChromeMock() {
  let runtimeListener: ((message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean) | undefined
  let tabUpdatedListener: ((tabId: number, changeInfo: { status?: string; url?: string }, tab: unknown) => void) | undefined
  const session = {
    accessToken: 'access-token-1',
    context: {
      account: { accountId: 'account-1' },
      tenant: { tenantId: 'tenant-1' }
    },
    refreshToken: 'refresh-token-1'
  }

  return {
    commands: {
      onCommand: { addListener: vi.fn() }
    },
    contextMenus: {
      create: vi.fn(),
      onClicked: { addListener: vi.fn() },
      removeAll: vi.fn().mockResolvedValue(undefined)
    },
    runtime: {
      onInstalled: { addListener: vi.fn() },
      onMessage: {
        addListener: vi.fn((listener) => {
          runtimeListener = listener
        })
      },
      sendMessage: vi.fn().mockResolvedValue({ ok: true })
    },
    scripting: {
      executeScript: vi.fn().mockResolvedValue([{ result: { removedCount: 1 } }])
    },
    sidePanel: {
      open: vi.fn().mockResolvedValue(undefined),
      setOptions: vi.fn().mockResolvedValue(undefined)
    },
    storage: {
      local: {
        get: vi.fn().mockImplementation(async (key) => {
          if (key === null) {
            return {}
          }
          if (key === 'oes.browserExtension.authSession') {
            return { 'oes.browserExtension.authSession': session }
          }
          if (key === 'workspace-enabled:tenant-1:account-1:extension.crm.workspace') {
            return { 'workspace-enabled:tenant-1:account-1:extension.crm.workspace': true }
          }
          if (key === 'workspace-panel-enabled:tenant-1:account-1:extension.crm.workspace:crm-floating-panel') {
            return { 'workspace-panel-enabled:tenant-1:account-1:extension.crm.workspace:crm-floating-panel': true }
          }
          return {}
        }),
        remove: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockResolvedValue(undefined)
      }
    },
    tabs: {
      get: vi.fn(),
      onActivated: { addListener: vi.fn() },
      onUpdated: {
        addListener: vi.fn((listener) => {
          tabUpdatedListener = listener
        })
      },
      query: vi.fn().mockImplementation(async (query) => {
        if (query?.active) {
          return [{ id: 7, url: 'https://www.google.com/search?q=console+sink', windowId: 11 }]
        }
        return []
      })
    },
    __sendRuntimeMessage: async (message: unknown) => {
      if (!runtimeListener) {
        throw new Error('runtime listener is missing')
      }
      return new Promise((resolve) => {
        runtimeListener?.(message, {}, resolve)
      })
    },
    __sendTabUpdated: (tabId: number, changeInfo: { status?: string; url?: string }, tab: unknown) => {
      if (!tabUpdatedListener) {
        throw new Error('tab updated listener is missing')
      }
      tabUpdatedListener(tabId, changeInfo, tab)
    }
  }
}

async function sendRuntimeMessage(
  chromeMock: ReturnType<typeof createChromeMock>,
  message: unknown
): Promise<unknown> {
  return chromeMock.__sendRuntimeMessage(message)
}
