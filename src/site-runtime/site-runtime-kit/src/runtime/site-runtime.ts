import type { SiteCredential, SiteRuntimeStatus, LocalPublishedStore, PublicViewEnvelope } from '../types'
import { parseSiteCredential } from '../config/credential'
import { SignedOesClient } from '../client/signed-oes-client'
import { SiteRuntimeError } from '../client/errors'
import { NodeSqlitePublishedStore } from '../store/node-sqlite-published-store'
import { PublicViewsReader } from '../public-views/public-views-reader'
import { SyncEngine, type SyncEngineClient, type SyncResult } from '../sync/sync-engine'
import { verifyWebhookRequest } from '../security/webhook-verifier'
import { verifyRuntimeStatusRequest } from '../security/runtime-status-verifier'

export interface RuntimeHealth {
  live(): Promise<{ live: true }>
  ready(): Promise<{ ready: boolean; status: SiteRuntimeStatus }>
}

export interface SiteRuntimeStatusSnapshot {
  site_id: string
  status: SiteRuntimeStatus
  local_publish_version: number
  last_known_remote_publish_version?: number
  last_successful_sync_at?: string
  last_sync_status: 'idle' | 'running' | 'completed' | 'failed' | 'blocked'
  last_error_code?: string
  last_error_message?: string
  store_ready: boolean
  sync_in_progress: boolean
  pending_sync: boolean
  kit_version: string
  reported_at: string
}

export interface SiteRuntime {
  credential: Pick<SiteCredential, 'siteId' | 'clientId' | 'credentialId' | 'oesBaseUrl' | 'environment'>
  client: SyncEngineClient
  store: LocalPublishedStore
  publicViews: PublicViewsReader
  sync: { syncToLatest(trigger?: 'manual' | 'webhook' | 'pull' | 'startup'): Promise<SyncResult> }
  health: RuntimeHealth
  start(): Promise<void>
  stop(): Promise<void>
  getStatus(): Promise<SiteRuntimeStatusSnapshot>
  handleWebhook(input: WebhookHandleInput): Promise<WebhookHandleResult>
  verifyRuntimeStatus(input: RuntimeStatusAuthInput): Promise<void>
  getPreviewView(input: Record<string, unknown>): Promise<Record<string, unknown>>
}

export interface CreateSiteRuntimeOptions {
  credential: SiteCredential
  storePath?: string
  store?: LocalPublishedStore
  client?: SyncEngineClient
  sync?: { syncToLatest(trigger?: 'manual' | 'webhook' | 'pull' | 'startup'): Promise<SyncResult> }
  pullIntervalMs?: number
  kitVersion?: string
  now?: () => number
}

export interface RuntimeEnvOverrides {
  client?: SyncEngineClient
  store?: LocalPublishedStore
  sync?: { syncToLatest(trigger?: 'manual' | 'webhook' | 'pull' | 'startup'): Promise<SyncResult> }
  kitVersion?: string
  now?: () => number
  pullIntervalMs?: number
  storePath?: string
}

export interface WebhookHandleInput {
  method: string
  url: string
  body: string
  headers: Record<string, string | string[] | undefined>
}

export interface WebhookHandleResult {
  accepted: true
  duplicate: boolean
  eventId: string
}

export interface RuntimeStatusAuthInput {
  method: string
  url: string
  body?: string
  headers: Record<string, string | string[] | undefined>
}

// createSiteRuntimeFromEnv builds a runtime from OES_SITE_CREDENTIAL and local runtime env overrides.
export async function createSiteRuntimeFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  overrides: RuntimeEnvOverrides = {}
): Promise<SiteRuntime> {
  if (!env.OES_SITE_CREDENTIAL) {
    throw new Error('Missing OES_SITE_CREDENTIAL')
  }
  return createSiteRuntime({
    credential: parseSiteCredential(env.OES_SITE_CREDENTIAL),
    storePath: overrides.storePath ?? env.OES_SITE_STORE_PATH ?? './data/site-runtime.sqlite',
    pullIntervalMs: overrides.pullIntervalMs ?? parseOptionalInteger(env.OES_SITE_PULL_INTERVAL_MS),
    ...overrides
  })
}

