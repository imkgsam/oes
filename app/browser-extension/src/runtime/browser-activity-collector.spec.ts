import { describe, expect, it } from 'vitest'

import { BrowserActivityCollector } from './browser-activity-collector'

function scriptedClock(values: number[]) {
  let index = 0
  return () => values[Math.min(index++, values.length - 1)]!
}

// Verifies BrowserActivityCollector stores only authenticated visit summaries, never raw page input.
describe('BrowserActivityCollector', () => {
  it('never drains unauthenticated browsing history before authenticated start', () => {
    const collector = new BrowserActivityCollector({ now: scriptedClock([0, 10_000]) })

    collector.startVisit({
      tabId: 1,
      title: 'Supplier',
      url: 'https://supplier.example/orders'
    })

    expect(collector.drain()).toEqual([])
  })

  it('summarizes URL visits without storing keyboard content or page body', () => {
    const collector = new BrowserActivityCollector({ now: scriptedClock([0, 60_000, 120_000]) })
    collector.start({
      accessToken: 'access-1',
      accountId: 'account-1',
      tenantId: 'tenant-1'
    })

    collector.startVisit({
      tabId: 1,
      title: 'Orders',
      url: 'https://supplier.example/orders'
    })
    collector.recordUserActivity({
      kind: 'keyboard',
      occurredAtMs: 60_000
    })
    collector.endVisit({
      tabId: 1,
      occurredAtMs: 120_000
    })

    const [summary] = collector.drain()

    expect(JSON.stringify(summary)).not.toContain('keyboard')
    expect(JSON.stringify(summary)).not.toContain('pageBody')
    expect(summary).toEqual(
      expect.objectContaining({
        activeDurationSeconds: 120,
        domain: 'supplier.example',
        dwellDurationSeconds: 120,
        foregroundDurationSeconds: 120,
        idleDurationSeconds: 0,
        pageTitle: 'Orders',
        url: 'https://supplier.example/orders'
      })
    )
  })

  it('counts idle duration after five continuous minutes without activity', () => {
    const collector = new BrowserActivityCollector({ now: scriptedClock([0, 600_000]) })
    collector.start({
      accessToken: 'access-1',
      accountId: 'account-1',
      tenantId: 'tenant-1'
    })

    collector.startVisit({
      tabId: 2,
      title: 'Inbox',
      url: 'https://mail.example/inbox'
    })
    collector.endVisit({
      tabId: 2,
      occurredAtMs: 600_000
    })

    const [summary] = collector.drain()

    expect(summary.activeDurationSeconds).toBe(300)
    expect(summary.idleDurationSeconds).toBe(300)
  })

  it('generates visit ids that do not collide across collector lifecycles', () => {
    const first = collectSingleVisitId(new BrowserActivityCollector({ now: scriptedClock([0, 30_000]) }))
    const second = collectSingleVisitId(new BrowserActivityCollector({ now: scriptedClock([0, 30_000]) }))

    expect(first).not.toBe(second)
    expect(first).not.toBe('visit-1')
    expect(second).not.toBe('visit-1')
  })

  it('discards pending authenticated summaries without upload', () => {
    const collector = new BrowserActivityCollector({ now: scriptedClock([0, 10_000]) })
    collector.start({
      accessToken: 'access-1',
      accountId: 'account-1',
      tenantId: 'tenant-1'
    })
    collector.startVisit({
      tabId: 3,
      title: 'Docs',
      url: 'https://docs.example/review'
    })
    collector.endVisit({
      tabId: 3,
      occurredAtMs: 10_000
    })

    collector.discard()

    expect(collector.drain()).toEqual([])
  })
})

function collectSingleVisitId(collector: BrowserActivityCollector) {
  collector.start({
    accessToken: 'access-1',
    accountId: 'account-1',
    tenantId: 'tenant-1'
  })
  collector.startVisit({
    tabId: 1,
    title: 'Orders',
    url: 'https://supplier.example/orders'
  })
  collector.endVisit({
    tabId: 1,
    occurredAtMs: 30_000
  })

  return collector.drain()[0]?.clientVisitId
}
