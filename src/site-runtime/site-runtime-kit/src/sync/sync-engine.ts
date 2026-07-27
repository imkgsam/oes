import {
  normalizeSiteExposurePublication,
  type LocalPublishedStore,
  type PublishedResourceIdentity,
  type ResourceType,
  type SiteCapabilityManifest,
  type SiteExposurePublication,
  type StoredPublishedResource
} from '../types'
import type {
  ChangedResourceRef,
  GetPreviewViewInput,
  ListChangedResourcesInput,
  ReportSyncResultInput,
  SiteCapabilityRegistrationResponse
} from '../client/signed-oes-client'
import { SiteRuntimeError } from '../client/errors'
import {
  normalizeSyncReportAcknowledgement,
  requireNativeBoolean as requireBoolean,
  requireNonNegativeSafeInteger,
  requirePlainRecord as requireResponseRecord,
  requireTimestamp,
  requireTrimmedString
} from '../client/internal-contract-codec'

export type SyncTrigger = 'manual' | 'webhook' | 'pull' | 'startup'

export interface SyncEngineClient {
  registerPageCapabilities?(
    manifest: SiteCapabilityManifest,
    runtimeVersion: string,
    idempotencyKey: string,
    expectedRegistrationGeneration: string
  ): Promise<SiteCapabilityRegistrationResponse>
  getLatestPublishState(localPublishVersion?: number): Promise<Record<string, unknown>>
  listChangedResources?(input: ListChangedResourcesInput): Promise<Record<string, unknown>>
  batchGetPublicViews?(resources: ChangedResourceRef[], targetPublishVersion: number): Promise<unknown>
  getSnapshot?(input?: Record<string, unknown>): Promise<Record<string, unknown>>
  reportSyncResult?(input: ReportSyncResultInput): Promise<Record<string, unknown>>
  getPreviewView?(input: GetPreviewViewInput): Promise<Record<string, unknown>>
}

export interface SyncEngineOptions {
  siteId: string
  store: LocalPublishedStore
  client: SyncEngineClient
  limits?: Partial<SyncEngineLimits>
}

export interface SyncEngineLimits {
  maxSnapshotPages: number
  maxSnapshotResources: number
  maxDeltaResources: number
  deltaBatchSize: number
  maxPageTokenLength: number
  maxResourcePayloadBytes: number
  maxPublicationPayloadBytes: number
}

export interface SyncEngineState {
  syncInProgress: boolean
  pendingSync: boolean
}

export interface SyncResult {
  status: 'completed' | 'degraded' | 'skipped' | 'queued'
  localPublishVersion: number
}

interface PostCommitIssue {
  code: 'SYNC_AUDIT_FAILED' | 'SYNC_REPORT_FAILED'
  message: string
}

interface SiteChangedResourceRef {
  resource_type: string
  resource_id: string
  locale: string
  latest_publish_version?: unknown
}

interface BusinessChangedResourceRef extends ChangedResourceRef {
  latest_publish_version: number
}

// SyncEngine coordinates local publish state with OES latest public views through snapshot or delta.
export class SyncEngine {
  private syncInProgress = false
  private pendingSync = false
  private readonly limits: SyncEngineLimits

  constructor(private readonly options: SyncEngineOptions) {
    this.limits = normalizeSyncLimits(options.limits)
  }

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
    let latestPublishVersion: number
    try {
      latest = await this.options.client.getLatestPublishState(state.localPublishVersion)
      requireSiteId(latest.site_id, this.options.siteId, 'latest state')
      latestPublishVersion = requirePublishVersion(
        latest.latest_publish_version,
        'latest publish_version'
      )
    } catch (error) {
      await this.recordFailedLatestStateSync(trigger, state.localPublishVersion, error)
      throw error
    }
    if (latestPublishVersion < state.localPublishVersion) {
      throw new Error(
        `REMOTE_PUBLISH_VERSION_ROLLBACK: local ${state.localPublishVersion}, remote ${latestPublishVersion}`
      )
    }
    let requiresExposureHydration = false
    if (latestPublishVersion === state.localPublishVersion) {
      const observed = await this.options.store.observeRemotePublishVersion({
        siteId: this.options.siteId,
        expectedLocalPublishVersion: state.localPublishVersion,
        remotePublishVersion: latestPublishVersion
      })
      const exposure = await this.options.store.getSiteExposurePublication(this.options.siteId)
      const confirmedState = await this.options.store.getPublishState(this.options.siteId)
      if (!observed || confirmedState.localPublishVersion !== state.localPublishVersion) {
        this.pendingSync = true
        return { status: 'queued', localPublishVersion: confirmedState.localPublishVersion }
      }
      requiresExposureHydration =
        state.localPublishVersion > 0 && exposure?.publishVersion !== state.localPublishVersion
      if (!requiresExposureHydration) {
        return { status: 'skipped', localPublishVersion: state.localPublishVersion }
      }
    }

