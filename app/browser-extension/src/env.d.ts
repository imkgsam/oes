/// <reference types="vite/client" />

declare namespace chrome {
  namespace action {
    const onClicked: {
      addListener(callback: (tab: tabs.Tab) => void): void
    }
  }

  namespace commands {
    const onCommand: {
      addListener(callback: (command: string) => void): void
    }
  }

  namespace contextMenus {
    function create(properties: { contexts?: string[]; id: string; title: string }): void
    function removeAll(): Promise<void>
    const onClicked: {
      addListener(callback: (info: {
        linkUrl?: string
        menuItemId: string
        pageUrl?: string
        selectionText?: string
      }, tab?: tabs.Tab) => void): void
    }
  }

  namespace runtime {
    interface MessageSender {
      tab?: tabs.Tab
    }
    const onInstalled: {
      addListener(callback: () => void): void
    }
    const onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | void
      ): void
      removeListener(
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | void
      ): void
    }
    function sendMessage(message: unknown): Promise<unknown>
  }

  namespace scripting {
    function executeScript<T extends (...args: never[]) => unknown>(options: {
      args?: unknown[]
      func: T
      target: { tabId: number }
    }): Promise<Array<{ result?: Awaited<ReturnType<T>> }>>
  }

  namespace sidePanel {
    function open(options: { tabId?: number; windowId?: number }): Promise<void>
    function setOptions(options: { enabled: boolean; path: string; tabId?: number }): Promise<void>
  }

  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>
      remove(keys: string | string[]): Promise<void>
      set(items: Record<string, unknown>): Promise<void>
    }

    const local: StorageArea
  }

  namespace tabs {
    interface Tab {
      id?: number
      url?: string
      windowId?: number
    }

    const onActivated: {
      addListener(callback: (activeInfo: { tabId: number; windowId: number }) => void): void
    }
    const onUpdated: {
      addListener(
        callback: (
          tabId: number,
          changeInfo: { status?: string; url?: string },
          tab: Tab
        ) => void
      ): void
    }
    function get(tabId: number): Promise<Tab>
    function query(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<Tab[]>
  }
}

interface ImportMetaEnv {
  readonly VITE_OES_TENANT_WEB_BASE_URL?: string
}
