import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import {
  BatchGetPublicViewsRequest,
  BatchGetPublicViewsResponse,
  GetLatestPublishStateRequest,
  GetLatestPublishStateResponse,
  GetPreviewViewRequest,
  GetPreviewViewResponse,
  GetSnapshotRequest,
  GetSnapshotResponse,
  ListChangedResourcesRequest,
  ListChangedResourcesResponse,
  ReportSyncResultRequest,
  ReportSyncResultResponse,
  RegisterPageCapabilitiesRequest,
  RegisterPageCapabilitiesResponse,
  SignedSiteContext
} from '@oes/common/generated/site_service'
import { ExceptionFactory, VALIDATION_FAILED } from '@oes/common/exceptions'
import { NonceReplayStore } from '../../domain/security/nonce-replay-store'
import {
  SiteCredentialVerificationRecord,
  verifySignedSiteRequest
} from '../../domain/security/site-request-signing'
import { validatePreviewToken } from '../../domain/preview/preview-token'
import { requireSitePreviewTokenSecret } from '../../domain/preview/preview-config'
import {
  PREVIEW_DRAFT_NOT_FOUND,
  PREVIEW_TOKEN_ERROR_DEFINITIONS,
  SIGNED_SITE_REQUEST_ERROR_DEFINITIONS
} from '../../domain/preview/preview-errors'
import {
  buildBlogPublicView,
  buildNewsPublicView,
  buildProductPublicView
} from '../../domain/public-view/public-view-builders'
import { canonicalManifestHash } from '../../domain/site-page/site-page-governance'
import { SYNC_TARGET_ERROR_DEFINITIONS } from '../../domain/sync/sync-target-errors'
import {
  SITE_CAPABILITY_REGISTRATION_LIMITS,
  SiteCapabilityRegistrationError,
  validateCapabilityRegistrationText,
  validateSiteCapabilityManifest
} from '../../domain/site-page/site-capability-registration'

export interface SiteRuntimeApplicationRepository {
  findCredentialForVerification(
    siteId: string,
    clientId: string,
    credentialId: string
  ): Promise<SiteCredentialVerificationRecord | null>
  findTenantIdForSite(siteId: string): Promise<string | null>
  rememberCredentialNonce(input: {
    siteId: string
    credentialId: string
    nonce: string
    now: Date
    ttlMilliseconds: number
  }): Promise<boolean>
  getLatestPublishState(
    siteId: string
  ): Promise<{ latestPublishVersion: number; latestSyncId?: string | null }>
  getCommittedSyncTarget(input: { siteId: string; targetPublishVersion: number }): Promise<{ latestPublishVersion: number; committed: boolean }>
  registerPageCapabilities(input: {
    siteId: string
    clientId: string
    idempotencyKey: string
    expectedRegistrationGeneration: bigint
    manifestHash: string
    capabilities: Array<{ pageKey: string; supportedLocales: string[] }>
    discoveredAt: Date
  }): Promise<RegisterPageCapabilitiesResponse>
  saveAuditEnvelope(input: {
    eventId: string
    service: string
    module: string
    eventType: string
    occurredAt: Date
    result: string
    operatorId: string | null
    operatorType: string
    tenantId: string | null
    orgId: string | null
    traceId: string | null
    resourceType: string
    resourceId: string | null
    details: Record<string, unknown>
  }): Promise<void>
  updateRuntimeSyncResult(input: {
    siteId: string
    syncId?: string
    localPublishVersion: number
    status: string
    startedAt?: string
    completedAt?: string
    errorCode?: string
    errorMessage?: string
    reportedAt: Date
  }): Promise<void>
  listChangedResourcesForRuntime(input: {
    siteId: string
    fromPublishVersion: number
    toPublishVersion?: number
    resourceTypes?: string[]
  }): Promise<
    Array<{
      resourceType: string
      resourceId: string
      locale: string
      changeType: string
      latestPublishVersion: number
    }>
  >
  batchGetPublicViewsForRuntime(input: {
    siteId: string
    targetPublishVersion: number
    resources: Array<{ resourceType?: string; resourceId?: string; locale?: string }>
  }): Promise<{
    publicViews: Array<{
      siteId: string
      resourceType: string
      resourceId: string
      locale: string
      slug: string
      status: string
      publishVersion: number
      updatedAt: Date | string
      payload: Record<string, unknown>
    }>
    missingResources: Array<{ resourceType?: string; resourceId?: string; locale?: string }>
    serverPublishVersion: number
    exposurePublication?: {
      siteId: string
      publishVersion: number
      defaultLocale: string
      activeLocales: string[]
      pages: Array<{
        pageKey: string
        enabled: boolean
        indexable: boolean
        supportedLocales: string[]
      }>
      publishedAt: string
    }
  }>
  getSnapshotForRuntime?(input: {
    siteId: string
    targetPublishVersion: number
    resourceTypes?: string[]
    locales?: string[]
    pageToken?: string
    pageSize?: number
  }): Promise<{
    snapshotPublishVersion: number
    publicViews: Array<{
      siteId: string
      resourceType: string
      resourceId: string
      locale: string
      slug: string
      status: string
      publishVersion: number
      updatedAt: Date | string
      payload: Record<string, unknown>
    }>
    nextPageToken?: string
    isComplete: boolean
    exposurePublication?: {
      siteId: string
      publishVersion: number
      defaultLocale: string
      activeLocales: string[]
      pages: Array<{
        pageKey: string
        enabled: boolean
        indexable: boolean
        supportedLocales: string[]
      }>
      publishedAt: string
    }
  }>
  getContentVersionForPublicView?(input: {
    siteId: string
    contentId: string
    locale: string
  }): Promise<{
    contentId: string
    contentType: string
    locale: string
    slug: string
    title: string
    bodyHtml: string
    summary?: string | null
    coverImage?: string | null
    coverImageAlt?: string | null
    author?: string | null
    tags?: string[]
    seoTitle: string
    seoDescription: string
    seoImage?: string | null
    publishedAt?: Date | null
  } | null>
  getPreviewContentVersionForPublicView(input: {
    siteId: string
    resourceType: 'blog' | 'news'
    contentId: string
    locale: string
  }): Promise<{
    contentId: string
    contentType: string
    locale: string
    slug: string
    title: string
    bodyHtml: string
    summary?: string | null
    coverImage?: string | null
    coverImageAlt?: string | null
    author?: string | null
    tags?: string[]
    seoTitle: string
    seoDescription: string
    seoImage?: string | null
    publishedAt?: Date | null
  } | null>
  getProductPublicationForPublicView?(input: {
    siteId: string
    productId: string
    locale: string
  }): Promise<{
    productId: string
    locale: string
    slug: string
    displayTitle: string
    displayDescription: string
    seoTitle: string
    seoDescription: string
    seoImage?: string | null
    imageOverride?: string | null
    publishStatus: string
  } | null>
}