    const runId = await this.options.store.beginSyncRun({
      siteId: this.options.siteId,
      trigger,
      fromPublishVersion: state.localPublishVersion,
      toPublishVersion: latestPublishVersion
    })
    const startedAt = new Date().toISOString()
    const latestSyncId = typeof latest.latest_sync_id === 'string' ? latest.latest_sync_id : null
    let targetVersion: number
    try {
      targetVersion =
        state.localPublishVersion === 0 || requiresExposureHydration
          ? await this.rebuildSnapshot(state.localPublishVersion, latestPublishVersion, latestSyncId)
          : await this.applyDelta(state.localPublishVersion, latestPublishVersion, latestSyncId)
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
    const result = await this.finalizeCommittedSync({
      runId,
      syncId: latestSyncId,
      targetVersion,
      startedAt
    })
    await this.scheduleCatchUpAfterCommit(result.localPublishVersion)
    return result
  }

  // finalizeCommittedSync isolates audit/report failures after the atomic publication commit point.
  private async finalizeCommittedSync(input: {
    runId: string
    syncId: string | null
    targetVersion: number
    startedAt: string
  }): Promise<SyncResult> {
    const issues: PostCommitIssue[] = []
    try {
      await this.options.store.completeSyncRun(input.runId, {
        status: 'completed',
        localPublishVersion: input.targetVersion
      })
    } catch (error) {
      issues.push({ code: 'SYNC_AUDIT_FAILED', message: sanitizeErrorMessage(error) })
    }

    let committedVersion = input.targetVersion
    if (issues.length > 0) {
      committedVersion = await this.readCommittedVersion(input.targetVersion)
    }
    const reportError = await this.reportSyncResult({
      sync_id: input.syncId ?? undefined,
      local_publish_version: committedVersion,
      status: issues.length > 0 ? 'degraded' : 'completed',
      started_at: input.startedAt,
      completed_at: new Date().toISOString(),
      error_code: issues[0]?.code,
      error_message: issues[0]?.message
    })
    if (reportError !== null) {
      issues.push({ code: 'SYNC_REPORT_FAILED', message: sanitizeErrorMessage(reportError) })
      committedVersion = await this.readCommittedVersion(input.targetVersion)
    }
    if (issues.length === 0) {
      return { status: 'completed', localPublishVersion: committedVersion }
    }

    try {
      await this.options.store.completeSyncRun(input.runId, {
        status: 'degraded',
        localPublishVersion: committedVersion,
        errorCode: issues.map((issue) => issue.code).join('+'),
        errorMessage: issues.map((issue) => issue.message).join('; ')
      })
    } catch {
      // The committed publication remains authoritative even when diagnostic persistence is unavailable.
    }
    return { status: 'degraded', localPublishVersion: committedVersion }
  }

