import type { StoredAuthSession } from './types'

export const EXTENSION_AUTH_SESSION_STORAGE_KEY = 'oes.browserExtension.authSession'

export interface AuthStorage {
  clear(): Promise<void>
  load(): Promise<StoredAuthSession | null>
  save(session: StoredAuthSession): Promise<void>
}

// Persists extension auth state in Chrome storage with a localStorage fallback for browser preview.
export class ExtensionAuthStorage implements AuthStorage {
  async clear(): Promise<void> {
    const storage = resolveChromeStorage()
    if (storage) {
      await storage.remove(EXTENSION_AUTH_SESSION_STORAGE_KEY)
      return
    }

    globalThis.localStorage?.removeItem(EXTENSION_AUTH_SESSION_STORAGE_KEY)
  }

  async load(): Promise<StoredAuthSession | null> {
    const storage = resolveChromeStorage()
    if (storage) {
      const result = await storage.get(EXTENSION_AUTH_SESSION_STORAGE_KEY)
      return normalizeStoredSession(result[EXTENSION_AUTH_SESSION_STORAGE_KEY])
    }

    const raw = globalThis.localStorage?.getItem(EXTENSION_AUTH_SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      return normalizeStoredSession(JSON.parse(raw))
    } catch {
      return null
    }
  }

  async save(session: StoredAuthSession): Promise<void> {
    const storage = resolveChromeStorage()
    if (storage) {
      await storage.set({ [EXTENSION_AUTH_SESSION_STORAGE_KEY]: session })
      return
    }

    globalThis.localStorage?.setItem(EXTENSION_AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
  }
}

// Provides deterministic in-memory persistence for unit tests.
export class MemoryAuthStorage implements AuthStorage {
  private session: StoredAuthSession | null = null

  async clear(): Promise<void> {
    this.session = null
  }

  async load(): Promise<StoredAuthSession | null> {
    return this.session
  }

  async save(session: StoredAuthSession): Promise<void> {
    this.session = session
  }
}

function resolveChromeStorage(): chrome.storage.StorageArea | undefined {
  return globalThis.chrome?.storage?.local
}

function normalizeStoredSession(value: unknown): StoredAuthSession | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const session = value as Partial<StoredAuthSession>
  if (!session.accessToken || !session.refreshToken) {
    return null
  }

  return {
    accessToken: session.accessToken,
    context: session.context ?? null,
    refreshToken: session.refreshToken
  }
}
