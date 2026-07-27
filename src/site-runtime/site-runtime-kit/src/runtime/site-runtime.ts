import { randomUUID } from 'node:crypto'

import {
  normalizeSiteCapabilityManifest,
  type CapabilityRegistrationClaim,
  type SiteCapabilityManifest,
  type SiteCredential,
  type SiteRuntimeStatus,
  type LocalPublishedStore,
  type PublicViewEnvelope
} from '../types'
import { parseSiteCredential } from '../config/credential'
import {
  hashSiteCapabilityManifest,
  normalizeSiteCapabilityRegistrationResponse,
  SignedOesClient
} from '../client/signed-oes-client'
import type {
  GetPreviewViewInput,
  SiteCapabilityRegistrationResponse
} from '../client/signed-oes-client'
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
  last_sync_status: 'idle' | 'running' | 'completed' | 'degraded' | 'failed' | 'blocked'
  last_error_code?: string
  last_error_message?: string
  store_ready: boolean
  sync_in_progress: boolean
  pending_sync: boolean
  kit_version: string
  reported_at: string
}

export interface SiteRuntime {
  readonly credential: Readonly<
    Pick<SiteCredential, 'siteId' | 'clientId' | 'credentialId' | 'oesBaseUrl' | 'environment'>
  >
  readonly client: SyncEngineClient
  readonly publicViews: PublicViewsReader
  readonly capabilities: {
    readonly manifest: SiteCapabilityManifest | null
    getLastRegistration(): SiteCapabilityRegistrationResponse | null
  }
  readonly sync: { syncToLatest(trigger?: 'manual' | 'webhook' | 'pull' | 'startup'): Promise<SyncResult> }
  readonly health: RuntimeHealth
  start(): Promise<void>
  stop(): Promise<void>
  getStatus(): Promise<SiteRuntimeStatusSnapshot>
  handleWebhook(input: WebhookHandleInput): Promise<WebhookHandleResult>
  verifyRuntimeStatus(input: RuntimeStatusAuthInput): Promise<void>
  getPreviewView(input: GetPreviewViewInput): Promise<Record<string, unknown>>
}

export interface CreateSiteRuntimeOptions {
  credential: SiteCredential
  capabilityManifest?: SiteCapabilityManifest
  capabilityRegistrationIdFactory?: () => string
  capabilityRegistrationClaimLeaseMs?: number
  storePath?: string
  store?: LocalPublishedStore
  client?: SyncEngineClient
  sync?: { syncToLatest(trigger?: 'manual' | 'webhook' | 'pull' | 'startup'): Promise<SyncResult> }
  pullIntervalMs?: number
  kitVersion?: string
  now?: () => number
}

export interface RuntimeEnvOverrides {
  capabilityManifest?: SiteCapabilityManifest
  capabilityRegistrationIdFactory?: () => string
  capabilityRegistrationClaimLeaseMs?: number
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
  const capabilityManifest = options.capabilityManifest
    ? normalizeSiteCapabilityManifest(options.capabilityManifest)
    : undefined
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
    capabilityManifest,
    capabilityRegistrationIdFactory:
      options.capabilityRegistrationIdFactory ?? createCapabilityRegistrationId,
    capabilityRegistrationClaimLeaseMs: requirePositiveInteger(
      options.capabilityRegistrationClaimLeaseMs ?? 30_000,
      'capabilityRegistrationClaimLeaseMs'
    ),
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
  capabilityManifest?: SiteCapabilityManifest
  capabilityRegistrationIdFactory: () => string
  capabilityRegistrationClaimLeaseMs: number
  pullIntervalMs: number
  kitVersion: string
  now: () => number
}

interface CapabilityRegistrationCoordinator {
  tail: Promise<void>
  flightsByManifestHash: Map<string, Promise<SiteCapabilityRegistrationResponse>>
}

interface StoreLifecycleCoordinator {
  owners: number
  tail: Promise<void>
}

