import type { StoredAuthSession } from './types'

const SESSION_KEY = 'oes.browserExtension.authSession'

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
      await storage.remove(SESSION_KEY)
      return
    }

    globalThis.localStorage?.removeItem(SESSION_KEY)
  }

  async load(): Promise<StoredAuthSession | null> {
    const storage = resolveChromeStorage()
    if (storage) {
      const result = await storage.get(SESSION_KEY)
      return normalizeStoredSession(result[SESSION_KEY])
    }

    const raw = globalThis.localStorage?.getItem(SESSION_KEY)
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
      await storage.set({ [SESSION_KEY]: session })
      return
    }

    globalThis.localStorage?.setItem(SESSION_KEY, JSON.stringify(session))
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