export const SITE_RUNTIME_APPLICATION_REPOSITORY = Symbol('SITE_RUNTIME_APPLICATION_REPOSITORY')

export interface SiteRuntimeApplicationOptions {
  previewTokenSecret: string
  now?: () => Date
}

/** SiteRuntimeApplicationService verifies signed Site Runtime requests before serving sync/read APIs. */
@Injectable()
export class SiteRuntimeApplicationService {
  constructor(
    @Inject(SITE_RUNTIME_APPLICATION_REPOSITORY)
    private readonly repository: SiteRuntimeApplicationRepository,
    private readonly options: SiteRuntimeApplicationOptions
  ) {}

  /** getLatestPublishState verifies site:sync scope and returns the latest remote publish version. */
  async getLatestPublishState(
    request: GetLatestPublishStateRequest
  ): Promise<GetLatestPublishStateResponse> {
    const verified = await this.verify(request.signedContext, 'site:sync')
    const state = await this.repository.getLatestPublishState(verified.siteId)

    return {
      siteId: verified.siteId,
      latestPublishVersion: state.latestPublishVersion,
      latestSyncId: state.latestSyncId ?? '',
      hasUpdates: (request.localPublishVersion ?? 0) < state.latestPublishVersion,
      serverTime: this.now().toISOString()
    }
  }