const capabilityRegistrationCoordinators = new WeakMap<
  LocalPublishedStore,
  Map<string, Map<string, CapabilityRegistrationCoordinator>>
>()

const storeLifecycleCoordinators = new WeakMap<LocalPublishedStore, StoreLifecycleCoordinator>()

// DefaultSiteRuntime owns runtime lifecycle, health, webhook handling, and public runtime status.
class DefaultSiteRuntime implements SiteRuntime {
  readonly credential: SiteRuntime['credential']
  readonly client: SyncEngineClient
  readonly sync: SiteRuntime['sync']
  readonly publicViews: PublicViewsReader
  readonly capabilities: SiteRuntime['capabilities']
  readonly health: RuntimeHealth

  private storeReady = false
  private readonly store: LocalPublishedStore
  private started = false
  private storeAcquired = false
  private lifecycleTail: Promise<void> = Promise.resolve()
  private startPromise: Promise<void> | undefined
  private stopPromise: Promise<void> | undefined
  private capabilityRegistrationPromise: Promise<boolean> | undefined
  private capabilityRegistered = false
  private pullTimer: ReturnType<typeof setInterval> | undefined
  private lastCapabilityRegistration: SiteCapabilityRegistrationResponse | null = null
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
          if (options.capabilityManifest && !this.capabilityRegistered) {
            throw new SiteRuntimeError({
              code: 'CAPABILITY_REGISTRATION_PENDING',
              message: 'Capability registration must succeed before synchronization'
            })
          }
          const result = await options.sync.syncToLatest(trigger)
          this.lastSyncStatus =
            result.status === 'queued'
              ? 'running'
              : result.status === 'degraded'
                ? 'degraded'
                : 'completed'
          this.lastError = undefined
          return result
        } catch (error) {
          this.captureRuntimeError(error, 'SYNC_FAILED')
          throw error
        }
      }
    }
    this.publicViews = options.publicViews
    this.capabilities = Object.freeze({
      manifest: options.capabilityManifest ?? null,
      getLastRegistration: () => this.lastCapabilityRegistration
    })
    this.health = {
      live: async () => ({ live: true }),
      ready: async () => ({ ready: this.storeReady, status: this.resolveStatus() })
    }
  }

  // start initializes local persistence, registers capabilities, pulls once, and starts fallback polling.
  async start(): Promise<void> {
    if (this.started) {
      return
    }
    if (this.startPromise) {
      return this.startPromise
    }
    const startPromise = this.enqueueLifecycle(async () => {
      if (!this.started) {
        await this.startOnce()
      }
    })
    this.startPromise = startPromise
    try {
      await startPromise
    } finally {
      if (this.startPromise === startPromise) {
        this.startPromise = undefined
      }
    }
  }

  // startOnce performs the lifecycle side effects owned by one start single-flight.
  private async startOnce(): Promise<void> {
    try {
      await acquireSharedStore(this.store)
      this.storeAcquired = true
      this.storeReady = true
      const registrationReady = await this.ensureCapabilityRegistration()
      if (registrationReady) {
        await this.sync.syncToLatest('startup').catch(() => undefined)
      }
      if (this.options.pullIntervalMs > 0) {
        this.pullTimer = setInterval(() => {
          void this.runPullFallback()
        }, this.options.pullIntervalMs)
        this.pullTimer.unref?.()
      }
      this.started = true
    } catch (error) {
      if (this.pullTimer) {
        clearInterval(this.pullTimer)
        this.pullTimer = undefined
      }
      this.storeReady = false
      this.started = false
      this.capabilityRegistered = false
      if (this.storeAcquired) {
        try {
          await releaseSharedStore(this.store)
          this.storeAcquired = false
        } catch (releaseError) {
          throw new AggregateError(
            [error, releaseError],
            'Runtime start failed and shared store ownership rollback also failed'
          )
        }
      }
      throw error
    }
  }

  // stop shuts down timers and closes local persistence.
  async stop(): Promise<void> {
    if (this.stopPromise) {
      return this.stopPromise
    }
    const stopPromise = this.enqueueLifecycle(() => this.stopOnce())
    this.stopPromise = stopPromise
    try {
      await stopPromise
    } finally {
      if (this.stopPromise === stopPromise) {
        this.stopPromise = undefined
      }
    }
  }

  // stopOnce releases this Runtime's ownership without closing a store still used by peers.
  private async stopOnce(): Promise<void> {
    if (this.pullTimer) {
      clearInterval(this.pullTimer)
      this.pullTimer = undefined
    }
    if (this.storeAcquired) {
      await releaseSharedStore(this.store)
      this.storeAcquired = false
    }
    this.storeReady = false
    this.started = false
    this.capabilityRegistered = false
  }

  // enqueueLifecycle serializes start/stop transitions and recovers the queue after a failed transition.
  private enqueueLifecycle(work: () => Promise<void>): Promise<void> {
    const operation = this.lifecycleTail.then(work)
    this.lifecycleTail = operation.then(
      () => undefined,
      () => undefined
    )
    return operation
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
  async getPreviewView(input: GetPreviewViewInput): Promise<Record<string, unknown>> {
    if (!this.client.getPreviewView) {
      throw new Error('GetPreviewView client operation is not configured')
    }
    return this.client.getPreviewView(input)
  }

  // ensureCapabilityRegistration retries a failed declaration without allowing sync to overtake it.
  private async ensureCapabilityRegistration(): Promise<boolean> {
    if (!this.options.capabilityManifest || this.capabilityRegistered) {
      return true
    }
    if (this.capabilityRegistrationPromise) {
      return this.capabilityRegistrationPromise
    }
    const manifestHash = hashSiteCapabilityManifest(this.options.capabilityManifest)
    const registrationPromise = coordinateCapabilityRegistration(
      this.store,
      this.credential.siteId,
      this.credential.clientId,
      manifestHash,
      () => this.registerCapabilityManifest(manifestHash)
    )
      .then((registration) => {
        this.lastCapabilityRegistration = registration
        this.capabilityRegistered = true
        this.lastError = undefined
        return true
      })
      .catch((error: unknown) => {
        this.captureRuntimeError(error, 'CAPABILITY_REGISTRATION_FAILED')
        return false
      })
    this.capabilityRegistrationPromise = registrationPromise
    try {
      return await registrationPromise
    } finally {
      if (this.capabilityRegistrationPromise === registrationPromise) {
        this.capabilityRegistrationPromise = undefined
      }
    }
  }

  // registerCapabilityManifest claims, submits, and fence-completes one full manifest generation.
  private async registerCapabilityManifest(
    manifestHash: string
  ): Promise<SiteCapabilityRegistrationResponse> {
    if (!this.options.capabilityManifest || !this.client.registerPageCapabilities) {
      throw new SiteRuntimeError({
        code: 'CAPABILITY_REGISTRATION_NOT_CONFIGURED',
        message: 'RegisterPageCapabilities client operation is not configured'
      })
    }
    let proposedIdempotencyKey: string | undefined
    while (true) {
      let claim: CapabilityRegistrationClaim | undefined
      let claimToken = ''
      while (!claim?.claimed) {
        const previousState = await this.store.getCapabilityRegistrationState(
          this.credential.siteId,
          this.credential.clientId
        )
        if (
          previousState?.manifestHash === manifestHash &&
          previousState.idempotencyKeyTerminal
        ) {
          throw capabilityRegistrationFencedError()
        }
        if (previousState?.manifestHash === manifestHash && previousState.responseJson) {
          const persistedRegistration = parseStoredCapabilityRegistration(
            previousState.responseJson,
            manifestHash
          )
          if (persistedRegistration?.accepted) {
            this.lastCapabilityRegistration = persistedRegistration
          }
        }
        proposedIdempotencyKey =
          previousState?.manifestHash === manifestHash && !previousState.idempotencyKeyTerminal
            ? previousState.idempotencyKey
            : (proposedIdempotencyKey ?? this.options.capabilityRegistrationIdFactory())
        if (proposedIdempotencyKey.trim().length === 0) {
          throw new Error('Capability registration id factory returned an empty key')
        }
        claimToken = randomUUID()
        const claimedAtMs = this.options.now()
        claim = await this.store.claimCapabilityRegistration({
          siteId: this.credential.siteId,
          clientId: this.credential.clientId,
          manifestHash,
          proposedIdempotencyKey,
          claimToken,
          claimedAtMs,
          leaseDurationMs: this.options.capabilityRegistrationClaimLeaseMs,
          updatedAt: new Date(claimedAtMs).toISOString()
        })
        if (!claim.claimed && claim.state.manifestHash === manifestHash) {
          const sharedRegistration = await waitForCapabilityRegistration(
            this.store,
            this.credential.siteId,
            this.credential.clientId,
            manifestHash,
            this.options.now,
            this.options.capabilityRegistrationClaimLeaseMs
          )
          if (sharedRegistration) {
            return sharedRegistration
          }
          claim = undefined
        } else if (!claim.claimed) {
          await waitForCapabilityRegistrationTurn(
            this.store,
            this.credential.siteId,
            this.credential.clientId,
            claim.state.generation,
            this.options.now,
            this.options.capabilityRegistrationClaimLeaseMs
          )
          claim = undefined
        }
      }

      let registration: SiteCapabilityRegistrationResponse
      try {
        registration = normalizeSiteCapabilityRegistrationResponse(
          await this.client.registerPageCapabilities(
            this.options.capabilityManifest,
            this.options.kitVersion,
            claim.state.idempotencyKey,
            claim.state.expectedRegistrationGeneration
          ),
          manifestHash
        )
      } catch (error) {
        await this.releaseCapabilityRegistrationClaim(manifestHash, claim, claimToken)
        throw error
      }

      let completed: boolean
      try {
        completed = await this.store.completeCapabilityRegistrationClaim({
          siteId: this.credential.siteId,
          clientId: this.credential.clientId,
          manifestHash,
          generation: claim.state.generation,
          claimToken,
          responseJson: JSON.stringify(registration),
          remoteRegistrationGeneration: registration.registration_generation,
          idempotencyKeyTerminal: !registration.accepted,
          updatedAt: new Date(this.options.now()).toISOString()
        })
      } catch (error) {
        await this.releaseCapabilityRegistrationClaim(manifestHash, claim, claimToken)
        throw error
      }
      if (!completed) {
        await this.store.observeCapabilityRegistrationGeneration({
          siteId: this.credential.siteId,
          clientId: this.credential.clientId,
          remoteRegistrationGeneration: registration.registration_generation
        })
        throw capabilityRegistrationFencedError()
      }
      if (registration.accepted) {
        return registration
      }
      throw capabilityRegistrationFencedError()
    }
  }

  // releaseCapabilityRegistrationClaim preserves retry identity after a pre-completion failure.
  private async releaseCapabilityRegistrationClaim(
    manifestHash: string,
    claim: CapabilityRegistrationClaim,
    claimToken: string
  ): Promise<void> {
    await this.store.releaseCapabilityRegistrationClaim({
      siteId: this.credential.siteId,
      clientId: this.credential.clientId,
      manifestHash,
      generation: claim.state.generation,
      claimToken,
      updatedAt: new Date(this.options.now()).toISOString()
    })
  }

  // runPullFallback recovers capability registration before waking latest-version synchronization.
  private async runPullFallback(): Promise<void> {
    if (await this.ensureCapabilityRegistration()) {
      await this.sync.syncToLatest('pull').catch(() => undefined)
    }
  }

  // captureRuntimeError stores a safe health summary while leaving committed data untouched.
  private captureRuntimeError(error: unknown, fallbackCode: string): void {
    this.lastError = {
      code: error instanceof SiteRuntimeError ? error.code : error instanceof Error ? error.name : fallbackCode,
      message: error instanceof Error ? error.message : String(error)
    }
    this.lastSyncStatus =
      error instanceof SiteRuntimeError && error.runtimeStatus === 'blocked' ? 'blocked' : 'failed'
  }

  // resolveStatus maps local store and last sync state to runtime status semantics.
  private resolveStatus(): SiteRuntimeStatus {
    if (!this.storeReady) {
      return 'failed'
    }
    if (this.lastSyncStatus === 'blocked') {
      return 'blocked'
    }
    if (this.lastSyncStatus === 'failed' || this.lastSyncStatus === 'degraded') {
      return 'degraded'
    }
    return 'healthy'
  }
}

