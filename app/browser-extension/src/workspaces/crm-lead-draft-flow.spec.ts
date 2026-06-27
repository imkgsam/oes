import { describe, expect, it, vi } from 'vitest'

import {
  CrmLeadDraftCaptureFlow,
  CrmLeadDraftStore,
  MemoryCrmLeadDraftStorage,
  type CrmLeadCapturePayload
} from './crm-lead-drafts'

describe('CRM lead draft capture flow', () => {
  const identity = { accountId: 'account-1', tenantId: 'tenant-1' }
  const capture: CrmLeadCapturePayload = {
    browserContext: { entryPoint: 'CONTEXT_MENU', workspace: 'CRM' },
    capturedAt: '2026-06-23T08:00:00.000Z',
    captureKind: 'LINK',
    companyNameCandidates: ['Serrano Fixtures'],
    sourcePageTitle: 'Search page',
    sourcePageUrl: 'https://google.example/search?q=serrano',
    targetDomain: 'serrano.example',
    targetTitle: 'serrano.example',
    targetUrl: 'https://serrano.example',
    visibleEmails: ['imports@serrano.example'],
    visiblePhones: []
  }

  it('creates an OES Draft Lead immediately for a link context-menu capture when duplicate check is clean', async () => {
    const api = {
      checkDuplicate: vi.fn().mockResolvedValue({
        allowedActions: ['CHECK_DUPLICATE', 'CREATE_DRAFT_LEAD'],
        duplicateResult: { candidates: [], resultType: 'NO_DUPLICATE' }
      }),
      createDraftLead: vi.fn().mockResolvedValue({
        crmAccount: {
          crmAccountId: 'oes-draft-1',
          displayName: 'Serrano Fixtures',
          leadDomain: 'serrano.example',
          recordStatus: 'DRAFT'
        }
      })
    }
    const store = new CrmLeadDraftStore(new MemoryCrmLeadDraftStorage(), () => '2026-06-23T08:00:01.000Z')
    const flow = new CrmLeadDraftCaptureFlow({ api, store })

    await expect(flow.beginCapture(identity, capture)).resolves.toEqual({
      draft: expect.objectContaining({
        capture: expect.objectContaining({ captureKind: 'LINK', targetUrl: 'https://serrano.example' }),
        draftId: 'oes-draft-1',
        oesDraft: expect.objectContaining({ crmAccountId: 'oes-draft-1' })
      }),
      status: 'DRAFT_READY'
    })

    expect(api.checkDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({
        capture,
        displayName: 'Serrano Fixtures',
        leadDomain: 'serrano.example'
      })
    )
    expect(api.createDraftLead).toHaveBeenCalledWith(
      expect.objectContaining({
        capture,
        displayName: 'Serrano Fixtures',
        leadDomain: 'serrano.example'
      })
    )
  })

  it('prompts a conflict when another unsaved active draft exists', async () => {
    const api = {
      checkDuplicate: vi.fn(),
      createDraftLead: vi.fn()
    }
    const store = new CrmLeadDraftStore(new MemoryCrmLeadDraftStorage(), () => '2026-06-23T08:00:01.000Z')
    const active = await store.createActiveDraft(identity, capture)
    await store.updateActiveDraft(identity, {
      ...active.fields,
      companyName: 'Unsaved Serrano',
      sourceNote: 'Captured from browser context'
    })
    const flow = new CrmLeadDraftCaptureFlow({ api, store })

    await expect(flow.beginCapture(identity, { ...capture, targetUrl: 'https://next.example' })).resolves.toEqual({
      activeDraft: expect.objectContaining({ draftId: active.draftId }),
      pendingCapture: expect.objectContaining({ targetUrl: 'https://next.example' }),
      status: 'ACTIVE_DRAFT_CONFLICT'
    })

    expect(api.checkDuplicate).not.toHaveBeenCalled()
  })

  it('saves the current active draft before creating a new draft from the pending capture', async () => {
    const store = new CrmLeadDraftStore(new MemoryCrmLeadDraftStorage(), () => '2026-06-23T08:00:01.000Z')
    const active = await store.createActiveDraft(identity, capture)
    const api = {
      checkDuplicate: vi.fn().mockResolvedValue({
        allowedActions: ['CHECK_DUPLICATE', 'CREATE_DRAFT_LEAD'],
        duplicateResult: { candidates: [], resultType: 'NO_DUPLICATE' }
      }),
      createDraftLead: vi.fn().mockResolvedValue({
        crmAccount: { crmAccountId: 'next-oes-draft', displayName: 'Next', recordStatus: 'DRAFT' }
      }),
      updateDraftLead: vi.fn().mockResolvedValue({ crmAccount: { crmAccountId: active.draftId } })
    }
    await store.updateActiveDraft(identity, {
      ...active.fields,
      companyName: 'Unsaved Serrano',
      sourceNote: 'Captured from browser context'
    })
    const flow = new CrmLeadDraftCaptureFlow({ api, store })

    await flow.beginCapture(identity, { ...capture, targetUrl: 'https://next.example', targetDomain: 'next.example' })
    await expect(flow.resolvePendingCapture(identity, 'SAVE_CURRENT_AND_CREATE_NEW')).resolves.toEqual(
      expect.objectContaining({ status: 'DRAFT_READY' })
    )

    expect(api.updateDraftLead).toHaveBeenCalledWith(
      'tenant-1',
      active.draftId,
      expect.objectContaining({ displayName: 'Unsaved Serrano' })
    )
    expect(api.updateDraftLead.mock.calls[0]?.[2]).not.toHaveProperty('capture')
    expect(api.updateDraftLead.mock.calls[0]?.[2]).not.toHaveProperty('sourceNote')
    await expect(store.loadActiveDraft(identity)).resolves.toEqual(
      expect.objectContaining({ capture: expect.objectContaining({ targetDomain: 'next.example' }) })
    )
  })

  it('blocks duplicate captures and does not create a draft form', async () => {
    const api = {
      checkDuplicate: vi.fn().mockResolvedValue({
        allowedActions: ['OPEN_OES_DETAIL'],
        duplicateResult: {
          candidates: [{ crmAccountId: 'crm-1', displayName: 'Serrano Fixtures', matchedFields: ['leadDomain'] }],
          resultType: 'OWNED_DUPLICATE'
        }
      }),
      createDraftLead: vi.fn()
    }
    const store = new CrmLeadDraftStore(new MemoryCrmLeadDraftStorage(), () => '2026-06-23T08:00:01.000Z')
    const flow = new CrmLeadDraftCaptureFlow({ api, store })

    await expect(flow.beginCapture(identity, capture)).resolves.toEqual({
      capture,
      duplicate: expect.objectContaining({
        duplicateResult: expect.objectContaining({ resultType: 'OWNED_DUPLICATE' })
      }),
      status: 'DUPLICATE_BLOCKED'
    })

    await expect(store.loadActiveDraft(identity)).resolves.toBeNull()
    await expect(store.loadBlockedDuplicate(identity)).resolves.toEqual({
      capture,
      duplicate: expect.objectContaining({
        duplicateResult: expect.objectContaining({ resultType: 'OWNED_DUPLICATE' })
      })
    })
  })

  it('clears the stale blocked duplicate as soon as a new capture starts', async () => {
    let resolveDuplicate: ((value: unknown) => void) | undefined
    const staleCapture = {
      ...capture,
      companyNameCandidates: ['Swiss Madison'],
      targetDomain: 'swissmadison.com',
      targetTitle: 'Two-Piece - Swiss Madison',
      targetUrl: 'https://swissmadison.com/collections/psc-two-piece'
    }
    const api = {
      checkDuplicate: vi.fn().mockImplementation(() => new Promise((resolve) => {
        resolveDuplicate = resolve
      })),
      createDraftLead: vi.fn().mockResolvedValue({
        crmAccount: { crmAccountId: 'american-standard-draft', displayName: 'American Standard', recordStatus: 'DRAFT' }
      })
    }
    const onStateChanged = vi.fn().mockResolvedValue(undefined)
    const store = new CrmLeadDraftStore(new MemoryCrmLeadDraftStorage(), () => '2026-06-23T08:00:01.000Z')
    await store.setBlockedDuplicate(identity, {
      capture: staleCapture,
      duplicate: {
        allowedActions: ['OPEN_OES_DETAIL'],
        duplicateResult: {
          candidates: [{ crmAccountId: 'swiss-1', displayName: 'Swiss Madison' }],
          resultType: 'OWNED_DUPLICATE'
        }
      }
    })
    const flow = new CrmLeadDraftCaptureFlow({ api, onStateChanged, store })

    const pending = flow.beginCapture(identity, {
      ...capture,
      companyNameCandidates: ['American Standard'],
      targetDomain: 'www.americanstandard-us.com',
      targetTitle: 'American Standard Two-Piece Toilets',
      targetUrl: 'https://www.americanstandard-us.com/collections/two-piece-toilets-list'
    })

    await vi.waitFor(() => expect(api.checkDuplicate).toHaveBeenCalledOnce())
    await expect(store.loadBlockedDuplicate(identity)).resolves.toBeNull()
    expect(onStateChanged).toHaveBeenCalled()

    resolveDuplicate?.({
      allowedActions: ['CHECK_DUPLICATE', 'CREATE_DRAFT_LEAD'],
      duplicateResult: { candidates: [], resultType: 'NO_DUPLICATE' }
    })
    await expect(pending).resolves.toEqual(expect.objectContaining({ status: 'DRAFT_READY' }))
  })

  it('submits a CRM Draft Lead, clears the plugin draft, and requests CRM tag refresh', async () => {
    const api = {
      checkDuplicate: vi.fn(),
      createDraftLead: vi.fn(),
      submitDraftLead: vi.fn().mockResolvedValue({
        crmAccount: { crmAccountId: 'active-lead-1' },
        resultType: 'SUBMITTED'
      }),
      updateDraftLead: vi.fn().mockResolvedValue({ crmAccount: { crmAccountId: 'oes-draft-1' } })
    }
    const refreshCrmTags = vi.fn().mockResolvedValue(undefined)
    const store = new CrmLeadDraftStore(new MemoryCrmLeadDraftStorage(), () => '2026-06-23T08:00:01.000Z')
    const active = await store.createActiveDraft(identity, capture)
    await store.updateActiveDraft(identity, {
      ...active.fields,
      assigneeIntent: 'CURRENT_OPERATOR',
      companyName: 'Serrano Fixtures',
      domain: 'serrano.example',
      sourceNote: 'Captured from browser context'
    })
    const flow = new CrmLeadDraftCaptureFlow({ api, refreshCrmTags, store })

    await expect(flow.submitActiveDraft(identity)).resolves.toEqual({
      crmAccount: { crmAccountId: 'active-lead-1' },
      resultType: 'SUBMITTED'
    })

    expect(api.updateDraftLead).toHaveBeenCalledWith(
      'tenant-1',
      active.draftId,
      expect.objectContaining({ displayName: 'Serrano Fixtures' })
    )
    expect(api.updateDraftLead.mock.calls[0]?.[2]).not.toHaveProperty('capture')
    expect(api.updateDraftLead.mock.calls[0]?.[2]).not.toHaveProperty('sourceNote')
    expect(api.submitDraftLead).toHaveBeenCalledWith(
      'tenant-1',
      active.draftId,
      expect.objectContaining({ assignmentIntent: 'OWNED_BY_OPERATOR' })
    )
    expect(refreshCrmTags).toHaveBeenCalledOnce()
    await expect(store.loadActiveDraft(identity)).resolves.toBeNull()
  })
})
