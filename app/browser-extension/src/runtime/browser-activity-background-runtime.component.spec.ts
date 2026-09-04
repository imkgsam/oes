import { describe, expect, it, vi } from 'vitest'

import type { StoredAuthSession } from '../auth/types'
import { MemoryAuthStorage } from '../auth/storage'
import { BrowserActivityBackgroundRuntime } from './browser-activity-background-runtime'
import { BrowserActivityCollector } from './browser-activity-collector'
import { MemoryBrowserActivityOutboxStore } from './browser-activity-outbox'

function authenticatedSession(overrides: Partial<StoredAuthSession> = {}): StoredAuthSession {
  return {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    context: {
      account: {
        accountId: 'account-1',
        scopeLevel: 'TENANT'
      },
      tenant: {
        tenantId: 'tenant-1'
      },
      terminal: 'BROWSER_EXTENSION'
    },
    ...overrides
  }
}

function createContentScriptRegistry() {
  return {
    register: vi.fn().mockResolvedValue(undefined),
    unregister: vi.fn().mockResolvedValue(undefined)
  }
}

function createApi() {
  return {
    appendVisitSessions: vi.fn().mockResolvedValue({
      acceptedCount: 1,
      policyEnabled: true,
      rejectedCount: 0,
      serverReceivedAt: '2026-06-25T10:00:00.000Z'
    }),
    getAuditControl: vi.fn().mockResolvedValue({
      enabled: true,
      nextPollAfterSeconds: 60,
      reasonCode: 'ENABLED'
    }),
    disconnect: vi.fn().mockResolvedValue({
      accepted: true
    }),
    heartbeat: vi.fn().mockResolvedValue({
      accepted: true,
      nextHeartbeatAfterSeconds: 60,
      policyEnabled: true
    })
  }
}

function createScheduler() {
  const intervals: Array<{ delayMs: number; handler: () => void | Promise<void>; id: number }> = []
  return {
    clearInterval: vi.fn(),
    intervals,
    setInterval: vi.fn((handler: () => void | Promise<void>, delayMs: number) => {
      const id = intervals.length + 1
      intervals.push({ delayMs, handler, id })
      return id
    })
  }
}