// acquireSharedStore initializes a store once and increments its process-local Runtime ownership count.
function acquireSharedStore(store: LocalPublishedStore): Promise<void> {
  const coordinator = getStoreLifecycleCoordinator(store)
  return enqueueStoreLifecycle(coordinator, async () => {
    if (coordinator.owners === 0) {
      await store.init()
    }
    coordinator.owners += 1
  })
}

// releaseSharedStore closes a store only after the final Runtime owner releases it.
function releaseSharedStore(store: LocalPublishedStore): Promise<void> {
  const coordinator = getStoreLifecycleCoordinator(store)
  return enqueueStoreLifecycle(coordinator, async () => {
    if (coordinator.owners < 1) {
      throw new Error('Shared store lifecycle release has no matching owner')
    }
    if (coordinator.owners > 1) {
      coordinator.owners -= 1
      return
    }
    await store.close()
    coordinator.owners = 0
  })
}

// getStoreLifecycleCoordinator returns the ref-count and serialization queue for one store object.
function getStoreLifecycleCoordinator(store: LocalPublishedStore): StoreLifecycleCoordinator {
  let coordinator = storeLifecycleCoordinators.get(store)
  if (!coordinator) {
    coordinator = { owners: 0, tail: Promise.resolve() }
    storeLifecycleCoordinators.set(store, coordinator)
  }
  return coordinator
}