  /** registerPageCapabilities verifies site:capabilities and records one complete idempotent manifest. */
  async registerPageCapabilities(
    request: RegisterPageCapabilitiesRequest
  ): Promise<RegisterPageCapabilitiesResponse> {
    const verified = await this.verify(request.signedContext, 'site:capabilities')
    const idempotencyKey = validateCapabilityRegistrationText(
      request.idempotencyKey,
      'idempotencyKey',
      SITE_CAPABILITY_REGISTRATION_LIMITS.idempotencyKeyLength
    )
    validateCapabilityRegistrationText(
      request.runtimeVersion,
      'runtimeVersion',
      SITE_CAPABILITY_REGISTRATION_LIMITS.runtimeVersionLength
    )
    const expectedRegistrationGeneration = registrationGeneration(
      request.expectedRegistrationGeneration
    )
    const declaredCapabilities = validateSiteCapabilityManifest(request.capabilities)
    const canonical = canonicalManifestHash(declaredCapabilities)
    const capabilities = (
      JSON.parse(canonical.canonicalJson) as Array<{
        page_key: string
        supported_locales: string[]
      }>
    ).map((capability) => ({
      pageKey: capability.page_key,
      supportedLocales: capability.supported_locales
    }))
    const manifestHash = canonical.hash
    const tenantId = await this.repository.findTenantIdForSite(verified.siteId)
    const result = await this.repository.registerPageCapabilities({
      siteId: verified.siteId,
      clientId: verified.clientId,
      idempotencyKey,
      expectedRegistrationGeneration,
      manifestHash,
      capabilities,
      discoveredAt: this.now()
    })
    const accepted = result.accepted === true
    await this.saveCapabilityAudit({
      siteId: verified.siteId,
      clientId: verified.clientId,
      tenantId,
      traceId: request.signedContext?.traceId,
      eventType: accepted
        ? 'site_page_capability.registered'
        : 'site_page_capability.registration_stale_rejected',
      result: accepted ? 'SUCCEEDED' : 'REJECTED',
      resourceType: 'site_page_capability_manifest',
      resourceId: verified.siteId,
      details: {
        manifestHash,
        idempotencyKey,
        expectedRegistrationGeneration: expectedRegistrationGeneration.toString(),
        registrationGeneration: result.registrationGeneration ?? '0',
        idempotentReplay: result.idempotentReplay ?? false,
        discoveredCount: result.discoveredCount ?? 0
      }
    })
    for (const pageKey of accepted ? (result.driftPageKeys ?? []) : []) {
      await this.saveCapabilityAudit({
        siteId: verified.siteId,
        clientId: verified.clientId,
        tenantId,
        traceId: request.signedContext?.traceId,
        eventType: 'site_page_capability.drift_detected',
        resourceType: 'site_page',
        resourceId: `${verified.siteId}:${pageKey}`,
        details: { pageKey }
      })
    }
    for (const pageKey of accepted ? (result.recoveredPageKeys ?? []) : []) {
      await this.saveCapabilityAudit({
        siteId: verified.siteId,
        clientId: verified.clientId,
        tenantId,
        traceId: request.signedContext?.traceId,
        eventType: 'site_page_capability.drift_recovered',
        resourceType: 'site_page',
        resourceId: `${verified.siteId}:${pageKey}`,
        details: { pageKey }
      })
    }
    return result
  }

  /** listChangedResources verifies site:sync scope and returns aggregated changed resources. */
  async listChangedResources(
    request: ListChangedResourcesRequest
  ): Promise<ListChangedResourcesResponse> {
    const verified = await this.verify(request.signedContext, 'site:sync')
    const [changedResources, publishState] = await Promise.all([
      this.repository.listChangedResourcesForRuntime({
        siteId: verified.siteId,
        fromPublishVersion: request.fromPublishVersion ?? 0,
        toPublishVersion: request.toPublishVersion,
        resourceTypes: request.resourceTypes
      }),
      this.repository.getLatestPublishState(verified.siteId)
    ])
    const requestedTarget =
      request.toPublishVersion && request.toPublishVersion > 0
        ? request.toPublishVersion
        : publishState.latestPublishVersion
    const toPublishVersion = Math.min(requestedTarget, publishState.latestPublishVersion)

    return {
      siteId: verified.siteId,
      fromPublishVersion: request.fromPublishVersion ?? 0,
      toPublishVersion,
      requiresSnapshot: false,
      changedResources
    }
  }

