import type {
  LocalPublishedStore,
  PublicViewEnvelope,
  ResourceType,
  StoredPublishedResource
} from '../types'
import type {
  ChangedResourceRef,
  ListChangedResourcesInput,
  ReportSyncResultInput
} from '../client/signed-oes-client'
import { SiteRuntimeError } from '../client/errors'

export type SyncTrigger = 'manual' | 'webhook' | 'pull' | 'startup'

export interface SyncEngineClient {
  getLatestPublishState(localPublishVersion?: number): Promise<Record<string, unknown>>
  listChangedResources?(input: ListChangedResourcesInput): Promise<Record<string, unknown>>
  batchGetPublicViews?(resources: ChangedResourceRef[]): Promise<{
    public_views: Array<PublicViewEnvelope | Record<string, unknown>>
    missing_resources: ChangedResourceRef[]
    server_publish_version: number
  }>
  getSnapshot?(input?: Record<string, unknown>): Promise<Record<string, unknown>>
  reportSyncResult?(input: ReportSyncResultInput): Promise<Record<string, unknown>>
}

export interface SyncEngineOptions {
  siteId: string
  store: LocalPublishedStore
  client: SyncEngineClient
}

export interface SyncEngineState {
  syncInProgress: boolean
  pendingSync: boolean
}

export interface SyncResult {
  status: 'completed' | 'skipped' | 'queued'
  localPublishVersion: number
}

// SyncEngine coordinates local publish state with OES latest public views through snapshot or delta.
export class SyncEngine {
  private syncInProgress = false
  private pendingSync = false

  constructor(private readonly options: SyncEngineOptions) {}

  // getState exposes in-process sync concurrency state for health and runtime-status endpoints.
  getState(): SyncEngineState {
    return {
      syncInProgress: this.syncInProgress,
      pendingSync: this.pendingSync
    }
  }

  // syncToLatest pulls OES latest publish data and coalesces concurrent triggers into one pending run.
  async syncToLatest(trigger: SyncTrigger = 'manual'): Promise<SyncResult> {
    if (this.syncInProgress) {
      this.pendingSync = true
      const state = await this.options.store.getPublishState(this.options.siteId)
      return { status: 'queued', localPublishVersion: state.localPublishVersion }
    }

    this.syncInProgress = true
    try {
      let finalResult: SyncResult = { status: 'skipped', localPublishVersion: 0 }
      do {
        this.pendingSync = false
        finalResult = await this.executeOnce(trigger)
      } while (this.pendingSync)
      return finalResult
    } finally {
      this.syncInProgress = false
      this.pendingSync = false
    }
  }

  // executeOnce performs a single latest-state check and applies snapshot or delta if required.
  private async executeOnce(trigger: SyncTrigger): Promise<SyncResult> {
    const state = await this.options.store.getPublishState(this.options.siteId)
    let latest: Record<string, unknown>
    try {
      latest = await this.options.client.getLatestPublishState(state.localPublishVersion)
    } catch (error) {
      await this.recordFailedLatestStateSync(trigger, state.localPublishVersion, error)
      throw error
    }
    const latestPublishVersion = Number(latest.latest_publish_version ?? 0)
    if (latestPublishVersion <= state.localPublishVersion) {
      await this.options.store.updatePublishState({
        ...state,
        lastKnownRemotePublishVersion: latestPublishVersion
      })
      return { status: 'skipped', localPublishVersion: state.localPublishVersion }
    }

    const runId = await this.options.store.beginSyncRun({
      siteId: this.options.siteId,
      trigger,
      fromPublishVersion: state.localPublishVersion,
      toPublishVersion: latestPublishVersion
    })
    const startedAt = new Date().toISOString()
    try {
      const targetVersion =
        state.localPublishVersion === 0
          ? await this.rebuildSnapshot(latestPublishVersion)
          : await this.applyDelta(state.localPublishVersion, latestPublishVersion)
      await this.options.store.updatePublishState({
        siteId: this.options.siteId,
        localPublishVersion: targetVersion,
        latestSyncId: typeof latest.latest_sync_id === 'string' ? latest.latest_sync_id : null,
        lastSuccessfulSyncAt: new Date().toISOString(),
        lastKnownRemotePublishVersion: latestPublishVersion
      })
      await this.options.store.completeSyncRun(runId, {
        status: 'completed',
        localPublishVersion: targetVersion
      })
      await this.reportSyncResult({
        sync_id: typeof latest.latest_sync_id === 'string' ? latest.latest_sync_id : undefined,
        local_publish_version: targetVersion,
        status: 'completed',
        started_at: startedAt,
        completed_at: new Date().toISOString()
      })
      return { status: 'completed', localPublishVersion: targetVersion }
    } catch (error) {
      await this.options.store.completeSyncRun(runId, {
        status: 'failed',
        localPublishVersion: state.localPublishVersion,
        errorCode: error instanceof Error ? error.name : 'SYNC_FAILED',
        errorMessage: sanitizeErrorMessage(error)
      })
      await this.reportSyncResult({
        sync_id: typeof latest.latest_sync_id === 'string' ? latest.latest_sync_id : undefined,
        local_publish_version: state.localPublishVersion,
        status: 'failed',
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        error_code: error instanceof Error ? error.name : 'SYNC_FAILED',
        error_message: sanitizeErrorMessage(error)
      })
      throw error
    }
  }