// enqueueStoreLifecycle serializes store ownership transitions without poisoning later retries.
function enqueueStoreLifecycle(
  coordinator: StoreLifecycleCoordinator,
  work: () => Promise<void>
): Promise<void> {
  const operation = coordinator.tail.then(work)
  coordinator.tail = operation.then(
    () => undefined,
    () => undefined
  )
  return operation
}

// coordinateCapabilityRegistration serializes manifests per store/site/client stream while sharing same-manifest work.
function coordinateCapabilityRegistration(
  store: LocalPublishedStore,
  siteId: string,
  clientId: string,
  manifestHash: string,
  work: () => Promise<SiteCapabilityRegistrationResponse>
): Promise<SiteCapabilityRegistrationResponse> {
  let coordinatorsBySiteAndClient = capabilityRegistrationCoordinators.get(store)
  if (!coordinatorsBySiteAndClient) {
    coordinatorsBySiteAndClient = new Map()
    capabilityRegistrationCoordinators.set(store, coordinatorsBySiteAndClient)
  }
  let coordinatorsByClient = coordinatorsBySiteAndClient.get(siteId)
  if (!coordinatorsByClient) {
    coordinatorsByClient = new Map()
    coordinatorsBySiteAndClient.set(siteId, coordinatorsByClient)
  }
  let coordinator = coordinatorsByClient.get(clientId)
  if (!coordinator) {
    coordinator = { tail: Promise.resolve(), flightsByManifestHash: new Map() }
    coordinatorsByClient.set(clientId, coordinator)
  }
  const existing = coordinator.flightsByManifestHash.get(manifestHash)
  if (existing) {
    return existing
  }
  const flight = coordinator.tail.then(work)
  coordinator.tail = flight.then(
    () => undefined,
    () => undefined
  )
  coordinator.flightsByManifestHash.set(manifestHash, flight)
  void flight.then(
    () => {
      if (coordinator?.flightsByManifestHash.get(manifestHash) === flight) {
        coordinator.flightsByManifestHash.delete(manifestHash)
      }
    },
    () => {
      if (coordinator?.flightsByManifestHash.get(manifestHash) === flight) {
        coordinator.flightsByManifestHash.delete(manifestHash)
      }
    }
  )
  return flight
}