  // readCommittedVersion re-reads the publication state after post-commit diagnostics fail.
  private async readCommittedVersion(fallbackVersion: number): Promise<number> {
    try {
      return (await this.options.store.getPublishState(this.options.siteId)).localPublishVersion
    } catch {
      return fallbackVersion
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
  private async applyDelta(
    fromPublishVersion: number,
    toPublishVersion: number,
    latestSyncId: string | null
  ): Promise<number> {
    if (!this.options.client.listChangedResources) {
      return this.rebuildSnapshot(fromPublishVersion, toPublishVersion, latestSyncId)
    }
    const delta = requireResponseRecord(
      await this.options.client.listChangedResources({
        from_publish_version: fromPublishVersion,
        to_publish_version: toPublishVersion
      }),
      'delta response'
    )
    requireVersion(
      requirePublishVersion(delta.from_publish_version, 'delta from_publish_version'),
      fromPublishVersion,
      'delta from_publish_version'
    )
    const deltaTargetVersion = requirePublishVersion(
      delta.to_publish_version,
      'delta to_publish_version'
    )
    requireVersion(deltaTargetVersion, toPublishVersion, 'delta to_publish_version')
    requireSiteId(delta.site_id, this.options.siteId, 'delta')
    const requiresSnapshot = requireBoolean(delta.requires_snapshot, 'delta requires_snapshot')
    if (requiresSnapshot) {
      return this.rebuildSnapshot(fromPublishVersion, deltaTargetVersion, latestSyncId)
    }
    const changedResourceRecords = requireRecordArray(
      delta.changed_resources,
      'delta changed_resources'
    )
    if (changedResourceRecords.length > this.limits.maxDeltaResources) {
      throw new Error('DELTA_LIMIT_EXCEEDED: changed resource count exceeds the configured budget')
    }
    const changedResources = businessChangedResources(
      dedupeChangedResources(
        changedResourceRecords.map(normalizeChangedResourceRef)
      ),
      this.options.siteId,
      fromPublishVersion,
      deltaTargetVersion
    )
    if (!this.options.client.batchGetPublicViews) {
      throw new Error('BatchGetPublicViews client operation is not configured')
    }
    const resources: StoredPublishedResource[] = []
    const missingResources: PublishedResourceIdentity[] = []
    let exposure: SiteExposurePublication | undefined
    let totalPayloadBytes = 0
    const changedBatches = chunkChangedResources(changedResources, this.limits.deltaBatchSize)
    for (const changedBatch of changedBatches) {
      const batchResources = changedBatch.map((resource) => ({
        resource_type: resource.resource_type,
        resource_id: resource.resource_id,
        locale: resource.locale
      }))
      const batch = requireResponseRecord(
        await this.options.client.batchGetPublicViews(batchResources, deltaTargetVersion),
        'batch response'
      )
      requireVersion(
        requirePublishVersion(batch.server_publish_version, 'batch server_publish_version'),
        deltaTargetVersion,
        'batch server_publish_version'
      )
      const batchExposure = requireExposurePublication(
        batch.exposure_publication,
        this.options.siteId,
        deltaTargetVersion,
        'batch'
      )
      if (exposure && JSON.stringify(exposure) !== JSON.stringify(batchExposure)) {
        throw new Error('PUBLISH_VERSION_MISMATCH: batch exposure changed between resource batches')
      }
      exposure = batchExposure
      const batchMissing = requireRecordArray(
        batch.missing_resources,
        'batch missing_resources'
      ).map(toPublishedResourceIdentity)
      const batchViews = requireRecordArray(batch.public_views, 'batch public_views').map(
        (view, index) => toStoredResource(view, this.options.siteId, `batch public_views member ${index}`)
      )
      validateResourceVersions(batchViews, deltaTargetVersion, 'batch public views')
      validateBatchResourceCoverage(changedBatch, batchViews, batchMissing)
      totalPayloadBytes = consumePayloadBudget(batchViews, totalPayloadBytes, this.limits)
      missingResources.push(...batchMissing)
      resources.push(...batchViews)
    }
    validateBatchResourceCoverage(changedResources, resources, missingResources)
    await this.options.store.commitPublication({
      mode: 'delta',
      siteId: this.options.siteId,
      expectedLocalPublishVersion: fromPublishVersion,
      publishVersion: deltaTargetVersion,
      latestSyncId,
      lastKnownRemotePublishVersion: toPublishVersion,
      exposure: exposure!,
      resources,
      missingResources
    })
    return deltaTargetVersion
  }

  // rebuildSnapshot replaces the local store only after every snapshot page has been fetched.
  private async rebuildSnapshot(
    expectedLocalPublishVersion: number,
    expectedPublishVersion: number,
    latestSyncId: string | null
  ): Promise<number> {
    if (!this.options.client.getSnapshot) {
      throw new Error('GetSnapshot client operation is not configured')
    }
    const resources: StoredPublishedResource[] = []
    let pageToken: string | undefined
    let exposure: SiteExposurePublication | undefined
    const seenPageTokens = new Set<string>()
    let pageCount = 0
    let totalPayloadBytes = 0
    do {
      const snapshot = requireResponseRecord(
        await this.options.client.getSnapshot({
          target_publish_version: expectedPublishVersion,
          ...(pageToken ? { page_token: pageToken } : {})
        }),
        'snapshot response'
      )
      pageCount += 1
      if (pageCount > this.limits.maxSnapshotPages) {
        throw new Error('SNAPSHOT_LIMIT_EXCEEDED: page count exceeds the configured budget')
      }
      const snapshotPublishVersion = requirePublishVersion(
        snapshot.snapshot_publish_version,
        'snapshot publish_version'
      )
      requireVersion(snapshotPublishVersion, expectedPublishVersion, 'snapshot publish_version')
      requireSiteId(snapshot.site_id, this.options.siteId, 'snapshot')
      const pageExposure = requireExposurePublication(
        snapshot.exposure_publication,
        this.options.siteId,
        expectedPublishVersion,
        'snapshot'
      )
      if (exposure && JSON.stringify(exposure) !== JSON.stringify(pageExposure)) {
        throw new Error('PUBLISH_VERSION_MISMATCH: snapshot exposure changed between pages')
      }
      exposure = pageExposure
      const pageResources = requireRecordArray(snapshot.public_views, 'snapshot public_views').map(
        (view, index) =>
          toStoredResource(view, this.options.siteId, `snapshot public_views member ${index}`)
      )
      validateResourceVersions(pageResources, expectedPublishVersion, 'snapshot public views')
      if (resources.length + pageResources.length > this.limits.maxSnapshotResources) {
        throw new Error('SNAPSHOT_LIMIT_EXCEEDED: resources exceed the configured budget')
      }
      totalPayloadBytes = consumePayloadBudget(pageResources, totalPayloadBytes, this.limits)
      resources.push(...pageResources)
      const isComplete = requireBoolean(snapshot.is_complete, 'snapshot is_complete')
      const nextPageToken = normalizePageToken(snapshot.next_page_token, this.limits.maxPageTokenLength)
      if (isComplete === (nextPageToken !== undefined)) {
        throw new Error(
          'SNAPSHOT_PAGINATION_INVALID: is_complete and next_page_token are contradictory'
        )
      }
      if (nextPageToken && seenPageTokens.has(nextPageToken)) {
        throw new Error('SNAPSHOT_PAGINATION_INVALID: repeated next_page_token')
      }
      if (!isComplete && pageCount >= this.limits.maxSnapshotPages) {
        throw new Error('SNAPSHOT_LIMIT_EXCEEDED: pages require another request beyond the configured budget')
      }
      if (nextPageToken) {
        seenPageTokens.add(nextPageToken)
      }
      pageToken = nextPageToken
    } while (pageToken)

    await this.options.store.commitPublication({
      mode:
        expectedLocalPublishVersion === expectedPublishVersion ? 'rebuild' : 'snapshot',
      siteId: this.options.siteId,
      expectedLocalPublishVersion,
      publishVersion: expectedPublishVersion,
      latestSyncId,
      lastKnownRemotePublishVersion: expectedPublishVersion,
      exposure: exposure!,
      resources,
      missingResources: []
    })
    return expectedPublishVersion
  }

  // reportSyncResult returns diagnostic failure without throwing across the local commit boundary.
  private async reportSyncResult(input: ReportSyncResultInput): Promise<unknown | null> {
    if (!this.options.client.reportSyncResult) {
      return null
    }
    try {
      normalizeSyncReportAcknowledgement(await this.options.client.reportSyncResult(input))
      return null
    } catch (error) {
      return error
    }
  }

  /** scheduleCatchUpAfterCommit rechecks remote state after an atomic target commit without replacing it mid-run. */
  private async scheduleCatchUpAfterCommit(committedVersion: number): Promise<void> {
    try {
      const latest = requireResponseRecord(
        await this.options.client.getLatestPublishState(committedVersion),
        'post-commit latest state'
      )
      requireSiteId(latest.site_id, this.options.siteId, 'post-commit latest state')
      if (requirePublishVersion(latest.latest_publish_version, 'post-commit latest publish_version') > committedVersion) this.pendingSync = true
    } catch {
      // The committed local publication remains authoritative; pull fallback can retry this observation.
    }
  }
}

// toStoredResource strictly validates one committed public view before adapting it to local storage.
function toStoredResource(
  view: Record<string, unknown>,
  expectedSiteId: string,
  label: string
): StoredPublishedResource {
  const siteId = requireTrimmedString(
    requireAliasedField(view, 'site_id', 'siteId', `${label} site_id`),
    `${label} site_id`
  )
  requireSiteId(siteId, expectedSiteId, label)
  const resourceType = requireResourceType(
    requireAliasedField(view, 'resource_type', 'resourceType', `${label} resource_type`),
    `${label} resource_type`
  )
  const status = requireTrimmedString(
    requireRequiredField(view, 'status', `${label} status`),
    `${label} status`
  )
  if (!['published', 'unpublished', 'deleted', 'disabled'].includes(status)) {
    throw new Error(`Invalid ${label} status: committed status is required`)
  }
  return {
    siteId,
    resourceType,
    resourceId: requireTrimmedString(
      requireAliasedField(view, 'resource_id', 'resourceId', `${label} resource_id`),
      `${label} resource_id`
    ),
    slug: resourceType === 'faq' ? requireFaqDirectorySlug(view, label) : requireTrimmedString(requireRequiredField(view, 'slug', `${label} slug`), `${label} slug`),
    locale: normalizeResourceLocale(
      requireRequiredField(view, 'locale', `${label} locale`),
      `${label} locale`
    ),
    status: status as StoredPublishedResource['status'],
    publishVersion: requirePublishVersion(
      requireAliasedField(view, 'publish_version', 'publishVersion', `${label} publish_version`),
      `${label} publish_version`
    ),
    payloadJson: JSON.stringify(normalizePublicViewPayload(view, label)),
    updatedAt: requireTimestamp(
      requireAliasedField(view, 'updated_at', 'updatedAt', `${label} updated_at`),
      `${label} updated_at`
    )
  }
}

// requireFaqDirectorySlug accepts only the FAQ directory's deliberate no-slug marker.
function requireFaqDirectorySlug(view: Record<string, unknown>, label: string): string {
  const slug = requireRequiredField(view, 'slug', `${label} slug`)
  if (slug !== '') throw new Error(`Invalid ${label} slug: FAQ directory must not define a slug`)
  return slug
}

// requireVersion rejects server responses that do not belong to the sync target selected from latest state.
function requireVersion(actual: number, expected: number, label: string): void {
  if (!Number.isSafeInteger(actual) || actual !== expected) {
    throw new Error(`PUBLISH_VERSION_MISMATCH: ${label} expected ${expected}, received ${actual}`)
  }
}

/** validateResourceVersions rejects any resource that does not belong to the already-fixed sync target. */
function validateResourceVersions(resources: StoredPublishedResource[], expected: number, label: string): void {
  for (const resource of resources) requireVersion(resource.publishVersion, expected, `${label} ${resource.resourceId}`)
}

// requirePublishVersion validates a non-negative integer version before any local diagnostic mutation.
function requirePublishVersion(input: unknown, label: string): number {
  try {
    return requireNonNegativeSafeInteger(input, label)
  } catch {
    throw new Error(`PUBLISH_VERSION_MISMATCH: ${label} is invalid`)
  }
}

// requireSiteId prevents a signed response for another site from entering the local commit boundary.
function requireSiteId(actual: unknown, expected: string, label: string): void {
  if (actual !== expected) {
    throw new Error(`SITE_ID_MISMATCH: ${label} expected ${expected}`)
  }
}

// requireExposurePublication normalizes and verifies the slug-free exposure payload for one target version.
function requireExposurePublication(
  input: unknown,
  expectedSiteId: string,
  expectedPublishVersion: number,
  label: string
): SiteExposurePublication {
  const publication = normalizeSiteExposurePublication(input)
  requireSiteId(publication.siteId, expectedSiteId, `${label} exposure`)
  requireVersion(publication.publishVersion, expectedPublishVersion, `${label} exposure publish_version`)
  return publication
}

// toPublishedResourceIdentity strictly normalizes one missing resource ref without response-only fields.
function toPublishedResourceIdentity(
  value: Record<string, unknown>,
  index: number
): PublishedResourceIdentity {
  const label = `batch missing_resources member ${index}`
  return {
    resourceType: requireResourceType(
      requireAliasedField(value, 'resource_type', 'resourceType', `${label} resource_type`),
      `${label} resource_type`
    ),
    resourceId: requireTrimmedString(
      requireAliasedField(value, 'resource_id', 'resourceId', `${label} resource_id`),
      `${label} resource_id`
    ),
    locale: normalizeResourceLocale(
      requireRequiredField(value, 'locale', `${label} locale`),
      `${label} locale`
    )
  }
}

// validateBatchResourceCoverage requires views and missing refs to partition the requested business identities.
function validateBatchResourceCoverage(
  requested: BusinessChangedResourceRef[],
  views: StoredPublishedResource[],
  missing: PublishedResourceIdentity[]
): void {
  const requestedVersions = new Map(
    requested.map((resource) => {
      const identity = {
        resourceType: resource.resource_type,
        resourceId: resource.resource_id,
        locale: resource.locale
      }
      return [resourceIdentityKey(identity), resource.latest_publish_version] as const
    })
  )
  const responseKeys = new Set<string>()
  for (const resource of views) {
    const key = resourceIdentityKey(resource)
    if (!requestedVersions.has(key) || responseKeys.has(key)) {
      throw new Error('BATCH_RESOURCE_SET_MISMATCH: response is unrequested, duplicated, or overlapping')
    }
    if (resource.publishVersion !== requestedVersions.get(key)) {
      throw new Error('BATCH_RESOURCE_VERSION_MISMATCH: public view does not match changed ref version')
    }
    responseKeys.add(key)
  }
  for (const resource of missing) {
    const key = resourceIdentityKey(resource)
    if (!requestedVersions.has(key) || responseKeys.has(key)) {
      throw new Error('BATCH_RESOURCE_SET_MISMATCH: response is unrequested, duplicated, or overlapping')
    }
    responseKeys.add(key)
  }
  if (responseKeys.size !== requestedVersions.size) {
    throw new Error('BATCH_RESOURCE_SET_MISMATCH: response omitted a requested resource')
  }
}

// resourceIdentityKey builds the stable identity used to compare requested and missing resources.
function resourceIdentityKey(resource: PublishedResourceIdentity): string {
  return `${resource.resourceType}\u0000${resource.resourceId}\u0000${resource.locale}`
}

// requireRecordArray validates a mandatory response array and every object member without filtering.
function requireRecordArray(input: unknown, label: string): Array<Record<string, unknown>> {
  if (!Array.isArray(input)) {
    throw new Error(`Invalid ${label}: required field must be an array`)
  }
  return input.map((member, index) => requireResponseRecord(member, `${label} member ${index}`))
}

// requireRequiredField returns one own response field without defaulting missing values.
function requireRequiredField(
  record: Record<string, unknown>,
  name: string,
  label: string
): unknown {
  if (!Object.prototype.hasOwnProperty.call(record, name)) {
    throw new Error(`Invalid ${label}: required field is missing`)
  }
  return record[name]
}

// requireAliasedField accepts exactly one snake_case or camelCase representation of a response field.
function requireAliasedField(
  record: Record<string, unknown>,
  snakeName: string,
  camelName: string,
  label: string
): unknown {
  const hasSnake = Object.prototype.hasOwnProperty.call(record, snakeName)
  const hasCamel = camelName !== snakeName && Object.prototype.hasOwnProperty.call(record, camelName)
  if ((hasSnake ? 1 : 0) + (hasCamel ? 1 : 0) !== 1) {
    throw new Error(`Invalid ${label}: exactly one field representation is required`)
  }
  return record[hasSnake ? snakeName : camelName]
}

// requireResourceType validates one P1 public business resource type.
function requireResourceType(input: unknown, label: string): ResourceType {
  const resourceType = requireTrimmedString(input, label)
  if (!BUSINESS_RESOURCE_TYPES.has(resourceType as ResourceType)) {
    throw new Error(`Invalid ${label}: unsupported resource type`)
  }
  return resourceType as ResourceType
}

// normalizeResourceLocale validates and canonicalizes one required BCP 47 resource locale.
function normalizeResourceLocale(input: unknown, label: string): string {
  const locale = requireTrimmedString(input, label)
  try {
    return Intl.getCanonicalLocales(locale)[0]!
  } catch {
    throw new Error(`Invalid ${label}: BCP 47 locale is required`)
  }
}

// normalizePageToken validates the optional token value used by the snapshot pagination state machine.
function normalizePageToken(input: unknown, maxLength: number): string | undefined {
  if (input === undefined || input === null || input === '') {
    return undefined
  }
  if (typeof input !== 'string' || input !== input.trim()) {
    throw new Error('SNAPSHOT_PAGINATION_INVALID: next_page_token must be a non-empty string')
  }
  if (input.length > maxLength) {
    throw new Error('SNAPSHOT_LIMIT_EXCEEDED: page token exceeds the configured length budget')
  }
  return input
}

// normalizePublicViewPayload requires exactly one object payload representation for committed views.
function normalizePublicViewPayload(
  view: Record<string, unknown>,
  label: string
): Record<string, unknown> {
  const hasPayload = Object.prototype.hasOwnProperty.call(view, 'payload')
  const hasPayloadJson = Object.prototype.hasOwnProperty.call(view, 'payload_json')
  const hasPayloadJsonCamel = Object.prototype.hasOwnProperty.call(view, 'payloadJson')
  if ((hasPayload ? 1 : 0) + (hasPayloadJson ? 1 : 0) + (hasPayloadJsonCamel ? 1 : 0) !== 1) {
    throw new Error(`Invalid ${label} payload: exactly one object representation is required`)
  }
  if (hasPayload) {
    return requireResponseRecord(view.payload, `${label} payload`)
  }
  const payloadJson = view[hasPayloadJson ? 'payload_json' : 'payloadJson']
  if (typeof payloadJson !== 'string') {
    throw new Error(`Invalid ${label} payload: JSON string is required`)
  }
  try {
    return requireResponseRecord(JSON.parse(payloadJson) as unknown, `${label} payload`)
  } catch {
    throw new Error(`Invalid ${label} payload: JSON object is required`)
  }
}

// normalizeChangedResourceRef strictly validates one delta member before deduplication and batch fetch.
function normalizeChangedResourceRef(
  resource: Record<string, unknown>,
  index: number
): SiteChangedResourceRef {
  const label = `delta changed_resources member ${index}`
  const resourceType = requireTrimmedString(
    requireAliasedField(resource, 'resource_type', 'resourceType', `${label} resource_type`),
    `${label} resource_type`
  )
  if (resourceType !== 'site-exposure' && !BUSINESS_RESOURCE_TYPES.has(resourceType as ResourceType)) {
    throw new Error(`Invalid ${label}: unsupported resource type`)
  }
  const resourceId = requireTrimmedString(
    requireAliasedField(resource, 'resource_id', 'resourceId', `${label} resource_id`),
    `${label} resource_id`
  )
  const localeInput = requireRequiredField(resource, 'locale', `${label} locale`)
  const locale =
    resourceType === 'site-exposure'
      ? localeInput
      : normalizeResourceLocale(localeInput, `${label} locale`)
  if (typeof locale !== 'string' || (resourceType === 'site-exposure' && locale !== '')) {
    throw new Error(`Invalid ${label}: site-exposure locale must be empty`)
  }
  return {
    resource_type: resourceType,
    resource_id: resourceId,
    locale,
    latest_publish_version: requirePublishVersion(
      requireAliasedField(
        resource,
        'latest_publish_version',
        'latestPublishVersion',
        `${label} latest_publish_version`
      ),
      `${label} latest_publish_version`
    )
  }
}

const DEFAULT_SYNC_LIMITS: SyncEngineLimits = {
  maxSnapshotPages: 100,
  maxSnapshotResources: 50_000,
  maxDeltaResources: 50_000,
  deltaBatchSize: 200,
  maxPageTokenLength: 2_048,
  maxResourcePayloadBytes: 1024 * 1024,
  maxPublicationPayloadBytes: 64 * 1024 * 1024
}

// normalizeSyncLimits applies safe defaults and rejects disabled or non-integer resource budgets.
function normalizeSyncLimits(input: Partial<SyncEngineLimits> | undefined): SyncEngineLimits {
  const limits = { ...DEFAULT_SYNC_LIMITS, ...input }
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new Error(`Invalid SyncEngine limit: ${name}`)
    }
  }
  return limits
}