  /** batchGetPublicViews verifies site:read scope and returns public view envelopes only for the signed site. */
  async batchGetPublicViews(
    request: BatchGetPublicViewsRequest
  ): Promise<BatchGetPublicViewsResponse> {
    const verified = await this.verify(request.signedContext, 'site:read')
    const targetPublishVersion = await this.requireCommittedTarget(verified.siteId, request.targetPublishVersion)
    const result = await this.repository.batchGetPublicViewsForRuntime({
      siteId: verified.siteId,
      targetPublishVersion,
      resources: request.resources ?? []
    })

    if (result.serverPublishVersion !== targetPublishVersion || result.publicViews.some((view) => view.publishVersion > targetPublishVersion)) throw ExceptionFactory.application(SYNC_TARGET_ERROR_DEFINITIONS.SYNC_TARGET_MISMATCH)

    return {
      serverPublishVersion: result.serverPublishVersion,
      missingResources: result.missingResources,
      publicViews: result.publicViews.map((view) => ({
        siteId: view.siteId,
        resourceType: view.resourceType,
        resourceId: view.resourceId,
        locale: view.locale,
        slug: view.slug,
        status: view.status,
        publishVersion: view.publishVersion,
        updatedAt:
          typeof view.updatedAt === 'string' ? view.updatedAt : view.updatedAt.toISOString(),
        payloadJson: JSON.stringify(view.payload)
      })),
      ...(result.exposurePublication
        ? { exposurePublication: toExposurePublication(result.exposurePublication) }
        : {})
    }
  }

  /** getSnapshot is the runtime snapshot API boundary and is expanded by snapshot consistency work. */
  async getSnapshot(request: GetSnapshotRequest): Promise<GetSnapshotResponse> {
    const verified = await this.verify(request.signedContext, 'site:sync')
    const targetPublishVersion = await this.requireCommittedTarget(verified.siteId, request.targetPublishVersion)
    const snapshot = await this.repository.getSnapshotForRuntime?.({
      siteId: verified.siteId,
      targetPublishVersion,
      resourceTypes: request.resourceTypes,
      locales: request.locales,
      pageToken: request.pageToken,
      pageSize: request.pageSize
    })
    if (!snapshot) throw ExceptionFactory.application(SYNC_TARGET_ERROR_DEFINITIONS.SYNC_TARGET_UNAVAILABLE)
    if (snapshot.snapshotPublishVersion !== targetPublishVersion || snapshot.publicViews.some((view) => view.publishVersion > targetPublishVersion)) throw ExceptionFactory.application(SYNC_TARGET_ERROR_DEFINITIONS.SYNC_TARGET_MISMATCH)
    return {
      siteId: verified.siteId,
      snapshotPublishVersion: snapshot.snapshotPublishVersion,
      publicViews: snapshot.publicViews.map(toPublicViewEnvelope),
      nextPageToken: snapshot.nextPageToken ?? '',
      isComplete: snapshot.isComplete,
      ...(snapshot.exposurePublication
        ? { exposurePublication: toExposurePublication(snapshot.exposurePublication) }
        : {})
    }
  }

  /** requireCommittedTarget rejects latest fallback and ensures every runtime read addresses an exact committed version. */
  private async requireCommittedTarget(siteId: string, targetPublishVersion: number | undefined): Promise<number> {
    if (!targetPublishVersion || !Number.isInteger(targetPublishVersion) || targetPublishVersion < 1) throw ExceptionFactory.application(SYNC_TARGET_ERROR_DEFINITIONS.SYNC_TARGET_REQUIRED)
    const target = await this.repository.getCommittedSyncTarget({ siteId, targetPublishVersion })
    if (targetPublishVersion > target.latestPublishVersion) throw ExceptionFactory.application(SYNC_TARGET_ERROR_DEFINITIONS.SYNC_TARGET_NOT_COMMITTED)
    if (!target.committed) throw ExceptionFactory.application(SYNC_TARGET_ERROR_DEFINITIONS.SYNC_TARGET_UNAVAILABLE)
    return targetPublishVersion
  }

  /** reportSyncResult verifies site:status scope and stores runtime status feedback. */
  async reportSyncResult(request: ReportSyncResultRequest): Promise<ReportSyncResultResponse> {
    const verified = await this.verify(request.signedContext, 'site:status')
    await this.repository.updateRuntimeSyncResult({
      siteId: verified.siteId,
      syncId: request.syncId,
      localPublishVersion: request.localPublishVersion ?? 0,
      status: request.status ?? 'failed',
      startedAt: request.startedAt,
      completedAt: request.completedAt,
      errorCode: request.errorCode,
      errorMessage: request.errorMessage,
      reportedAt: this.now()
    })

    return { accepted: true, serverTime: this.now().toISOString() }
  }