// waitForCapabilityRegistration observes another store connection's same-manifest claim without duplicating it.
async function waitForCapabilityRegistration(
  store: LocalPublishedStore,
  siteId: string,
  clientId: string,
  manifestHash: string,
  now: () => number,
  maxWaitMs: number
): Promise<SiteCapabilityRegistrationResponse | null> {
  const maxAttempts = Math.ceil(maxWaitMs / 10) + 1
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const state = await store.getCapabilityRegistrationState(siteId, clientId)
    if (!state || state.manifestHash !== manifestHash) {
      throw new SiteRuntimeError({
        code: 'CAPABILITY_REGISTRATION_FENCED',
        message: 'A newer complete capability manifest superseded this registration'
      })
    }
    if (state.claimToken === null) {
      const registration = state.responseJson
        ? parseStoredCapabilityRegistration(state.responseJson, manifestHash)
        : null
      if (state.idempotencyKeyTerminal) {
        throw capabilityRegistrationFencedError()
      }
      if (!registration?.accepted) {
        return null
      }
      return registration
    }
    if (state.claimExpiresAtMs !== null && now() >= state.claimExpiresAtMs) {
      return null
    }
    await wait(10)
  }
  throw new SiteRuntimeError({
    code: 'CAPABILITY_REGISTRATION_TIMEOUT',
    message: 'Timed out waiting for the shared capability registration'
  })
}

