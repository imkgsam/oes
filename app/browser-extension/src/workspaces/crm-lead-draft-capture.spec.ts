import { describe, expect, it, vi } from 'vitest'

import {
  buildLeadRequestFromDraft,
  createCaptureFromContextMenu,
  type CrmLeadCapturePayload
} from './crm-lead-drafts'
import type { PageSignals } from '../runtime/page-signals'

describe('CRM lead draft capture payloads', () => {
  const pageSignals: PageSignals = {
    capturedAt: '2026-06-23T08:00:00.000Z',
    companyNameCandidates: ['Serrano Fixtures', 'Serrano'],
    domain: 'source.example',
    pageKind: 'OFFICIAL_SITE',
    selectedText: '',
    socialLinks: [],
    title: 'Serrano Fixtures - Export Lighting',
    url: 'https://source.example/about',
    visibleEmails: ['imports@serrano.example'],
    visiblePhones: ['+1 312 847 1928']
  }

  it('builds a current-page capture from the right-click page entry', () => {
    const capture = createCaptureFromContextMenu({
      capturedAt: '2026-06-23T08:00:01.000Z',
      info: {
        menuItemId: 'oes-crm-create-lead-draft-page',
        pageUrl: 'https://source.example/about'
      },
      page: pageSignals
    })

    expect(capture).toEqual<CrmLeadCapturePayload>({
      browserContext: { entryPoint: 'CONTEXT_MENU', workspace: 'CRM' },
      capturedAt: '2026-06-23T08:00:01.000Z',
      captureKind: 'CURRENT_PAGE',
      companyNameCandidates: ['Serrano Fixtures', 'Serrano'],
      sourcePageTitle: 'Serrano Fixtures - Export Lighting',
      sourcePageUrl: 'https://source.example/about',
      targetDomain: 'source.example',
      targetTitle: 'Serrano Fixtures - Export Lighting',
      targetUrl: 'https://source.example/about',
      visibleEmails: ['imports@serrano.example'],
      visiblePhones: ['+1 312 847 1928']
    })
  })

  it('builds a link capture without treating selected text as enough evidence', () => {
    const capture = createCaptureFromContextMenu({
      capturedAt: '2026-06-23T08:00:02.000Z',
      info: {
        linkUrl: 'https://target.example/products/ceramic-sinks',
        menuItemId: 'oes-crm-create-lead-draft-link',
        pageUrl: 'https://source.example/search',
        selectionText: 'ignored highlighted copy'
      },
      page: pageSignals
    })

    expect(capture).toMatchObject({
      captureKind: 'LINK',
      sourcePageTitle: 'Serrano Fixtures - Export Lighting',
      sourcePageUrl: 'https://source.example/about',
      targetDomain: 'target.example',
      targetTitle: 'target.example',
      targetUrl: 'https://target.example/products/ceramic-sinks'
    })
    expect(capture).not.toHaveProperty('selectedText')
  })

  it('builds the CRM Draft Lead request with frozen browser extension source payload semantics', () => {
    const capture = createCaptureFromContextMenu({
      capturedAt: '2026-06-23T08:00:01.000Z',
      info: {
        menuItemId: 'oes-crm-create-lead-draft-page',
        pageUrl: 'https://source.example/about'
      },
      page: pageSignals
    })

    const request = buildLeadRequestFromDraft({
      capture,
      createdAt: '2026-06-23T08:00:03.000Z',
      dirty: false,
      draftId: 'draft-1',
      fields: {
        companyName: 'Serrano Fixtures',
        country: 'US',
        domain: 'source.example',
        email: 'imports@serrano.example',
        phone: '+1 312 847 1928',
        priority: 'B',
        sourceNote: 'Met at KBIS follow-up'
      },
      updatedAt: '2026-06-23T08:00:04.000Z'
    })

    expect(request).toEqual({
      capture,
      displayName: 'Serrano Fixtures',
      leadCompanyName: 'Serrano Fixtures',
      leadCountry: 'US',
      leadDomain: 'source.example',
      leadEmail: 'imports@serrano.example',
      leadPhone: '+1 312 847 1928',
      priority: 'B',
      sourceNote: 'Met at KBIS follow-up'
    })
  })

  it('does not expose a selection-text context menu entry', async () => {
    const contextMenus = {
      create: vi.fn(),
      removeAll: vi.fn().mockResolvedValue(undefined)
    }
    const { registerCrmLeadDraftContextMenus } = await import('../runtime/crm-lead-draft-context-menu')

    await registerCrmLeadDraftContextMenus(contextMenus as never)

    expect(contextMenus.create).toHaveBeenCalledWith(expect.objectContaining({ contexts: ['page'] }))
    expect(contextMenus.create).toHaveBeenCalledWith(expect.objectContaining({ contexts: ['link'] }))
    expect(contextMenus.create).not.toHaveBeenCalledWith(expect.objectContaining({ contexts: ['selection'] }))
  })
})