  /** getPreviewView is the signed preview API boundary and is expanded by the preview storage slice. */
  async getPreviewView(request: GetPreviewViewRequest): Promise<GetPreviewViewResponse> {
    const verified = await this.verify(request.signedContext, 'site:preview', true)
    const resourceType = requirePreviewResourceType(request.resourceType)
    const resourceId = requiredPreviewInput(request.resourceId)
    const locale = requiredPreviewInput(request.locale)
    const token = validatePreviewToken(requiredPreviewInput(request.previewToken), {
      secret: requireSitePreviewTokenSecret(this.options.previewTokenSecret),
      now: this.now(),
      expectedSiteId: verified.siteId,
      expectedResourceType: resourceType,
      expectedResourceId: resourceId,
      expectedLocale: locale
    })
    if (token.ok === false) {
      throw ExceptionFactory.application(PREVIEW_TOKEN_ERROR_DEFINITIONS[token.errorCode])
    }
    const previewView = await this.buildPreviewView({
      siteId: verified.siteId,
      resourceType,
      resourceId,
      locale
    })

    return {
      previewView,
      expiresAt: token.expiresAt.toISOString(),
      noindex: true,
      cachePolicy: 'no-store'
    }
  }

  /** verify enforces the frozen signed Site Runtime request contract at the service boundary. */
  private async verify(
    signedContext: SignedSiteContext | undefined,
    requiredScope: string,
    requireActiveSite = false
  ) {
    const credential =
      signedContext?.siteId && signedContext.clientId && signedContext.credentialId
        ? await this.repository.findCredentialForVerification(
            signedContext.siteId,
            signedContext.clientId,
            signedContext.credentialId
          )
        : null
    const result = await verifySignedSiteRequest(
      {
        method: signedContext?.method ?? '',
        path: signedContext?.path ?? '',
        normalizedQuery: signedContext?.normalizedQuery ?? '',
        bodySha256: signedContext?.bodySha256 ?? '',
        headers: {
          'x-oes-site-id': signedContext?.siteId,
          'x-oes-client-id': signedContext?.clientId,
          'x-oes-credential-id': signedContext?.credentialId,
          'x-oes-timestamp': signedContext?.timestamp,
          'x-oes-nonce': signedContext?.nonce,
          'x-oes-signature': signedContext?.signature,
          'x-oes-request-id': signedContext?.requestId,
          'x-oes-trace-id': signedContext?.traceId
        }
      },
      {
        now: this.now(),
        requiredScope,
        nonceStore: {
          remember: (input) => this.repository.rememberCredentialNonce(input)
        } satisfies NonceReplayStore,
        credential:
          requireActiveSite && credential ? { ...credential, siteStatus: 'active' } : credential
      }
    )

    if (result.ok === false) {
      throw ExceptionFactory.application(SIGNED_SITE_REQUEST_ERROR_DEFINITIONS[result.errorCode])
    }
    if (requireActiveSite && credential?.siteStatus !== 'active') {
      throw ExceptionFactory.application(SIGNED_SITE_REQUEST_ERROR_DEFINITIONS.SITE_DISABLED)
    }

    return result
  }

  /** now returns the injectable clock for deterministic tests and runtime responses. */
  private now(): Date {
    return this.options.now?.() ?? new Date()
  }

  /** saveCapabilityAudit records Runtime registration, drift, and recovery with signed caller context. */
  private saveCapabilityAudit(input: {
    siteId: string
    clientId: string
    tenantId: string | null
    traceId?: string
    eventType: string
    result?: string
    resourceType: string
    resourceId: string
    details: Record<string, unknown>
  }) {
    return this.repository.saveAuditEnvelope({
      eventId: `audit_${randomUUID()}`,
      service: 'site-service',
      module: 'site-runtime-capabilities',
      eventType: input.eventType,
      occurredAt: this.now(),
      result: input.result ?? 'SUCCEEDED',
      operatorId: input.clientId,
      operatorType: 'SITE_RUNTIME',
      tenantId: input.tenantId,
      orgId: null,
      traceId: input.traceId ?? null,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      details: { siteId: input.siteId, ...input.details }
    })
  }

