export interface BrowserActivityLifecycleRuntimePort {
  handleActiveTabRemoved(tabId: number): Promise<void>
  handleWindowFocusLost(): Promise<void>
  persistActiveVisitBeforeSuspend(): Promise<void>
}

interface ChromeLifecycleApi {
  runtime?: {
    onSuspend?: {
      addListener(listener: () => void): void
    }
  }
  tabs?: {
    onRemoved?: {
      addListener(listener: (tabId: number) => void): void
    }
  }
  windows?: {
    WINDOW_ID_NONE?: number
    onFocusChanged?: {
      addListener(listener: (windowId: number) => void): void
    }
  }
}

export interface BrowserActivityLifecycleOptions {
  onWindowFocusGained?: (windowId: number) => Promise<void>
}

// registerBrowserActivityLifecycleEvents maps low-cost Chrome lifecycle events to reliable visit flushes.
export function registerBrowserActivityLifecycleEvents(
  runtime: BrowserActivityLifecycleRuntimePort,
  chromeApi: ChromeLifecycleApi | undefined = globalThis.chrome as unknown as ChromeLifecycleApi,
  runTask: (task: Promise<void>) => void = defaultRunTask,
  options: BrowserActivityLifecycleOptions = {}
): void {
  if (!chromeApi) {
    return
  }

  chromeApi.tabs?.onRemoved?.addListener((tabId) => {
    runTask(runtime.handleActiveTabRemoved(tabId))
  })

  chromeApi.windows?.onFocusChanged?.addListener((windowId) => {
    if (windowId === chromeApi.windows?.WINDOW_ID_NONE) {
      runTask(runtime.handleWindowFocusLost())
      return
    }

    if (options.onWindowFocusGained) {
      runTask(options.onWindowFocusGained(windowId))
    }
  })

  chromeApi.runtime?.onSuspend?.addListener(() => {
    runTask(runtime.persistActiveVisitBeforeSuspend())
  })
}

function defaultRunTask(task: Promise<void>): void {
  void task.catch(() => undefined)
}