// createSiteRuntime assembles the site runtime kernel from credential, client, store, and sync boundaries.
export async function createSiteRuntime(options: CreateSiteRuntimeOptions): Promise<SiteRuntime> {
  const store =
    options.store ??
    new NodeSqlitePublishedStore({
      path: options.storePath ?? './data/site-runtime.sqlite'
    })
  const client = options.client ?? new SignedOesClient({ credential: options.credential })
  const syncEngine = new SyncEngine({
    siteId: options.credential.siteId,
    store,
    client
  })
  const sync = options.sync ?? syncEngine
  const publicViews = new PublicViewsReader(store, options.credential.siteId)
  const runtime = new DefaultSiteRuntime({
    credential: options.credential,
    store,
    client,
    sync,
    syncEngine,
    publicViews,
    pullIntervalMs: options.pullIntervalMs ?? 60_000,
    kitVersion: options.kitVersion ?? '0.1.0',
    now: options.now ?? Date.now
  })
  return runtime
}

interface DefaultSiteRuntimeOptions {
  credential: SiteCredential
  store: LocalPublishedStore
  client: SyncEngineClient
  sync: { syncToLatest(trigger?: 'manual' | 'webhook' | 'pull' | 'startup'): Promise<SyncResult> }
  syncEngine: SyncEngine
  publicViews: PublicViewsReader
  pullIntervalMs: number
  kitVersion: string
  now: () => number
}

// DefaultSiteRuntime owns runtime lifecycle, health, webhook handling, and public runtime status.
class DefaultSiteRuntime implements SiteRuntime {
  readonly credential: SiteRuntime['credential']
  readonly client: SyncEngineClient
  readonly store: LocalPublishedStore
  readonly sync: SiteRuntime['sync']
  readonly publicViews: PublicViewsReader
  readonly health: RuntimeHealth

  private storeReady = false
  private pullTimer: ReturnType<typeof setInterval> | undefined
  private lastError: { code: string; message: string } | undefined
  private lastSyncStatus: SiteRuntimeStatusSnapshot['last_sync_status'] = 'idle'

  constructor(private readonly options: DefaultSiteRuntimeOptions) {
    this.credential = {
      siteId: options.credential.siteId,
      clientId: options.credential.clientId,
      credentialId: options.credential.credentialId,
      oesBaseUrl: options.credential.oesBaseUrl,
      environment: options.credential.environment
    }
    this.client = options.client
    this.store = options.store
    this.sync = {
      syncToLatest: async (trigger = 'manual') => {
        this.lastSyncStatus = 'running'
        try {
          const result = await options.sync.syncToLatest(trigger)
          this.lastSyncStatus = result.status === 'queued' ? 'running' : 'completed'
          return result
        } catch (error) {
          this.lastError = {
            code: error instanceof SiteRuntimeError ? error.code : error instanceof Error ? error.name : 'SYNC_FAILED',
            message: error instanceof Error ? error.message : String(error)
          }
          this.lastSyncStatus =
            error instanceof SiteRuntimeError && error.runtimeStatus === 'blocked' ? 'blocked' : 'failed'
          throw error
        }
      }
    }
    this.publicViews = options.publicViews
    this.health = {
      live: async () => ({ live: true }),
      ready: async () => ({ ready: this.storeReady, status: this.resolveStatus() })
    }
  }

  // start initializes local persistence and starts pull fallback when enabled.
  async start(): Promise<void> {
    await this.store.init()
    this.storeReady = true
    if (this.options.pullIntervalMs > 0) {
      this.pullTimer = setInterval(() => {
        void this.sync.syncToLatest('pull').catch(() => undefined)
      }, this.options.pullIntervalMs)
      this.pullTimer.unref?.()
    }
  }

  // stop shuts down timers and closes local persistence.
  async stop(): Promise<void> {
    if (this.pullTimer) {
      clearInterval(this.pullTimer)
      this.pullTimer = undefined
    }
    await this.store.close()
    this.storeReady = false
  }