  /** buildPreviewView creates a draft-only public view envelope without touching publish state. */
  private async buildPreviewView(input: {
    siteId: string
    resourceType: 'product' | 'blog' | 'news'
    resourceId: string
    locale: string
  }) {
    const updatedAt = this.now()
    if (input.resourceType === 'product') {
      const publication = await this.repository.getProductPublicationForPublicView?.({
        siteId: input.siteId,
        productId: input.resourceId,
        locale: input.locale
      })
      if (!publication) {
        throw ExceptionFactory.application(PREVIEW_DRAFT_NOT_FOUND)
      }
      return toPublicViewEnvelope({
        ...buildProductPublicView({
          siteId: input.siteId,
          publishVersion: 0,
          updatedAt,
          ...publication,
          facts: {
            productId: publication.productId,
            summary: publication.displayDescription,
            images: publication.imageOverride
              ? [{ url: publication.imageOverride, alt: publication.displayTitle, role: 'primary' }]
              : []
          }
        }),
        status: 'draft_preview'
      })
    }
    const content = await this.repository.getPreviewContentVersionForPublicView({
      siteId: input.siteId,
      resourceType: input.resourceType,
      contentId: input.resourceId,
      locale: input.locale
    })
    if (!content || content.contentType !== input.resourceType) {
      throw ExceptionFactory.application(PREVIEW_DRAFT_NOT_FOUND)
    }
    const view =
      input.resourceType === 'blog'
        ? buildBlogPublicView({ siteId: input.siteId, publishVersion: 0, updatedAt, ...content })
        : buildNewsPublicView({ siteId: input.siteId, publishVersion: 0, updatedAt, ...content })
    return toPublicViewEnvelope({ ...view, status: 'draft_preview' })
  }
}

/** toPublicViewEnvelope converts domain/runtime read models into generated gRPC envelope shape. */
function toPublicViewEnvelope(view: {
  site_id?: string
  siteId?: string
  resource_type?: string
  resourceType?: string
  resource_id?: string
  resourceId?: string
  locale: string
  slug: string
  status: string
  publish_version?: number
  publishVersion?: number
  updated_at?: string
  updatedAt?: Date | string
  payload: Record<string, unknown>
}) {
  const updatedAt =
    view.updated_at ??
    (view.updatedAt instanceof Date ? view.updatedAt.toISOString() : (view.updatedAt ?? ''))
  return {
    siteId: view.site_id ?? view.siteId ?? '',
    resourceType: view.resource_type ?? view.resourceType ?? '',
    resourceId: view.resource_id ?? view.resourceId ?? '',
    locale: view.locale,
    slug: view.slug,
    status: view.status,
    publishVersion: view.publish_version ?? view.publishVersion ?? 0,
    updatedAt,
    payloadJson: JSON.stringify(view.payload)
  }
}

/** toExposurePublication maps slug-free repository governance state into the generated sync payload. */
function toExposurePublication(publication: {
  siteId: string
  publishVersion: number
  defaultLocale: string
  activeLocales: string[]
  pages: Array<{
    pageKey: string
    enabled: boolean
    indexable: boolean
    supportedLocales: string[]
  }>
  publishedAt: string
}) {
  return {
    siteId: publication.siteId,
    publishVersion: publication.publishVersion,
    defaultLocale: publication.defaultLocale,
    activeLocales: publication.activeLocales,
    pages: publication.pages,
    publishedAt: publication.publishedAt
  }
}

/** required enforces runtime request inputs after signature verification. */
function required(value: string | undefined, field: string): string {
  if (!value?.trim()) {
    throw new Error(`${field} is required`)
  }
  return value.trim()
}

/** registrationGeneration parses the generated uint64 decimal string without losing precision. */
function registrationGeneration(value: string | undefined): bigint {
  const normalized = value ?? '0'
  if (!/^(0|[1-9][0-9]*)$/.test(normalized)) {
    throw new SiteCapabilityRegistrationError(
      'SITE_CAPABILITY_REGISTRATION_VALIDATION_FAILED',
      'expectedRegistrationGeneration must be an unsigned 64-bit integer',
      { field: 'expectedRegistrationGeneration' }
    )
  }
  const generation = BigInt(normalized)
  if (generation > 18_446_744_073_709_551_615n) {
    throw new SiteCapabilityRegistrationError(
      'SITE_CAPABILITY_REGISTRATION_VALIDATION_FAILED',
      'expectedRegistrationGeneration must be an unsigned 64-bit integer',
      { field: 'expectedRegistrationGeneration' }
    )
  }
  return generation
}

/** requirePreviewResourceType restricts preview access to P1 resource types. */
function requirePreviewResourceType(value: string | undefined): 'product' | 'blog' | 'news' {
  const resourceType = requiredPreviewInput(value)
  if (resourceType !== 'product' && resourceType !== 'blog' && resourceType !== 'news') {
    throw ExceptionFactory.application(VALIDATION_FAILED)
  }
  return resourceType
}

/** requiredPreviewInput rejects malformed preview fields without exposing field values or internals. */
function requiredPreviewInput(value: string | undefined): string {
  if (!value?.trim()) {
    throw ExceptionFactory.application(VALIDATION_FAILED)
  }
  return value.trim()
}