// waitForCapabilityRegistrationTurn waits for another manifest generation to release its SQLite lease.
async function waitForCapabilityRegistrationTurn(
  store: LocalPublishedStore,
  siteId: string,
  clientId: string,
  blockedGeneration: number,
  now: () => number,
  maxWaitMs: number
): Promise<void> {
  const maxAttempts = Math.ceil(maxWaitMs / 10) + 1
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const state = await store.getCapabilityRegistrationState(siteId, clientId)
    if (
      !state ||
      state.generation !== blockedGeneration ||
      state.claimToken === null ||
      (state.claimExpiresAtMs !== null && now() >= state.claimExpiresAtMs)
    ) {
      return
    }
    await wait(10)
  }
  throw new SiteRuntimeError({
    code: 'CAPABILITY_REGISTRATION_TIMEOUT',
    message: 'Timed out waiting for the current capability manifest registration lease'
  })
}

// wait yields briefly while another SQLite connection owns a registration claim.
function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

// createCapabilityRegistrationId creates one retry-stable id persisted by the local Runtime store.
function createCapabilityRegistrationId(): string {
  return `site-capabilities:${randomUUID()}`
}

// capabilityRegistrationFencedError reports that local completion no longer owns the desired manifest.
function capabilityRegistrationFencedError(): SiteRuntimeError {
  return new SiteRuntimeError({
    code: 'CAPABILITY_REGISTRATION_FENCED',
    message: 'A newer complete capability manifest superseded this registration'
  })
}

// parseStoredCapabilityRegistration restores only the public-safe fields from a prior successful response.
function parseStoredCapabilityRegistration(
  responseJson: string,
  expectedManifestHash: string
): SiteCapabilityRegistrationResponse | null {
  try {
    return normalizeSiteCapabilityRegistrationResponse(
      JSON.parse(responseJson) as unknown,
      expectedManifestHash
    )
  } catch {
    return null
  }
}

// parseOptionalInteger reads optional positive millisecond settings from local env.
function parseOptionalInteger(value: string | undefined): number | undefined {
  if (value === undefined || value.length === 0) {
    return undefined
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error('Invalid OES_SITE_PULL_INTERVAL_MS')
  }
  return parsed
}

// requirePositiveInteger validates bounded lifecycle durations before they control persisted leases.
function requirePositiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Invalid ${name}`)
  }
  return value
}

// singleHeader normalizes runtime request headers into a single string value.
function singleHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}
