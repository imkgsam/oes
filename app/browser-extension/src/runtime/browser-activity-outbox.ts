import type { BrowserActivityVisitSummary } from './browser-activity-collector'

const BROWSER_ACTIVITY_OUTBOX_STORAGE_KEY = 'oes.browserActivity.visitOutbox.v1'
const MAX_OUTBOX_ENTRIES = 200
const OUTBOX_TTL_MS = 24 * 60 * 60 * 1000

export interface BrowserActivityOutboxContext {
  accountId: string
  tenantId: string
}

export interface BrowserActivityOutboxEntry extends BrowserActivityOutboxContext {
  createdAtMs: number
  id: string
  sessions: BrowserActivityVisitSummary[]
}

export interface BrowserActivityOutboxEnqueueInput extends BrowserActivityOutboxContext {
  nowMs: number
  sessions: BrowserActivityVisitSummary[]
}

export interface BrowserActivityOutboxStore {
  clear(context: BrowserActivityOutboxContext): Promise<void>
  enqueue(input: BrowserActivityOutboxEnqueueInput): Promise<BrowserActivityOutboxEntry>
  list(context: BrowserActivityOutboxContext): Promise<BrowserActivityOutboxEntry[]>
  remove(ids: string[]): Promise<void>
}

// BrowserActivityPersistentOutboxStore keeps finalized visit summaries until upload succeeds.
export class BrowserActivityPersistentOutboxStore implements BrowserActivityOutboxStore {
  private fallbackEntries: BrowserActivityOutboxEntry[] = []

  async clear(context: BrowserActivityOutboxContext): Promise<void> {
    const entries = await this.loadAll()
    await this.saveAll(entries.filter((entry) => !matchesContext(entry, context)))
  }

  async enqueue(input: BrowserActivityOutboxEnqueueInput): Promise<BrowserActivityOutboxEntry> {
    const entry = {
      accountId: input.accountId,
      createdAtMs: input.nowMs,
      id: createOutboxEntryId(input),
      sessions: input.sessions,
      tenantId: input.tenantId
    }
    const entries = pruneOutboxEntries([...await this.loadAll(), entry], input.nowMs)
    await this.saveAll(entries)
    return entry
  }

  async list(context: BrowserActivityOutboxContext): Promise<BrowserActivityOutboxEntry[]> {
    return (await this.loadAll()).filter((entry) => matchesContext(entry, context))
  }

  async remove(ids: string[]): Promise<void> {
    if (!ids.length) {
      return
    }
    const idSet = new Set(ids)
    await this.saveAll((await this.loadAll()).filter((entry) => !idSet.has(entry.id)))
  }

  private async loadAll(): Promise<BrowserActivityOutboxEntry[]> {
    const storage = resolveChromeStorage()
    if (storage) {
      return normalizeOutboxEntries((await storage.get(BROWSER_ACTIVITY_OUTBOX_STORAGE_KEY))[BROWSER_ACTIVITY_OUTBOX_STORAGE_KEY])
    }

    const value = loadLocalStorageValue()
    if (value) {
      return normalizeOutboxEntries(value)
    }

    return this.fallbackEntries
  }

  private async saveAll(entries: BrowserActivityOutboxEntry[]): Promise<void> {
    const storage = resolveChromeStorage()
    if (storage) {
      await storage.set({ [BROWSER_ACTIVITY_OUTBOX_STORAGE_KEY]: entries })
      return
    }

    if (typeof globalThis.localStorage?.setItem === 'function') {
      globalThis.localStorage.setItem(BROWSER_ACTIVITY_OUTBOX_STORAGE_KEY, JSON.stringify(entries))
      return
    }

    this.fallbackEntries = entries
  }
}

// MemoryBrowserActivityOutboxStore provides deterministic reliable-upload state for runtime tests.
export class MemoryBrowserActivityOutboxStore implements BrowserActivityOutboxStore {
  private entries: BrowserActivityOutboxEntry[] = []

  async clear(context: BrowserActivityOutboxContext): Promise<void> {
    this.entries = this.entries.filter((entry) => !matchesContext(entry, context))
  }

  async enqueue(input: BrowserActivityOutboxEnqueueInput): Promise<BrowserActivityOutboxEntry> {
    const entry = {
      accountId: input.accountId,
      createdAtMs: input.nowMs,
      id: createOutboxEntryId(input),
      sessions: input.sessions,
      tenantId: input.tenantId
    }
    this.entries = pruneOutboxEntries([...this.entries, entry], input.nowMs)
    return entry
  }

  async list(context: BrowserActivityOutboxContext): Promise<BrowserActivityOutboxEntry[]> {
    return this.entries.filter((entry) => matchesContext(entry, context))
  }

  async remove(ids: string[]): Promise<void> {
    const idSet = new Set(ids)
    this.entries = this.entries.filter((entry) => !idSet.has(entry.id))
  }
}

function resolveChromeStorage(): chrome.storage.StorageArea | undefined {
  return globalThis.chrome?.storage?.local
}

function loadLocalStorageValue(): unknown {
  if (typeof globalThis.localStorage?.getItem !== 'function') {
    return null
  }

  const raw = globalThis.localStorage.getItem(BROWSER_ACTIVITY_OUTBOX_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function normalizeOutboxEntries(value: unknown): BrowserActivityOutboxEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is BrowserActivityOutboxEntry => (
    Boolean(entry) &&
    typeof entry === 'object' &&
    typeof entry.id === 'string' &&
    typeof entry.tenantId === 'string' &&
    typeof entry.accountId === 'string' &&
    typeof entry.createdAtMs === 'number' &&
    Array.isArray(entry.sessions)
  ))
}

function pruneOutboxEntries(entries: BrowserActivityOutboxEntry[], nowMs: number): BrowserActivityOutboxEntry[] {
  return entries
    .filter((entry) => nowMs - entry.createdAtMs <= OUTBOX_TTL_MS)
    .slice(-MAX_OUTBOX_ENTRIES)
}

function matchesContext(entry: BrowserActivityOutboxEntry, context: BrowserActivityOutboxContext): boolean {
  return entry.accountId === context.accountId && entry.tenantId === context.tenantId
}

function createOutboxEntryId(input: BrowserActivityOutboxEnqueueInput): string {
  const firstVisitId = input.sessions[0]?.clientVisitId ?? 'empty'
  return `outbox:${input.tenantId}:${input.accountId}:${input.nowMs}:${firstVisitId}`
}