  // getStatus returns protected runtime status without secrets, signatures, nonces, or stack traces.
  async getStatus(): Promise<SiteRuntimeStatusSnapshot> {
    const publishState = await this.store.getPublishState(this.credential.siteId)
    const syncState = this.options.syncEngine.getState()
    return {
      site_id: this.credential.siteId,
      status: this.resolveStatus(),
      local_publish_version: publishState.localPublishVersion,
      last_known_remote_publish_version:
        publishState.lastKnownRemotePublishVersion === null
          ? undefined
          : publishState.lastKnownRemotePublishVersion,
      last_successful_sync_at: publishState.lastSuccessfulSyncAt ?? undefined,
      last_sync_status: syncState.syncInProgress ? 'running' : this.lastSyncStatus,
      last_error_code: this.lastError?.code,
      last_error_message: this.lastError?.message,
      store_ready: this.storeReady,
      sync_in_progress: syncState.syncInProgress,
      pending_sync: syncState.pendingSync,
      kit_version: this.options.kitVersion,
      reported_at: new Date(this.options.now()).toISOString()
    }
  }

  // handleWebhook verifies a signed OES webhook and triggers at most one sync per accepted event id.
  async handleWebhook(input: WebhookHandleInput): Promise<WebhookHandleResult> {
    const verification = await verifyWebhookRequest({
      credential: this.options.credential,
      method: input.method,
      url: input.url,
      body: input.body,
      headers: input.headers,
      nonceStore: {
        has: (nonce) => this.store.hasWebhookNonce(this.credential.siteId, nonce),
        remember: (nonce) => this.store.rememberWebhookNonce(this.credential.siteId, nonce)
      },
      now: this.options.now
    })
    const nonce = singleHeader(input.headers, 'x-oes-nonce') ?? ''
    const inserted = await this.store.rememberWebhookEvent(
      this.credential.siteId,
      verification.eventId,
      nonce
    )
    if (!inserted) {
      return { accepted: true, duplicate: true, eventId: verification.eventId }
    }
    await this.sync.syncToLatest('webhook')
    return { accepted: true, duplicate: false, eventId: verification.eventId }
  }

  // verifyRuntimeStatus validates protected OES polling without exposing secrets to controllers.
  async verifyRuntimeStatus(input: RuntimeStatusAuthInput): Promise<void> {
    await verifyRuntimeStatusRequest({
      credential: this.options.credential,
      method: input.method,
      url: input.url,
      body: input.body ?? '',
      headers: input.headers,
      now: this.options.now,
      nonceStore: {
        has: (nonce) => this.store.hasWebhookNonce(this.credential.siteId, nonce),
        remember: (nonce) => this.store.rememberWebhookNonce(this.credential.siteId, nonce)
      }
    })
  }

  // getPreviewView fetches a draft preview view through the signed client without writing local store.
  async getPreviewView(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const previewClient = this.client as SyncEngineClient & {
      getPreviewView?: (previewInput: Record<string, unknown>) => Promise<Record<string, unknown>>
    }
    if (!previewClient.getPreviewView) {
      throw new Error('GetPreviewView client operation is not configured')
    }
    return previewClient.getPreviewView(input)
  }

  // resolveStatus maps local store and last sync state to runtime status semantics.
  private resolveStatus(): SiteRuntimeStatus {
    if (!this.storeReady) {
      return 'failed'
    }
    if (this.lastSyncStatus === 'blocked') {
      return 'blocked'
    }
    if (this.lastSyncStatus === 'failed') {
      return 'degraded'
    }
    return 'healthy'
  }
}

// parseOptionalInteger reads optional positive millisecond settings from local env.
function parseOptionalInteger(value: string | undefined): number | undefined {
  if (value === undefined || value.length === 0) {
    return undefined
  }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('Invalid OES_SITE_PULL_INTERVAL_MS')
  }
  return parsed
}

// singleHeader normalizes runtime request headers into a single string value.
function singleHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}
