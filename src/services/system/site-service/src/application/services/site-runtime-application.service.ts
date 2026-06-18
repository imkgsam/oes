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
  SignedSiteContext
} from '@oes/common/generated/site_service'
import { NonceReplayStore } from '../../domain/security/nonce-replay-store'
import {
  SiteCredentialVerificationRecord,
  verifySignedSiteRequest
} from '../../domain/security/site-request-signing'
import { validatePreviewToken } from '../../domain/preview/preview-token'
import { buildBlogPublicView, buildNewsPublicView, buildProductPublicView } from '../../domain/public-view/public-view-builders'

export interface SiteRuntimeApplicationRepository {
  findCredentialForVerification(siteId: string, clientId: string, credentialId: string): Promise<SiteCredentialVerificationRecord | null>
  rememberCredentialNonce(input: {
    siteId: string
    credentialId: string
    nonce: string
    now: Date
    ttlMilliseconds: number
  }): Promise<boolean>
  getLatestPublishState(siteId: string): Promise<{ latestPublishVersion: number; latestSyncId?: string | null }>
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
  }): Promise<Array<{
    resourceType: string
    resourceId: string
    locale: string
    changeType: string
    latestPublishVersion: number
  }>>
  batchGetPublicViewsForRuntime(input: {
    siteId: string
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
  }>
  getSnapshotForRuntime?(input: {
    siteId: string
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
  }>
  getContentVersionForPublicView?(input: { contentId: string; locale: string }): Promise<{
    contentId: string
    contentType: string
    locale: string
    slug: string
    title: string
    bodyHtml: string
    summary?: string | null
    coverImage?: string | null
    author?: string | null
    tags?: string[]
    seoTitle: string
    seoDescription: string
    seoImage?: string | null
    publishedAt?: Date | null
  } | null>
  getProductPublicationForPublicView?(input: { siteId: string; productId: string; locale: string }): Promise<{
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
  now?: () => Date
}

/** SiteRuntimeApplicationService verifies signed Site Runtime requests before serving sync/read APIs. */
@Injectable()
export class SiteRuntimeApplicationService {
  constructor(
    @Inject(SITE_RUNTIME_APPLICATION_REPOSITORY)
    private readonly repository: SiteRuntimeApplicationRepository,
    private readonly options: SiteRuntimeApplicationOptions = {}
  ) {}

  /** getLatestPublishState verifies site:sync scope and returns the latest remote publish version. */
  async getLatestPublishState(request: GetLatestPublishStateRequest): Promise<GetLatestPublishStateResponse> {
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

  /** listChangedResources verifies site:sync scope and returns aggregated changed resources. */
  async listChangedResources(request: ListChangedResourcesRequest): Promise<ListChangedResourcesResponse> {
    const verified = await this.verify(request.signedContext, 'site:sync')
    const changedResources = await this.repository.listChangedResourcesForRuntime({
      siteId: verified.siteId,
      fromPublishVersion: request.fromPublishVersion ?? 0,
      toPublishVersion: request.toPublishVersion,
      resourceTypes: request.resourceTypes
    })
    const toPublishVersion = changedResources.reduce(
      (latest, resource) => Math.max(latest, resource.latestPublishVersion),
      request.fromPublishVersion ?? 0
    )

    return {
      siteId: verified.siteId,
      fromPublishVersion: request.fromPublishVersion ?? 0,
      toPublishVersion,
      requiresSnapshot: false,
      changedResources
    }
  }

  /** batchGetPublicViews verifies site:read scope and returns public view envelopes only for the signed site. */
  async batchGetPublicViews(request: BatchGetPublicViewsRequest): Promise<BatchGetPublicViewsResponse> {
    const verified = await this.verify(request.signedContext, 'site:read')
    const result = await this.repository.batchGetPublicViewsForRuntime({
      siteId: verified.siteId,
      resources: request.resources ?? []
    })

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
        updatedAt: typeof view.updatedAt === 'string' ? view.updatedAt : view.updatedAt.toISOString(),
        payloadJson: JSON.stringify(view.payload)
      }))
    }
  }

  /** getSnapshot is the runtime snapshot API boundary and is expanded by snapshot consistency work. */
  async getSnapshot(request: GetSnapshotRequest): Promise<GetSnapshotResponse> {
    const verified = await this.verify(request.signedContext, 'site:sync')
    const snapshot = await this.repository.getSnapshotForRuntime?.({
      siteId: verified.siteId,
      resourceTypes: request.resourceTypes,
      locales: request.locales,
      pageToken: request.pageToken,
      pageSize: request.pageSize
    })
    if (!snapshot) {
      return { siteId: verified.siteId, publicViews: [], snapshotPublishVersion: 0, isComplete: true }
    }
    return {
      siteId: verified.siteId,
      snapshotPublishVersion: snapshot.snapshotPublishVersion,
      publicViews: snapshot.publicViews.map(toPublicViewEnvelope),
      nextPageToken: snapshot.nextPageToken ?? '',
      isComplete: snapshot.isComplete
    }
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
    const verified = await this.verify(request.signedContext, 'site:preview')
    const resourceType = requirePreviewResourceType(request.resourceType)
    const resourceId = required(request.resourceId, 'resourceId')
    const locale = required(request.locale, 'locale')
    const token = validatePreviewToken(required(request.previewToken, 'previewToken'), {
      secret: process.env.SITE_PREVIEW_TOKEN_SECRET ?? 'site-service-local-preview-secret',
      now: this.now(),
      expectedSiteId: verified.siteId,
      expectedResourceType: resourceType,
      expectedResourceId: resourceId,
      expectedLocale: locale
    })
    if (token.ok === false) {
      throw new Error(token.errorCode)
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
  private async verify(signedContext: SignedSiteContext | undefined, requiredScope: string) {
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
        credential
      }
    )

    if (result.ok === false) {
      throw new Error(result.errorCode)
    }

    return result
  }

  /** now returns the injectable clock for deterministic tests and runtime responses. */
  private now(): Date {
    return this.options.now?.() ?? new Date()
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
        throw new Error('PREVIEW_RESOURCE_NOT_FOUND')
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
            images: publication.imageOverride ? [{ url: publication.imageOverride, alt: publication.displayTitle, role: 'primary' }] : []
          }
        }),
        status: 'draft_preview'
      })
    }
    const content = await this.repository.getContentVersionForPublicView?.({
      contentId: input.resourceId,
      locale: input.locale
    })
    if (!content) {
      throw new Error('PREVIEW_RESOURCE_NOT_FOUND')
    }
    const view = input.resourceType === 'blog'
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
  const updatedAt = view.updated_at ?? (view.updatedAt instanceof Date ? view.updatedAt.toISOString() : view.updatedAt ?? '')
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

/** required enforces runtime request inputs after signature verification. */
function required(value: string | undefined, field: string): string {
  if (!value?.trim()) {
    throw new Error(`${field} is required`)
  }
  return value.trim()
}

/** requirePreviewResourceType restricts preview access to P1 resource types. */
function requirePreviewResourceType(value: string | undefined): 'product' | 'blog' | 'news' {
  const resourceType = required(value, 'resourceType')
  if (resourceType !== 'product' && resourceType !== 'blog' && resourceType !== 'news') {
    throw new Error('resourceType is unsupported')
  }
  return resourceType
}