  // recordFailedLatestStateSync audits failures that occur before a target publish version is known.
  private async recordFailedLatestStateSync(
    trigger: SyncTrigger,
    localPublishVersion: number,
    error: unknown
  ): Promise<void> {
    const runId = await this.options.store.beginSyncRun({
      siteId: this.options.siteId,
      trigger,
      fromPublishVersion: localPublishVersion,
      toPublishVersion: null
    })
    const status = error instanceof SiteRuntimeError && error.runtimeStatus === 'blocked' ? 'blocked' : 'failed'
    await this.options.store.completeSyncRun(runId, {
      status,
      localPublishVersion,
      errorCode: error instanceof SiteRuntimeError ? error.code : error instanceof Error ? error.name : 'SYNC_FAILED',
      errorMessage: sanitizeErrorMessage(error)
    })
    await this.reportSyncResult({
      local_publish_version: localPublishVersion,
      status,
      completed_at: new Date().toISOString(),
      error_code: error instanceof SiteRuntimeError ? error.code : error instanceof Error ? error.name : 'SYNC_FAILED',
      error_message: sanitizeErrorMessage(error)
    })
  }

  // applyDelta fetches final changed public views and writes them without trusting stale action logs.
  private async applyDelta(fromPublishVersion: number, toPublishVersion: number): Promise<number> {
    if (!this.options.client.listChangedResources) {
      return this.rebuildSnapshot(toPublishVersion)
    }
    const delta = await this.options.client.listChangedResources({
      from_publish_version: fromPublishVersion,
      to_publish_version: toPublishVersion
    })
    if (delta.requires_snapshot === true) {
      return this.rebuildSnapshot(Number(delta.to_publish_version ?? toPublishVersion))
    }
    const changedResources = dedupeChangedResources(
      (delta.changed_resources ?? []) as ChangedResourceRef[]
    )
    if (changedResources.length === 0) {
      return Number(delta.to_publish_version ?? toPublishVersion)
    }
    if (!this.options.client.batchGetPublicViews) {
      throw new Error('BatchGetPublicViews client operation is not configured')
    }
    const batch = await this.options.client.batchGetPublicViews(changedResources)
    await this.options.store.upsertPublishedResources(batch.public_views.map(toStoredResource))
    return Number(delta.to_publish_version ?? batch.server_publish_version ?? toPublishVersion)
  }

  // rebuildSnapshot replaces the local store only after every snapshot page has been fetched.
  private async rebuildSnapshot(expectedPublishVersion: number): Promise<number> {
    if (!this.options.client.getSnapshot) {
      throw new Error('GetSnapshot client operation is not configured')
    }
    const resources: StoredPublishedResource[] = []
    let pageToken: string | undefined
    let snapshotPublishVersion = expectedPublishVersion
    do {
      const snapshot = await this.options.client.getSnapshot(
        pageToken ? { page_token: pageToken } : {}
      )
      snapshotPublishVersion = Number(snapshot.snapshot_publish_version ?? expectedPublishVersion)
      resources.push(...((snapshot.public_views ?? []) as Array<Record<string, unknown>>).map(toStoredResource))
      pageToken =
        typeof snapshot.next_page_token === 'string' && snapshot.next_page_token.length > 0
          ? snapshot.next_page_token
          : undefined
      if (snapshot.is_complete === true) {
        pageToken = undefined
      }
    } while (pageToken)

    await this.options.store.replaceSnapshot({
      siteId: this.options.siteId,
      publishVersion: snapshotPublishVersion,
      resources
    })
    return snapshotPublishVersion
  }

  // reportSyncResult best-effort reports sync status without masking local sync errors.
  private async reportSyncResult(input: ReportSyncResultInput): Promise<void> {
    try {
      await this.options.client.reportSyncResult?.(input)
    } catch {
      // Sync reporting is diagnostic and must not convert a completed local sync into failed data.
    }
  }
}

// toStoredResource adapts frozen public view envelope fields into the local store schema.
function toStoredResource(view: PublicViewEnvelope | Record<string, unknown>): StoredPublishedResource {
  const rawView = view as Record<string, unknown>
  const resourceType = String(rawView.resource_type ?? rawView.resourceType) as ResourceType
  return {
    siteId: String(rawView.site_id ?? rawView.siteId),
    resourceType,
    resourceId: String(rawView.resource_id ?? rawView.resourceId),
    slug: String(rawView.slug),
    locale: String(rawView.locale),
    status: String(rawView.status) as StoredPublishedResource['status'],
    publishVersion: Number(rawView.publish_version ?? rawView.publishVersion),
    payloadJson: JSON.stringify(rawView.payload ?? {}),
    updatedAt: String(rawView.updated_at ?? rawView.updatedAt)
  }
}

// dedupeChangedResources keeps only one final view fetch per resource identity.
function dedupeChangedResources(resources: ChangedResourceRef[]): ChangedResourceRef[] {
  return Array.from(
    new Map(
      resources.map((resource) => [
        `${resource.resource_type}:${resource.resource_id}:${resource.locale}`,
        resource
      ])
    ).values()
  )
}

// sanitizeErrorMessage keeps runtime status useful without exposing secrets or stack traces.
function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 300)
  }
  return String(error).slice(0, 300)
}