// Verifies the background runtime is the authenticated source of browser activity collection.
describe('BrowserActivityBackgroundRuntime', () => {
  it('does not register page observers or upload visits without extension login', async () => {
    const api = createApi()
    const contentScripts = createContentScriptRegistry()
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => 0 }),
      contentScripts,
      storage: new MemoryAuthStorage()
    })

    await runtime.restore()
    await runtime.recordForegroundTab({
      id: 7,
      title: 'Supplier Orders',
      url: 'https://supplier.example/orders'
    })
    await runtime.flushActiveVisit()

    expect(contentScripts.register).not.toHaveBeenCalled()
    expect(api.heartbeat).not.toHaveBeenCalled()
    expect(api.appendVisitSessions).not.toHaveBeenCalled()
  })

  it('registers page observers and heartbeat only after an authenticated extension session restore', async () => {
    const api = createApi()
    const contentScripts = createContentScriptRegistry()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => 0 }),
      contentScripts,
      now: () => 0,
      storage
    })

    await runtime.restore()

    expect(api.getAuditControl).toHaveBeenCalledWith('access-1')
    expect(contentScripts.register).toHaveBeenCalledTimes(1)
    expect(api.heartbeat).toHaveBeenCalledWith('access-1', {
      extensionSessionId: 'extension-session:tenant-1:account-1',
      observedAt: '1970-01-01T00:00:00.000Z'
    })
  })

  it('polls control without sending heartbeat or registering observers while employee audit is disabled', async () => {
    const api = createApi()
    api.getAuditControl
      .mockResolvedValueOnce({
        enabled: false,
        nextPollAfterSeconds: 45,
        reasonCode: 'EMPLOYEE_AUDIT_DISABLED'
      })
      .mockResolvedValueOnce({
        enabled: true,
        nextPollAfterSeconds: 60,
        reasonCode: 'ENABLED'
      })
    const contentScripts = createContentScriptRegistry()
    const scheduler = createScheduler()
    const onCollectionActivated = vi.fn().mockResolvedValue(undefined)
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => 0 }),
      contentScripts,
      now: () => 0,
      onCollectionActivated,
      scheduler,
      storage
    })

    await runtime.restore()

    expect(contentScripts.register).not.toHaveBeenCalled()
    expect(api.heartbeat).not.toHaveBeenCalled()
    expect(scheduler.setInterval).toHaveBeenCalledWith(expect.any(Function), 45_000)

    await scheduler.intervals.find((item) => item.delayMs === 45_000)!.handler()

    expect(contentScripts.register).toHaveBeenCalledTimes(1)
    expect(api.heartbeat).toHaveBeenCalledWith('access-1', {
      extensionSessionId: 'extension-session:tenant-1:account-1',
      observedAt: '1970-01-01T00:00:00.000Z'
    })
    expect(onCollectionActivated).toHaveBeenCalledTimes(1)
  })

  it('sends disconnect and unregisters observers when authenticated collection stops', async () => {
    let nowMs = 0
    const api = createApi()
    const contentScripts = createContentScriptRegistry()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => nowMs }),
      contentScripts,
      now: () => nowMs,
      storage
    })

    await runtime.restore()
    nowMs = 60_000
    await runtime.stopAuthenticatedCollection()

    expect(api.disconnect).toHaveBeenCalledWith('access-1', {
      extensionSessionId: 'extension-session:tenant-1:account-1',
      observedAt: '1970-01-01T00:01:00.000Z'
    })
    expect(contentScripts.unregister).toHaveBeenCalled()
  })

  it('uploads only authenticated completed foreground visit summaries', async () => {
    let nowMs = 0
    const api = createApi()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => nowMs }),
      contentScripts: createContentScriptRegistry(),
      now: () => nowMs,
      storage
    })

    await runtime.restore()
    await runtime.recordForegroundTab({
      id: 7,
      title: 'Supplier Orders',
      url: 'https://supplier.example/orders'
    })
    nowMs = 60_000
    await runtime.recordUserActivity({ kind: 'scroll', occurredAtMs: nowMs })
    nowMs = 120_000
    await runtime.flushActiveVisit()

    expect(api.appendVisitSessions).toHaveBeenCalledWith('access-1', {
      sessions: [
        expect.objectContaining({
          activeDurationSeconds: 120,
          domain: 'supplier.example',
          dwellDurationSeconds: 120,
          pageTitle: 'Supplier Orders',
          url: 'https://supplier.example/orders'
        })
      ]
    })
  })

  it('keeps finalized visit summaries in outbox when upload fails and retries after restore', async () => {
    let nowMs = 0
    const api = createApi()
    api.appendVisitSessions
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        acceptedCount: 1,
        policyEnabled: true,
        rejectedCount: 0,
        serverReceivedAt: '2026-06-25T10:00:00.000Z'
      })
    const outbox = new MemoryBrowserActivityOutboxStore()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => nowMs }),
      contentScripts: createContentScriptRegistry(),
      now: () => nowMs,
      outbox,
      storage
    })

    await runtime.restore()
    await runtime.recordForegroundTab({
      id: 7,
      title: 'Supplier Orders',
      url: 'https://supplier.example/orders'
    })
    nowMs = 30_000
    await runtime.flushActiveVisit()

    await expect(outbox.list({ accountId: 'account-1', tenantId: 'tenant-1' })).resolves.toHaveLength(1)

    await runtime.restore()

    expect(api.appendVisitSessions).toHaveBeenCalledTimes(2)
    await expect(outbox.list({ accountId: 'account-1', tenantId: 'tenant-1' })).resolves.toEqual([])
  })

  it('keeps heartbeat alive and periodically flushes the active tab visit after restore', async () => {
    let nowMs = 0
    const api = createApi()
    const scheduler = createScheduler()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => nowMs }),
      contentScripts: createContentScriptRegistry(),
      now: () => nowMs,
      scheduler,
      storage
    })

    await runtime.restore()
    await runtime.recordForegroundTab({
      id: 7,
      title: 'Supplier Orders',
      url: 'https://supplier.example/orders'
    })

    expect(scheduler.setInterval).toHaveBeenCalledWith(expect.any(Function), 60_000)
    expect(scheduler.setInterval).toHaveBeenCalledWith(expect.any(Function), 30_000)

    nowMs = 30_000
    await scheduler.intervals.find((item) => item.delayMs === 30_000)!.handler()

    expect(api.appendVisitSessions).toHaveBeenCalledWith('access-1', {
      sessions: [
        expect.objectContaining({
          activeDurationSeconds: 30,
          domain: 'supplier.example',
          dwellDurationSeconds: 30,
          pageTitle: 'Supplier Orders',
          url: 'https://supplier.example/orders'
        })
      ]
    })

    nowMs = 60_000
    await scheduler.intervals.find((item) => item.delayMs === 60_000)!.handler()

    expect(api.heartbeat).toHaveBeenCalledTimes(2)

    nowMs = 90_000
    await scheduler.intervals.find((item) => item.delayMs === 30_000)!.handler()

    expect(api.appendVisitSessions).toHaveBeenCalledTimes(2)
    expect(api.appendVisitSessions).toHaveBeenLastCalledWith('access-1', {
      sessions: [
        expect.objectContaining({
          activeDurationSeconds: 60,
          domain: 'supplier.example',
          dwellDurationSeconds: 60,
          pageTitle: 'Supplier Orders',
          url: 'https://supplier.example/orders'
        })
      ]
    })
  })

  it('does not reset activity time when periodic flush continues the same idle tab', async () => {
    let nowMs = 0
    const api = createApi()
    const scheduler = createScheduler()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => nowMs }),
      contentScripts: createContentScriptRegistry(),
      now: () => nowMs,
      scheduler,
      storage
    })

    await runtime.restore()
    await runtime.recordForegroundTab({
      id: 7,
      title: 'Supplier Orders',
      url: 'https://supplier.example/orders'
    })

    const flushTimer = scheduler.intervals.find((item) => item.delayMs === 30_000)!
    for (const flushAtMs of [30_000, 330_000, 360_000]) {
      nowMs = flushAtMs
      await flushTimer.handler()
    }

    expect(api.appendVisitSessions).toHaveBeenLastCalledWith('access-1', {
      sessions: [
        expect.objectContaining({
          activeDurationSeconds: 0,
          idleDurationSeconds: 30
        })
      ]
    })
  })

  it('finalizes the current active visit when that tab is closed', async () => {
    let nowMs = 0
    const api = createApi()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => nowMs }),
      contentScripts: createContentScriptRegistry(),
      now: () => nowMs,
      storage
    })

    await runtime.restore()
    await runtime.recordForegroundTab({
      id: 7,
      title: 'Supplier Orders',
      url: 'https://supplier.example/orders'
    })
    nowMs = 45_000
    await runtime.handleActiveTabRemoved(7)

    expect(api.appendVisitSessions).toHaveBeenCalledWith('access-1', {
      sessions: [
        expect.objectContaining({
          activeDurationSeconds: 45,
          url: 'https://supplier.example/orders'
        })
      ]
    })
  })

  it('does not finalize the current visit when a background tab is closed', async () => {
    let nowMs = 0
    const api = createApi()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => nowMs }),
      contentScripts: createContentScriptRegistry(),
      now: () => nowMs,
      storage
    })

    await runtime.restore()
    await runtime.recordForegroundTab({
      id: 7,
      title: 'Supplier Orders',
      url: 'https://supplier.example/orders'
    })
    nowMs = 45_000
    await runtime.handleActiveTabRemoved(8)

    expect(api.appendVisitSessions).not.toHaveBeenCalled()
  })

  it('persists the current active visit to outbox before service worker suspension without requiring network upload', async () => {
    let nowMs = 0
    const api = createApi()
    const outbox = new MemoryBrowserActivityOutboxStore()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => nowMs }),
      contentScripts: createContentScriptRegistry(),
      now: () => nowMs,
      outbox,
      storage
    })

    await runtime.restore()
    await runtime.recordForegroundTab({
      id: 7,
      title: 'Supplier Orders',
      url: 'https://supplier.example/orders'
    })
    nowMs = 45_000
    await runtime.persistActiveVisitBeforeSuspend()

    expect(api.appendVisitSessions).not.toHaveBeenCalled()
    await expect(outbox.list({ accountId: 'account-1', tenantId: 'tenant-1' })).resolves.toEqual([
      expect.objectContaining({
        sessions: [
          expect.objectContaining({
            activeDurationSeconds: 45,
            url: 'https://supplier.example/orders'
          })
        ]
      })
    ])
  })

  it('suspends data collection and starts control polling when heartbeat reports audit disabled', async () => {
    const api = createApi()
    api.heartbeat
      .mockResolvedValueOnce({
        accepted: true,
        nextHeartbeatAfterSeconds: 60,
        policyEnabled: true
      })
      .mockResolvedValueOnce({
        accepted: false,
        nextHeartbeatAfterSeconds: 60,
        policyEnabled: false
      })
    const contentScripts = createContentScriptRegistry()
    const scheduler = createScheduler()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => 0 }),
      contentScripts,
      now: () => 0,
      scheduler,
      storage
    })

    await runtime.restore()
    await scheduler.intervals.find((item) => item.delayMs === 60_000)!.handler()

    expect(contentScripts.unregister).toHaveBeenCalledTimes(1)
    expect(scheduler.setInterval).toHaveBeenLastCalledWith(expect.any(Function), 60_000)

    await runtime.recordForegroundTab({
      id: 7,
      title: 'Supplier Orders',
      url: 'https://supplier.example/orders'
    })
    await runtime.flushActiveVisit()

    expect(api.appendVisitSessions).not.toHaveBeenCalled()
  })

  it('stops collection, unregisters page observers, and discards pending summaries after session clears', async () => {
    let nowMs = 0
    const api = createApi()
    const contentScripts = createContentScriptRegistry()
    const outbox = new MemoryBrowserActivityOutboxStore()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => nowMs }),
      contentScripts,
      now: () => nowMs,
      outbox,
      storage
    })

    await runtime.restore()
    await runtime.recordForegroundTab({
      id: 8,
      title: 'Docs',
      url: 'https://docs.example/review'
    })
    await storage.clear()
    await runtime.restore()
    nowMs = 30_000
    await runtime.flushActiveVisit()

    expect(contentScripts.unregister).toHaveBeenCalledTimes(1)
    expect(api.heartbeat).toHaveBeenCalledTimes(1)
    expect(api.appendVisitSessions).not.toHaveBeenCalled()
    await expect(outbox.list({ accountId: 'account-1', tenantId: 'tenant-1' })).resolves.toEqual([])
  })

  it('clears pending outbox entries when heartbeat reports audit disabled', async () => {
    const api = createApi()
    api.heartbeat
      .mockResolvedValueOnce({
        accepted: true,
        nextHeartbeatAfterSeconds: 60,
        policyEnabled: true
      })
      .mockResolvedValueOnce({
        accepted: false,
        nextHeartbeatAfterSeconds: 60,
        policyEnabled: false
      })
    const outbox = new MemoryBrowserActivityOutboxStore()
    await outbox.enqueue({
      accountId: 'account-1',
      nowMs: 0,
      sessions: [
        {
          activeDurationSeconds: 30,
          clientVisitId: 'visit-pending',
          domain: 'supplier.example',
          dwellDurationSeconds: 30,
          endedAt: '2026-06-26T10:00:30.000Z',
          extensionSessionId: 'extension-session:tenant-1:account-1',
          foregroundDurationSeconds: 30,
          idleDurationSeconds: 0,
          lastFlushedAt: '2026-06-26T10:00:30.000Z',
          mergeKey: 'account-1:supplier.example:https://supplier.example',
          pageTitle: 'Supplier',
          startedAt: '2026-06-26T10:00:00.000Z',
          url: 'https://supplier.example'
        }
      ],
      tenantId: 'tenant-1'
    })
    const scheduler = createScheduler()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityBackgroundRuntime({
      api,
      collector: new BrowserActivityCollector({ now: () => 0 }),
      contentScripts: createContentScriptRegistry(),
      now: () => 0,
      outbox,
      scheduler,
      storage
    })

    await runtime.restore()
    await scheduler.intervals.find((item) => item.delayMs === 60_000)!.handler()

    await expect(outbox.list({ accountId: 'account-1', tenantId: 'tenant-1' })).resolves.toEqual([])
  })
})
