/// <reference types="vite/client" />

declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>
      remove(keys: string | string[]): Promise<void>
      set(items: Record<string, unknown>): Promise<void>
    }

    const local: StorageArea
  }
}
