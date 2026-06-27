import type { AuthStorage } from '../auth/storage'
import type { StoredAuthSession } from '../auth/types'
import {
  BROWSER_ACTIVITY_RESTORE_COLLECTION_MESSAGE,
  BROWSER_ACTIVITY_STOP_COLLECTION_MESSAGE
} from './messages'

export interface BrowserActivityCollectionContext {
  accessToken: string
  accountId: string
  tenantId: string
}

export interface BrowserActivityCollectorRuntimePort {
  discard(): void | Promise<void>
  flush?(): void | Promise<void>
  start(context: BrowserActivityCollectionContext): void | Promise<void>
  stop(): void | Promise<void>
}

export interface BrowserActivityRuntimeOptions {
  collector: BrowserActivityCollectorRuntimePort
  storage: AuthStorage
}

// BrowserActivityRuntime starts browser activity collection only from an authenticated extension session.
export class BrowserActivityRuntime {
  private readonly collector: BrowserActivityCollectorRuntimePort
  private readonly storage: AuthStorage

  constructor(options: BrowserActivityRuntimeOptions) {
    this.collector = options.collector
    this.storage = options.storage
  }

  // restore resumes collection only when persisted auth state proves an extension tenant session.
  async restore(): Promise<void> {
    const session = await this.storage.load()
    await this.startFromSession(session)
  }

  // startFromSession starts collection from a freshly authenticated extension session.
  async startFromSession(session: StoredAuthSession | null): Promise<void> {
    const context = resolveCollectionContext(session)
    if (!context) {
      await this.collector.stop()
      await this.collector.discard()
      return
    }

    await this.collector.start(context)
    await notifyBackgroundCollectionRestore()
  }

  // logout stops active collection and discards pending local summaries without uploading them.
  async logout(): Promise<void> {
    await notifyBackgroundCollectionStop()
    await this.collector.stop()
    await this.collector.discard()
  }

  // stop pauses active collection without implying that pending authenticated summaries should upload.
  async stop(): Promise<void> {
    await this.collector.stop()
  }
}

// notifyBackgroundCollectionRestore asks the service worker runtime to own heartbeat and tab observation.
async function notifyBackgroundCollectionRestore(): Promise<void> {
  const runtime = globalThis.chrome?.runtime as
    | { sendMessage?: (message: unknown) => Promise<unknown> | void }
    | undefined
  await runtime?.sendMessage?.({
    type: BROWSER_ACTIVITY_RESTORE_COLLECTION_MESSAGE
  })
}

// notifyBackgroundCollectionStop asks the service worker runtime to disconnect presence before logout cleanup.
async function notifyBackgroundCollectionStop(): Promise<void> {
  const runtime = globalThis.chrome?.runtime as
    | { sendMessage?: (message: unknown) => Promise<unknown> | void }
    | undefined
  await runtime?.sendMessage?.({
    type: BROWSER_ACTIVITY_STOP_COLLECTION_MESSAGE
  })
}

// resolveCollectionContext extracts the minimum trusted fields required before collection can start.
export function resolveCollectionContext(session: StoredAuthSession | null): BrowserActivityCollectionContext | null {
  const accessToken = session?.accessToken?.trim()
  const terminal = session?.context?.terminal
  const tenantId = session?.context?.tenant?.tenantId?.trim()
  const accountId = session?.context?.account?.accountId?.trim()

  if (!accessToken || terminal !== 'BROWSER_EXTENSION' || !tenantId || !accountId) {
    return null
  }

  return {
    accessToken,
    accountId,
    tenantId
  }
}

// createBrowserActivityExtensionSessionId builds the stable extension session key used in summaries and heartbeat.
export function createBrowserActivityExtensionSessionId(context: Pick<BrowserActivityCollectionContext, 'accountId' | 'tenantId'>): string {
  return `extension-session:${context.tenantId}:${context.accountId}`
}