// chunkChangedResources partitions one delta request while preserving an exposure-only empty batch.
function chunkChangedResources(
  resources: BusinessChangedResourceRef[],
  batchSize: number
): BusinessChangedResourceRef[][] {
  if (resources.length === 0) {
    return [[]]
  }
  const batches: BusinessChangedResourceRef[][] = []
  for (let index = 0; index < resources.length; index += batchSize) {
    batches.push(resources.slice(index, index + batchSize))
  }
  return batches
}

// consumePayloadBudget enforces per-payload and aggregate stored-envelope bytes before publication commit.
function consumePayloadBudget(
  resources: StoredPublishedResource[],
  currentTotalBytes: number,
  limits: SyncEngineLimits
): number {
  let totalBytes = currentTotalBytes
  for (const resource of resources) {
    const payloadBytes = Buffer.byteLength(resource.payloadJson, 'utf8')
    if (payloadBytes > limits.maxResourcePayloadBytes) {
      throw new Error('PUBLICATION_LIMIT_EXCEEDED: resource payload exceeds the configured budget')
    }
    totalBytes += Buffer.byteLength(JSON.stringify(resource), 'utf8')
    if (totalBytes > limits.maxPublicationPayloadBytes) {
      throw new Error('PUBLICATION_LIMIT_EXCEEDED: aggregate resource envelopes exceed the configured budget')
    }
  }
  return totalBytes
}

