import { describe, expect, it, vi } from 'vitest'

import {
  CrmLeadDraftStore,
  MemoryCrmLeadDraftStorage,
  type CrmLeadCapturePayload
} from './crm-lead-drafts'

describe('CRM lead draft storage', () => {
  const identity = { accountId: 'account-1', tenantId: 'tenant-1' }
  const capture: CrmLeadCapturePayload = {
    browserContext: { entryPoint: 'CONTEXT_MENU', workspace: 'CRM' },
    capturedAt: '2026-06-23T08:00:00.000Z',
    captureKind: 'CURRENT_PAGE',
    companyNameCandidates: ['Serrano Fixtures'],
    sourcePageTitle: 'Serrano Fixtures',
    sourcePageUrl: 'https://serrano.example',
    targetDomain: 'serrano.example',
    targetTitle: 'Serrano Fixtures',
    targetUrl: 'https://serrano.example',
    visibleEmails: ['imports@serrano.example'],
    visiblePhones: ['+1 312 847 1928']
  }

  it('isolates active drafts by tenant and account', async () => {
    const storage = new MemoryCrmLeadDraftStorage()
    const store = new CrmLeadDraftStore(storage, () => '2026-06-23T08:00:01.000Z')

    await store.createActiveDraft(identity, capture)

    await expect(store.loadActiveDraft(identity)).resolves.toMatchObject({
      capture: expect.objectContaining({ targetUrl: 'https://serrano.example' })
    })
    await expect(
      store.loadActiveDraft({ accountId: 'account-2', tenantId: 'tenant-1' })
    ).resolves.toBeNull()
  })

  it('detects active draft conflicts only when the current active draft has unsaved data', async () => {
    const store = new CrmLeadDraftStore(new MemoryCrmLeadDraftStorage(), () => '2026-06-23T08:00:01.000Z')
    const active = await store.createActiveDraft(identity, capture)

    await store.updateActiveDraft(identity, {
      ...active.fields,
      companyName: 'Edited Serrano Fixtures'
    })

    await expect(store.hasUnsavedActiveDraft(identity)).resolves.toBe(true)

    await store.saveActiveDraft(identity)

    await expect(store.hasUnsavedActiveDraft(identity)).resolves.toBe(false)
  })

  it('saves, restores, and deletes plugin saved drafts while keeping one active draft', async () => {
    const store = new CrmLeadDraftStore(new MemoryCrmLeadDraftStorage(), () => '2026-06-23T08:00:01.000Z')
    const active = await store.createActiveDraft(identity, capture)

    await store.updateActiveDraft(identity, { ...active.fields, companyName: 'Saved Serrano' })
    const saved = await store.saveActiveDraft(identity)
    await store.clearActiveDraft(identity)

    await expect(store.listSavedDrafts(identity)).resolves.toEqual([
      expect.objectContaining({ draftId: saved.draftId, fields: expect.objectContaining({ companyName: 'Saved Serrano' }) })
    ])

    await expect(store.restoreSavedDraft(identity, saved.draftId)).resolves.toEqual(
      expect.objectContaining({ draftId: saved.draftId })
    )

    await store.deleteDraft(identity, saved.draftId)

    await expect(store.listSavedDrafts(identity)).resolves.toEqual([])
    await expect(store.loadActiveDraft(identity)).resolves.toBeNull()
  })

  it('removes the plugin draft after a successful CRM submit', async () => {
    const store = new CrmLeadDraftStore(new MemoryCrmLeadDraftStorage(), () => '2026-06-23T08:00:01.000Z')
    const active = await store.createActiveDraft(identity, capture)

    await store.markSubmitted(identity, active.draftId)

    await expect(store.loadActiveDraft(identity)).resolves.toBeNull()
    await expect(store.listSavedDrafts(identity)).resolves.toEqual([])
  })

  it('loads side-panel draft state from one storage bucket read', async () => {
    const storage = new MemoryCrmLeadDraftStorage()
    const get = vi.spyOn(storage, 'get')
    const store = new CrmLeadDraftStore(storage, () => '2026-06-23T08:00:01.000Z')
    const active = await store.createActiveDraft(identity, capture)
    await store.updateActiveDraft(identity, { ...active.fields, companyName: 'Edited Serrano' })
    await store.setPendingCapture(identity, { ...capture, targetUrl: 'https://next.example' })

    get.mockClear()

    await expect(store.loadDraftState(identity)).resolves.toEqual({
      activeDraft: expect.objectContaining({ fields: expect.objectContaining({ companyName: 'Edited Serrano' }) }),
      blockedDuplicate: null,
      pendingCapture: expect.objectContaining({ targetUrl: 'https://next.example' }),
      savedDrafts: []
    })
    expect(get).toHaveBeenCalledTimes(1)
  })
})
