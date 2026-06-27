import { afterEach, describe, expect, it, vi } from 'vitest'

import type { StoredAuthSession } from '../auth/types'
import { MemoryAuthStorage } from '../auth/storage'
import { BrowserActivityRuntime } from './browser-activity-runtime'

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

function createCollector() {
  return {
    discard: vi.fn(),
    flush: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }
}

// Verifies Browser Activity collection is gated by an authenticated browser-extension session.
describe('BrowserActivityRuntime', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not start collection when extension auth storage has no session', async () => {
    const collector = createCollector()
    const runtime = new BrowserActivityRuntime({
      collector,
      storage: new MemoryAuthStorage()
    })

    await runtime.restore()

    expect(collector.start).not.toHaveBeenCalled()
    expect(collector.flush).not.toHaveBeenCalled()
  })

  it('starts collection only after authenticated browser-extension session restore', async () => {
    const collector = createCollector()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityRuntime({ collector, storage })

    await runtime.restore()

    expect(collector.start).toHaveBeenCalledWith({
      accessToken: 'access-1',
      accountId: 'account-1',
      tenantId: 'tenant-1'
    })
  })

  it('notifies the background runtime to restore collection after authenticated session restore', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage
      }
    })
    const collector = createCollector()
    const storage = new MemoryAuthStorage()
    await storage.save(authenticatedSession())
    const runtime = new BrowserActivityRuntime({ collector, storage })

    await runtime.restore()

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'oes.browserActivity.restoreCollection'
    })
  })


  it('does not start collection for a non-extension terminal session', async () => {
    const collector = createCollector()
    const storage = new MemoryAuthStorage()
    await storage.save(
      authenticatedSession({
        context: {
          account: {
            accountId: 'account-1',
            scopeLevel: 'TENANT'
          },
          tenant: {
            tenantId: 'tenant-1'
          },
          terminal: 'WEB'
        }
      })
    )
    const runtime = new BrowserActivityRuntime({ collector, storage })

    await runtime.restore()

    expect(collector.start).not.toHaveBeenCalled()
    expect(collector.discard).toHaveBeenCalled()
  })

  it('stops collection and discards pending state on logout without flushing history', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage
      }
    })
    const collector = createCollector()
    const runtime = new BrowserActivityRuntime({
      collector,
      storage: new MemoryAuthStorage()
    })

    await runtime.logout()

    expect(collector.stop).toHaveBeenCalled()
    expect(collector.discard).toHaveBeenCalled()
    expect(collector.flush).not.toHaveBeenCalled()
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'oes.browserActivity.stopCollection'
    })
  })
})
