import { describe, expect, it } from 'vitest'

import { MemoryBrowserActivityOutboxStore } from './browser-activity-outbox'
import type { BrowserActivityVisitSummary } from './browser-activity-collector'

function visitSummary(id: string): BrowserActivityVisitSummary {
  return {
    activeDurationSeconds: 30,
    clientVisitId: id,
    domain: 'supplier.example',
    dwellDurationSeconds: 30,
    endedAt: '2026-06-26T10:00:30.000Z',
    extensionSessionId: 'extension-session:tenant-1:account-1',
    foregroundDurationSeconds: 30,
    idleDurationSeconds: 0,
    lastFlushedAt: '2026-06-26T10:00:30.000Z',
    mergeKey: `account-1:supplier.example:https://supplier.example/${id}`,
    pageTitle: 'Supplier',
    startedAt: '2026-06-26T10:00:00.000Z',
    url: `https://supplier.example/${id}`
  }
}

describe('BrowserActivityOutboxStore', () => {
  it('keeps finalized visit summaries until the uploader acknowledges them', async () => {
    const store = new MemoryBrowserActivityOutboxStore()

    const first = await store.enqueue({
      accountId: 'account-1',
      nowMs: 0,
      sessions: [visitSummary('visit-1')],
      tenantId: 'tenant-1'
    })
    await store.enqueue({
      accountId: 'account-2',
      nowMs: 0,
      sessions: [visitSummary('visit-2')],
      tenantId: 'tenant-1'
    })

    await expect(store.list({ accountId: 'account-1', tenantId: 'tenant-1' })).resolves.toEqual([
      expect.objectContaining({
        id: first.id,
        sessions: [expect.objectContaining({ clientVisitId: 'visit-1' })]
      })
    ])

    await store.remove([first.id])

    await expect(store.list({ accountId: 'account-1', tenantId: 'tenant-1' })).resolves.toEqual([])
    await expect(store.list({ accountId: 'account-2', tenantId: 'tenant-1' })).resolves.toHaveLength(1)
  })

  it('clears only the selected account when audit collection is disabled', async () => {
    const store = new MemoryBrowserActivityOutboxStore()
    await store.enqueue({
      accountId: 'account-1',
      nowMs: 0,
      sessions: [visitSummary('visit-1')],
      tenantId: 'tenant-1'
    })
    await store.enqueue({
      accountId: 'account-2',
      nowMs: 0,
      sessions: [visitSummary('visit-2')],
      tenantId: 'tenant-1'
    })

    await store.clear({ accountId: 'account-1', tenantId: 'tenant-1' })

    await expect(store.list({ accountId: 'account-1', tenantId: 'tenant-1' })).resolves.toEqual([])
    await expect(store.list({ accountId: 'account-2', tenantId: 'tenant-1' })).resolves.toHaveLength(1)
  })
})
