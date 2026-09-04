import { describe, expect, it, vi } from 'vitest'

import { handleCrmLeadDraftContextMenuClick } from './crm-lead-draft-context-menu-flow'

describe('CRM Lead draft context-menu flow', () => {
  it('opens the side panel before awaiting auth, page capture, or duplicate check work', async () => {
    const calls: string[] = []
    let resolveAuth: (() => void) | undefined
    const authStorage = {
      load: vi.fn().mockImplementation(() => new Promise((resolve) => {
        resolveAuth = () => {
          calls.push('auth-resolved')
          resolve({
            context: {
              account: { accountId: 'account-1' },
              tenant: { tenantId: 'tenant-1' }
            }
          })
        }
      }))
    }
    const collectSignalsFromTab = vi.fn().mockResolvedValue({
      page: {
        capturedAt: '2026-06-24T00:00:00.000Z',
        companyNameCandidates: ['Serrano Fixtures'],
        domain: 'serrano.example',
        pageKind: 'OFFICIAL_SITE',
        selectedText: '',
        socialLinks: [],
        title: 'Serrano Fixtures',
        url: 'https://serrano.example',
        visibleEmails: [],
        visiblePhones: []
      }
    })
    const draftFlow = {
      beginCapture: vi.fn().mockResolvedValue({ status: 'DRAFT_READY' })
    }
    const openCrmWorkspace = vi.fn().mockImplementation(() => {
      calls.push('open-side-panel')
      return Promise.resolve()
    })

    const pending = handleCrmLeadDraftContextMenuClick({
      authStorage,
      collectSignalsFromTab,
      draftFlow,
      info: { menuItemId: 'oes-crm-create-lead-draft-page', pageUrl: 'https://serrano.example' },
      openCrmWorkspace,
      tab: { id: 7, windowId: 3 }
    })

    await Promise.resolve()
    expect(calls).toEqual(['open-side-panel'])
    expect(authStorage.load).not.toHaveBeenCalled()

    await vi.waitFor(() => expect(authStorage.load).toHaveBeenCalledOnce())
    resolveAuth?.()
    await pending

    expect(calls).toEqual(['open-side-panel', 'auth-resolved'])
    expect(collectSignalsFromTab).toHaveBeenCalledWith(7)
    expect(draftFlow.beginCapture).toHaveBeenCalledWith(
      { accountId: 'account-1', tenantId: 'tenant-1' },
      expect.objectContaining({ targetUrl: 'https://serrano.example' })
    )
  })

  it('stops quietly when the context-menu tab closes before page capture', async () => {
    const authStorage = {
      load: vi.fn().mockResolvedValue({
        context: {
          account: { accountId: 'account-1' },
          tenant: { tenantId: 'tenant-1' }
        }
      })
    }
    const collectSignalsFromTab = vi.fn().mockRejectedValue(new Error('No tab with id: 1572973049'))
    const draftFlow = {
      beginCapture: vi.fn()
    }
    const openCrmWorkspace = vi.fn().mockResolvedValue(undefined)

    await expect(handleCrmLeadDraftContextMenuClick({
      authStorage,
      collectSignalsFromTab,
      draftFlow,
      info: { menuItemId: 'oes-crm-create-lead-draft-page', pageUrl: 'https://serrano.example' },
      openCrmWorkspace,
      tab: { id: 1572973049, windowId: 3 }
    })).resolves.toBeUndefined()

    expect(openCrmWorkspace).toHaveBeenCalledOnce()
    expect(collectSignalsFromTab).toHaveBeenCalledWith(1572973049)
    expect(draftFlow.beginCapture).not.toHaveBeenCalled()
  })

  it('stops quietly when the context-menu tab closes while opening the side panel', async () => {
    const authStorage = {
      load: vi.fn()
    }
    const collectSignalsFromTab = vi.fn()
    const draftFlow = {
      beginCapture: vi.fn()
    }
    const openCrmWorkspace = vi.fn().mockRejectedValue(new Error('No tab with id: 1572973042.'))

    await expect(handleCrmLeadDraftContextMenuClick({
      authStorage,
      collectSignalsFromTab,
      draftFlow,
      info: { menuItemId: 'oes-crm-create-lead-draft-page', pageUrl: 'https://serrano.example' },
      openCrmWorkspace,
      tab: { id: 1572973042, windowId: 3 }
    })).resolves.toBeUndefined()

    expect(authStorage.load).not.toHaveBeenCalled()
    expect(collectSignalsFromTab).not.toHaveBeenCalled()
    expect(draftFlow.beginCapture).not.toHaveBeenCalled()
  })

  it('stops quietly when the current context does not provide page signals', async () => {
    const authStorage = {
      load: vi.fn().mockResolvedValue({
        context: {
          account: { accountId: 'account-1' },
          tenant: { tenantId: 'tenant-1' }
        }
      })
    }
    const collectSignalsFromTab = vi.fn().mockResolvedValue({
      searchResults: {
        capturedAt: '2026-06-24T00:00:00.000Z',
        query: 'console sinks',
        results: [],
        searchEngine: 'GOOGLE'
      }
    })
    const draftFlow = {
      beginCapture: vi.fn()
    }
    const openCrmWorkspace = vi.fn().mockResolvedValue(undefined)

    await expect(handleCrmLeadDraftContextMenuClick({
      authStorage,
      collectSignalsFromTab,
      draftFlow,
      info: { menuItemId: 'oes-crm-create-lead-draft-page', pageUrl: 'https://www.google.com/search?q=console+sinks' },
      openCrmWorkspace,
      tab: { id: 7, windowId: 3 }
    })).resolves.toBeUndefined()

    expect(draftFlow.beginCapture).not.toHaveBeenCalled()
  })

  it('stops quietly when page signal collection returns an expected error payload', async () => {
    const authStorage = {
      load: vi.fn().mockResolvedValue({
        context: {
          account: { accountId: 'account-1' },
          tenant: { tenantId: 'tenant-1' }
        }
      })
    }
    const collectSignalsFromTab = vi.fn().mockResolvedValue({ error: 'Page signals are unavailable' })
    const draftFlow = {
      beginCapture: vi.fn()
    }
    const openCrmWorkspace = vi.fn().mockResolvedValue(undefined)

    await expect(handleCrmLeadDraftContextMenuClick({
      authStorage,
      collectSignalsFromTab,
      draftFlow,
      info: { menuItemId: 'oes-crm-create-lead-draft-page', pageUrl: 'https://serrano.example' },
      openCrmWorkspace,
      tab: { id: 7, windowId: 3 }
    })).resolves.toBeUndefined()

    expect(draftFlow.beginCapture).not.toHaveBeenCalled()
  })
})
