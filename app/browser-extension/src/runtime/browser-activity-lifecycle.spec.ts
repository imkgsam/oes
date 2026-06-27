import { describe, expect, it, vi } from 'vitest'

import { registerBrowserActivityLifecycleEvents } from './browser-activity-lifecycle'

function createChromeLifecycleMock() {
  return {
    runtime: {
      onSuspend: {
        addListener: vi.fn()
      }
    },
    tabs: {
      onRemoved: {
        addListener: vi.fn()
      }
    },
    windows: {
      WINDOW_ID_NONE: -1,
      onFocusChanged: {
        addListener: vi.fn()
      }
    }
  }
}

describe('registerBrowserActivityLifecycleEvents', () => {
  it('flushes the tracked active visit when Chrome removes the active tab', async () => {
    const chromeMock = createChromeLifecycleMock()
    const runtime = {
      handleActiveTabRemoved: vi.fn().mockResolvedValue(undefined),
      handleWindowFocusLost: vi.fn().mockResolvedValue(undefined),
      persistActiveVisitBeforeSuspend: vi.fn().mockResolvedValue(undefined)
    }

    registerBrowserActivityLifecycleEvents(runtime, chromeMock)
    const listener = chromeMock.tabs.onRemoved.addListener.mock.calls[0]![0]

    listener(7)
    await Promise.resolve()

    expect(runtime.handleActiveTabRemoved).toHaveBeenCalledWith(7)
  })

  it('flushes the active visit when the browser window loses focus', async () => {
    const chromeMock = createChromeLifecycleMock()
    const runtime = {
      handleActiveTabRemoved: vi.fn().mockResolvedValue(undefined),
      handleWindowFocusLost: vi.fn().mockResolvedValue(undefined),
      persistActiveVisitBeforeSuspend: vi.fn().mockResolvedValue(undefined)
    }

    registerBrowserActivityLifecycleEvents(runtime, chromeMock)
    const listener = chromeMock.windows.onFocusChanged.addListener.mock.calls[0]![0]

    listener(chromeMock.windows.WINDOW_ID_NONE)
    await Promise.resolve()

    expect(runtime.handleWindowFocusLost).toHaveBeenCalledTimes(1)

    listener(3)
    await Promise.resolve()

    expect(runtime.handleWindowFocusLost).toHaveBeenCalledTimes(1)
  })

  it('resumes tracking the current active tab when a browser window regains focus', async () => {
    const chromeMock = createChromeLifecycleMock()
    const runtime = {
      handleActiveTabRemoved: vi.fn().mockResolvedValue(undefined),
      handleWindowFocusLost: vi.fn().mockResolvedValue(undefined),
      persistActiveVisitBeforeSuspend: vi.fn().mockResolvedValue(undefined)
    }
    const onWindowFocusGained = vi.fn().mockResolvedValue(undefined)

    registerBrowserActivityLifecycleEvents(runtime, chromeMock, undefined, { onWindowFocusGained })
    const listener = chromeMock.windows.onFocusChanged.addListener.mock.calls[0]![0]

    listener(3)
    await Promise.resolve()

    expect(onWindowFocusGained).toHaveBeenCalledWith(3)
  })


  it('persists the active visit locally before service worker suspend', async () => {
    const chromeMock = createChromeLifecycleMock()
    const runtime = {
      handleActiveTabRemoved: vi.fn().mockResolvedValue(undefined),
      handleWindowFocusLost: vi.fn().mockResolvedValue(undefined),
      persistActiveVisitBeforeSuspend: vi.fn().mockResolvedValue(undefined)
    }

    registerBrowserActivityLifecycleEvents(runtime, chromeMock)
    const listener = chromeMock.runtime.onSuspend.addListener.mock.calls[0]![0]

    listener()
    await Promise.resolve()

    expect(runtime.persistActiveVisitBeforeSuspend).toHaveBeenCalledTimes(1)
  })
})