// dedupeChangedResources keeps only one final view fetch per resource identity.
function dedupeChangedResources(resources: SiteChangedResourceRef[]): SiteChangedResourceRef[] {
  return Array.from(
    new Map(
      resources.map((resource) => [
        `${resource.resource_type}:${resource.resource_id}:${resource.locale}`,
        resource
      ])
    ).values()
  )
}

const BUSINESS_RESOURCE_TYPES = new Set<ResourceType>([
  'product',
  'category',
  'content',
  'blog',
  'news',
  'article',
  'article-category',
  'faq'
])

// businessChangedResources removes the exposure marker and validates every batch-fetchable identity.
function businessChangedResources(
  resources: SiteChangedResourceRef[],
  siteId: string,
  fromPublishVersion: number,
  toPublishVersion: number
): BusinessChangedResourceRef[] {
  const businessResources: BusinessChangedResourceRef[] = []
  for (const resource of resources) {
    const latestPublishVersion = requirePublishVersion(
      resource.latest_publish_version,
      'changed resource latest_publish_version'
    )
    if (resource.resource_type === 'site-exposure') {
      if (
        resource.resource_id !== siteId ||
        resource.locale !== '' ||
        latestPublishVersion !== toPublishVersion
      ) {
        throw new Error('SITE_EXPOSURE_MARKER_INVALID: marker identity does not match the signed site')
      }
      continue
    }
    if (
      !BUSINESS_RESOURCE_TYPES.has(resource.resource_type as ResourceType) ||
      resource.resource_id.trim().length === 0 ||
      resource.locale.trim().length === 0 ||
      latestPublishVersion <= fromPublishVersion ||
      latestPublishVersion > toPublishVersion
    ) {
      throw new Error('CHANGED_RESOURCE_INVALID: unsupported or incomplete resource identity')
    }
    businessResources.push({
      resource_type: resource.resource_type as ResourceType,
      resource_id: resource.resource_id,
      locale: resource.locale,
      latest_publish_version: latestPublishVersion
    })
  }
  return businessResources
}

// sanitizeErrorMessage keeps runtime status useful without exposing secrets or stack traces.
function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 300)
  }
  return String(error).slice(0, 300)
}
