import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { isSupportedSiteLocale } from '@oes/common/contracts'
import {
  ACCESS_DENIED,
  ExceptionFactory,
  UNAUTHENTICATED,
  VALIDATION_FAILED
} from '@oes/common/exceptions'
import {
  AdminRequestContext,
  CreateSiteRequest,
  CreateSiteResponse,
  CreateSiteContentRequest,
  CreateSiteContentResponse,
  DisableLocaleRequest,
  DisableLocaleResponse,
  ListSitePagesRequest,
  ListSitePagesResponse,
  UpdateSitePageGovernanceRequest,
  UpdateSitePageGovernanceResponse,
  ActivateLocaleRequest,
  ActivateLocaleResponse,
  AddPreparingLocaleRequest,
  AddPreparingLocaleResponse,
  CheckLocaleCompletenessRequest,
  CheckLocaleCompletenessResponse,
  GenerateSiteCredentialRequest,
  GenerateSiteCredentialResponse,
  GetPendingSyncSummaryRequest,
  GetPendingSyncSummaryResponse,
  GetSiteContentRequest,
  GetSiteContentResponse,
  GetSiteProductPublicationRequest,
  GetSiteProductPublicationResponse,
  GetSyncDetailRequest,
  GetSyncDetailResponse,
  IssuePreviewTokenRequest,
  IssuePreviewTokenResponse,
  ListPendingSyncResourcesRequest,
  ListPendingSyncResourcesResponse,
  ListSiteAuditLogsRequest,
  ListSiteAuditLogsResponse,
  ListSiteCardsRequest,
  ListSiteCardsResponse,
  ListSiteCredentialsRequest,
  ListSiteCredentialsResponse,
  ListSiteContentsRequest,
  ListSiteContentsResponse,
  ListSiteProductsRequest,
  ListSiteProductsResponse,
  ListSyncHistoryRequest,
  ListSyncHistoryResponse,
  AddProductsToSiteRequest,
  AddProductsToSiteResponse,
  UpdateSiteProductPublicationRequest,
  UpdateSiteProductPublicationResponse,
  UnpublishSiteContentRequest,
  UnpublishSiteProductRequest,
  UnpublishSiteProductResponse,
  SearchProductMasterForAddRequest,
  SearchProductMasterForAddResponse,
  UpdateSiteSettingsRequest,
  UpdateSiteSettingsResponse,
  DisableSiteRequest,
  DisableSiteResponse,
  RetryLastSyncRequest,
  RetryLastSyncResponse,
  ResendWebhookRequest,
  ResendWebhookResponse,
  SyncAllPendingChangesRequest,
  SyncAllPendingChangesResponse,
  RevokeSiteCredentialRequest,
  RevokeSiteCredentialResponse,
  RotateSiteCredentialRequest,
  RotateSiteCredentialResponse,
  UpdateSiteContentLocaleVersionRequest,
  UpdateSiteContentLocaleVersionResponse,
  ListFaqCategoriesRequest, ListFaqCategoriesResponse, GetFaqCategoryRequest, GetFaqCategoryResponse,
  CreateFaqCategoryRequest, CreateFaqCategoryResponse, UpdateFaqCategoryLocaleVersionRequest, UpdateFaqCategoryLocaleVersionResponse,
  DisableFaqCategoryRequest, DisableFaqCategoryResponse, ListFaqEntriesRequest, ListFaqEntriesResponse,
  GetFaqEntryRequest, GetFaqEntryResponse, CreateFaqEntryRequest, CreateFaqEntryResponse,
  UpdateFaqEntryLocaleVersionRequest, UpdateFaqEntryLocaleVersionResponse, UnpublishFaqEntryRequest, UnpublishFaqEntryResponse,
  CheckFaqCompletenessRequest, CheckFaqCompletenessResponse
} from '@oes/common/generated/site_service'
import {
  buildBlogPublicView,
  buildCategoryPublicView,
  buildNewsPublicView,
  buildProductPublicView,
  buildArticleCategoryPublicView
} from '../../domain/public-view/public-view-builders'
import { buildFaqDirectoryPublicView } from '../../domain/faq/faq-public-view-builder'
import { assertContentCategoryReferencesValid } from '../../domain/publication/content-category-policy'
import { SiteSlugConflictError } from '../../domain/publication/site-slug-policy'
import { issuePreviewToken as issueBoundPreviewToken } from '../../domain/preview/preview-token'
import { requireSitePreviewTokenSecret } from '../../domain/preview/preview-config'
import { createCredentialBundle } from '../../domain/security/site-request-signing'
import { createSyncBatchPlan, PendingSyncResource } from '../../domain/sync/sync-batch-planner'
import { NoopSiteWebhookPublisher } from '../ports/site-webhook-publisher.port'
import type { SiteWebhookPublisher } from '../ports/site-webhook-publisher.port'

export interface SiteAdminApplicationRepository {
  runInTransaction<T>(callback: () => Promise<T>): Promise<T>
  prepareDynamicSlugForSync?(input: {
    siteId: string
    resourceType: 'blog' | 'news' | 'article-category'
    resourceId: string
    locale: string
    expectedRevision: number
    promoteDraft: boolean
  }): Promise<{ canonicalSlug: string; historicalSlugs: string[] }>
  createSiteWithDefaultLocale(input: {
    siteId: string
    tenantId: string
    siteCode: string
    siteName: string
    siteType: string
    defaultLocale: string
    primaryDomain: string | null
    previewBaseUrl: string | null
    createdBy: string
  }): Promise<void>
  listSiteCards(tenantId: string): Promise<unknown[]>
  findTenantIdForSite(siteId: string): Promise<string | null>
  findPreviewResourceOwnership(input: {
    siteId: string
    resourceType: 'product' | 'blog' | 'news'
    resourceId: string
    locale: string
  }): Promise<{
    siteId: string
    resourceType: string
    localeMatched: boolean
  } | null>
  findContentOwnership(contentId: string): Promise<{ siteId: string; contentType: string } | null>
  findCredentialOwnership(credentialId: string): Promise<{ siteId: string } | null>
  saveCredentialMetadata(input: {
    credentialId: string
    siteId: string
    clientId: string
    secretHash: string
    secretCiphertext: string
    scopes: string[]
    status: string
    createdBy: string
  }): Promise<void>
  listSiteCredentials(input: { siteId: string }): Promise<unknown[]>
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
  createContentEntry(input: {
    contentId: string
    siteId: string
    tenantId: string
    contentType: string
    status: string
  }): Promise<unknown>
  updateContentLocaleVersion(input: {
    contentVersionId: string
    contentId: string
    siteId: string
    tenantId: string
    locale: string
    slug: string
    title: string
    bodyHtml: string
    summary: string | null
    coverImage: string | null
    coverImageAlt: string | null
    author: string | null
    categoryIds: string[]
    seoTitle: string | null
    seoDescription: string | null
    seoImage: string | null
    publishedAt: Date | null
    status: string
    syncStatus: string
  }): Promise<{
    version: unknown
    slugChanged: boolean
    previousSlug: string | null
  } | null>
  getSitePublishStateForSync(
    siteId: string
  ): Promise<{ tenantId: string; currentPublishVersion: number }>
  listPendingSyncResources(siteId: string): Promise<PendingSyncResource[]>
  listActiveSiteLocales(input: { siteId: string }): Promise<string[]>
  getContentVersionForPublicView(input: {
    siteId: string
    contentId: string
    locale: string
    expectedRevision?: number
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
    categoryIds?: string[]
    historicalSlugs?: string[]
    seoTitle: string | null
    seoDescription: string | null
    seoImage?: string | null
    publishedAt?: Date | null
  } | null>
  upsertPublicView(input: {
    siteId: string
    tenantId: string
    resourceType: string
    resourceId: string
    locale: string
    slug: string
    status: string
    publishVersion: number
    payload: Record<string, unknown>
    updatedAt: Date
  }): Promise<void>
  createSyncBatch(input: {
    syncId: string
    siteId: string
    tenantId: string
    publishVersion: number
    status: string
    triggeredBy: string
    resources: Array<{
      resourceType: string
      resourceId: string
      locale: string
      changeType: string
    }>
  }): Promise<void>
  markContentVersionSynced(input: {
    siteId: string
    contentId: string
    locale: string
  }): Promise<boolean>
  markProductPublicationSynced(input: {
    siteId: string
    productId: string
    locale: string
  }): Promise<void>
  markCategoryPublicationSynced(input: {
    siteId: string
    categoryId: string
    locale: string
  }): Promise<void>
  markContentCategoryVersionSynced(input: { categoryId: string; locale: string }): Promise<void>
  /** markPendingResourceSynced atomically clears only the revision captured by a publish batch. */
  markPendingResourceSynced?(input: {
    siteId: string
    resourceType: PendingSyncResource['resourceType']
    resourceId: string
    locale: string
    expectedRevision: number
  }): Promise<{ cleared: boolean }>
  /** runPublishTransaction serializes one site's publish transaction at the database boundary. */
  runPublishTransaction?<T>(siteId: string, callback: () => Promise<T>): Promise<T>
  getDefaultSiteLocale(siteId: string): Promise<string>
  createContentCategory(input: {
    categoryId: string
    siteId: string
    tenantId: string
    sortOrder: number
    syncStatus: string
  }): Promise<unknown>
  updateContentCategoryLocaleVersion(input: {
    categoryVersionId: string
    categoryId: string
    siteId: string
    locale: string
    slug: string
    displayName: string
    archiveIntro: string | null
    archiveLabel: string | null
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    syncStatus: string
  }): Promise<unknown>
  deleteContentCategory?(input: { siteId: string; categoryId: string }): Promise<{ tombstoned: boolean }>
  publishContentCategoryLocaleVersion?(input: { siteId: string; categoryId: string; locale: string; expectedRevision?: number; publishedAt?: Date }): Promise<any>
  requestContentCategoryLocalePublication?(input: { siteId: string; categoryId: string; locale: string }): Promise<any>
  getContentCategoryUsage?(input: { siteId: string; categoryId: string }): Promise<{ blogCount: number; newsCount: number; draftReferenceCount: number }>
  reorderContentCategories?(input: { siteId: string; orderedCategoryIds: string[] }): Promise<unknown[]>
  listContentCategories(input: {
    siteId: string
    locale?: string
  }): Promise<unknown[]>
  getContentCategory(input: { siteId: string; categoryId: string }): Promise<unknown | null>
  getContentCategoryLocaleVersionForPublicView(input: {
    siteId: string
    categoryId: string
    locale: string
    expectedRevision?: number
  }): Promise<{
    categoryId: string
    locale: string
    slug: string
    displayName: string
    archiveIntro?: string | null
    archiveLabel?: string | null
    sortOrder?: number | null
    historicalSlugs?: string[]
    seoTitle?: string | null
    seoDescription?: string | null
    seoImage?: string | null
  } | null>
  getFaqDirectoryForPublicView?(input: { siteId: string; locale: string; expectedRevision?: number }): Promise<Array<{ categoryId: string; title: string; anchorKey: string; sortOrder: number; entries: Array<{ entryId: string; question: string; answerHtml: string; sortOrder: number }> }> | null>
  listFaqCategories?(input: { siteId: string; locale?: string }): Promise<any[]>
  getFaqCategory?(input: { siteId: string; categoryId: string }): Promise<any | null>
  createFaqCategory?(input: { categoryId: string; siteId: string; tenantId: string }): Promise<any>
  updateFaqCategoryLocaleVersion?(input: { categoryVersionId: string; categoryId: string; siteId: string; locale: string; title: string; anchorKey: string; sortOrder: number }): Promise<any>
  disableFaqCategory?(input: { siteId: string; categoryId: string }): Promise<void>
  listFaqEntries?(input: { siteId: string; categoryId?: string; locale?: string }): Promise<any[]>
  getFaqEntry?(input: { siteId: string; entryId: string }): Promise<any | null>
  createFaqEntry?(input: { entryId: string; siteId: string; tenantId: string; categoryId: string }): Promise<any>
  updateFaqEntryLocaleVersion?(input: { entryVersionId: string; entryId: string; siteId: string; locale: string; question: string; answerHtml: string; sortOrder: number }): Promise<any>
  unpublishFaqEntry?(input: { siteId: string; entryId: string; locale: string }): Promise<boolean>
  revokeSiteCredential(input: {
    siteId: string
    credentialId: string
    revokedAt: Date
  }): Promise<boolean>
  updateSiteSettings(input: {
    siteId: string
    siteName: string | null
    primaryDomain: string | null
    previewBaseUrl: string | null
    webhookUrl: string | null
    runtimeStatusUrl: string | null
    allowedOrigins: string[]
  }): Promise<void>
  disableSite(input: { siteId: string; disabledAt: Date; reason: string | null }): Promise<void>
  addPreparingLocale(input: { siteId: string; locale: string }): Promise<void>
  checkLocaleCompleteness(input: {
    siteId: string
    locale: string
  }): Promise<{ complete: boolean; issues: string[] }>
  checkSitePagePreflight?(input: { siteId: string; activatingLocale?: string }): Promise<{
    ok: boolean
    issues: Array<{ code: string; pageKey: string; locale: string }>
  }>
  activateLocale(input: { siteId: string; locale: string }): Promise<void>
  disableLocale(input: { siteId: string; locale: string }): Promise<void>
  markLocaleResourcesPending(input: { siteId: string; locale: string }): Promise<void>
  getLocaleStatus(input: { siteId: string; locale: string }): Promise<string | null>
  listSitePages?(input: { siteId: string }): Promise<any[]>
  updateSitePageGovernance?(input: {
    siteId: string
    pageKey: string
    enabled: boolean
    indexable: boolean
  }): Promise<any>
  markSiteExposurePending?(input: { siteId: string }): Promise<void>
  markSiteExposureSynced?(input: { siteId: string }): Promise<void>
  publishSiteExposure?(input: {
    siteId: string
    publishVersion: number
    publishedAt: Date
  }): Promise<any>
  listSiteProducts(input: { siteId: string; locale?: string }): Promise<unknown[]>
  listSiteCategories(input: { siteId: string; locale?: string }): Promise<unknown[]>
  createSiteCategory(input: {
    categoryId: string
    siteId: string
    tenantId: string
    parentCategoryId: string | null
    sourceCategoryId: string | null
    locale: string
    slug: string
    displayTitle: string
    description: string | null
    image: string | null
    sortOrder: number
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    publishStatus: string
    syncStatus: string
  }): Promise<unknown>
  updateSiteCategory(input: {
    categoryId: string
    siteId: string
    parentCategoryId: string | null
    sourceCategoryId: string | null
    slug: string
    displayTitle: string
    description: string | null
    image: string | null
    sortOrder: number
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    publishStatus: string
    syncStatus: string
  }): Promise<unknown>
  unpublishSiteCategory(input: {
    siteId: string
    categoryId: string
    locale: string
  }): Promise<void>
  getCategoryPublicationForPublicView(input: {
    siteId: string
    categoryId: string
    locale: string
    expectedRevision?: number
  }): Promise<{
    categoryId: string
    parentCategoryId?: string | null
    locale: string
    slug: string
    displayTitle: string
    description?: string | null
    image?: string | null
    sortOrder?: number | null
    seoTitle: string
    seoDescription: string
    seoImage?: string | null
    publishStatus: string
  } | null>
  searchProductMasterForAdd(input: {
    siteId: string
    keyword?: string
    page: number
    pageSize: number
  }): Promise<{ candidates: unknown[]; total: number }>
  getSiteProductPublication(input: {
    siteId: string
    publicationId: string
  }): Promise<unknown | null>
  addProductPublication(input: {
    publicationId: string
    siteId: string
    tenantId: string
    productId: string
    locale: string
    slug: string
    displayTitle: string
    displayDescription: string
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    imageOverride: string | null
    categoryIds?: string[]
    publishStatus: string
    syncStatus: string
  }): Promise<unknown>
  updateSiteProductPublication(input: {
    publicationId: string
    siteId: string
    slug: string
    displayTitle: string
    displayDescription: string
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    imageOverride: string | null
    categoryIds?: string[]
    publishStatus: string
    syncStatus: string
  }): Promise<unknown>
  unpublishSiteProduct(input: { siteId: string; publicationId: string }): Promise<void>
  getProductPublicationForPublicView(input: {
    siteId: string
    productId: string
    locale: string
    expectedRevision?: number
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
    categoryIds?: string[]
    publishStatus: string
  } | null>
  listSiteContents(input: { siteId: string; contentType?: string }): Promise<unknown[]>
  getSiteContent(input: { siteId: string; contentId: string }): Promise<unknown | null>
  unpublishSiteContent(input: {
    siteId: string
    contentId: string
    locale: string
  }): Promise<boolean>
  getPendingSyncSummary(input: {
    siteId: string
  }): Promise<{ pendingCount: number; resourceTypes: string[] }>
  listSyncHistory(input: { siteId: string }): Promise<unknown[]>
  findSyncOwnership(
    syncId: string
  ): Promise<{ syncId: string; siteId: string; tenantId: string } | null>
  getSyncDetail(input: { siteId: string; syncId: string }): Promise<unknown | null>
  getLastSyncBatch(input: {
    siteId: string
  }): Promise<{ syncId: string; publishVersion: number } | null>
  hasInitialWebhookDelivery(input: { syncId: string; eventType: string }): Promise<boolean>
  getWebhookDispatchConfig(input: {
    siteId: string
  }): Promise<{ targetUrl: string | null; signingSecret: string | null } | null>
  recordWebhookDelivery(input: {
    deliveryId: string
    syncId: string
    siteId: string
    tenantId: string
    eventId: string
    eventType: string
    publishVersion: number
    targetUrl?: string | null
    status?: string
    payload: Record<string, unknown>
    headers: Record<string, unknown>
    resent: boolean
    deliveredAt: Date
    failureReason?: string | null
  }): Promise<void>
  listSiteAuditLogs(input: { siteId: string; tenantId?: string }): Promise<unknown[]>
}

export const SITE_ADMIN_APPLICATION_REPOSITORY = Symbol('SITE_ADMIN_APPLICATION_REPOSITORY')

export interface SiteAdminApplicationOptions {
  previewTokenSecret: string
  now?: () => Date
  randomId?: (prefix: string) => string
  randomSecret?: () => string
  oesBaseUrl?: string
  environment?: string
}

const DEFAULT_CREDENTIAL_SCOPES = [
  'site:read',
  'site:sync',
  'site:preview',
  'site:status',
  'site:capabilities'
]
const WEBHOOK_DISPATCH_FAILURE_REASON = 'webhook dispatch failed'

/** SiteAdminApplicationService orchestrates Admin Site Management commands and queries behind the gRPC adapter. */
@Injectable()
export class SiteAdminApplicationService {
  constructor(
    @Inject(SITE_ADMIN_APPLICATION_REPOSITORY)
    private readonly repository: SiteAdminApplicationRepository,
    private readonly options: SiteAdminApplicationOptions,
    private readonly webhookPublisher: SiteWebhookPublisher = new NoopSiteWebhookPublisher()
  ) {}

  /** listSiteCards returns the tenant-scoped card workspace read model. */
  async listSiteCards(request: ListSiteCardsRequest): Promise<ListSiteCardsResponse> {
    return {
      cards: (await this.repository.listSiteCards(required(request.tenantId, 'tenantId'))) as any
    }
  }

  /** createSite creates a draft site with one active default locale and records audit. */
  async createSite(request: CreateSiteRequest): Promise<CreateSiteResponse> {
    const siteId = this.id('site')
    const tenantId = required(request.tenantId, 'tenantId')
    const operatorId = required(request.operatorId, 'operatorId')
    const defaultLocale = required(request.defaultLocale, 'defaultLocale')

    await this.ensureSystemLocaleEnabled(defaultLocale)

    await this.repository.createSiteWithDefaultLocale({
      siteId,
      tenantId,
      siteCode: siteCodeFromName(required(request.siteName, 'siteName')),
      siteName: required(request.siteName, 'siteName'),
      siteType: required(request.siteType, 'siteType'),
      defaultLocale,
      primaryDomain: nullable(request.primaryDomain),
      previewBaseUrl: nullable(request.previewBaseUrl),
      createdBy: operatorId
    })
    await this.audit({
      eventType: 'site.created',
      tenantId,
      orgId: nullable(request.orgId),
      operatorId,
      traceId: nullable(request.traceId),
      resourceType: 'site',
      resourceId: siteId,
      details: { siteId, siteName: request.siteName }
    })

    return { siteId, status: 'draft', defaultLocale }
  }

  /** generateSiteCredential creates one scoped credential and returns the secret bundle once. */
  async generateSiteCredential(
    request: GenerateSiteCredentialRequest
  ): Promise<GenerateSiteCredentialResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const operatorId = required(request.context?.operatorId, 'operatorId')
    const scopes = request.scopes?.length ? request.scopes : DEFAULT_CREDENTIAL_SCOPES
    const credential = await this.persistSiteCredential({ siteId, operatorId, scopes })
    await this.audit({
      eventType: 'site_credential.generated',
      tenantId: nullable(request.context?.tenantId),
      orgId: nullable(request.context?.orgId),
      operatorId,
      traceId: nullable(request.context?.traceId),
      resourceType: 'site_credential',
      resourceId: credential.credentialId,
      details: { siteId, scopes }
    })
    return this.toGeneratedCredentialResponse(credential)
  }

  /** listSiteCredentials returns credential metadata and never returns secret material or one-time bundles. */
  async listSiteCredentials(
    request: ListSiteCredentialsRequest
  ): Promise<ListSiteCredentialsResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const credentials = await this.repository.listSiteCredentials({
      siteId
    })
    return {
      credentials: (credentials as any[]).map((credential) => ({
        credentialId: credential.credentialId,
        clientId: credential.clientId,
        status: credential.status,
        scopes: credential.scopes ?? [],
        createdAt: formatDate(credential.createdAt),
        lastUsedAt: formatDate(credential.lastUsedAt),
        revokedAt: formatDate(credential.revokedAt)
      }))
    }
  }

  /** syncAllPendingChanges publishes pending public views, advances version once, and records a sync batch. */
  async syncAllPendingChanges(
    request: SyncAllPendingChangesRequest
  ): Promise<SyncAllPendingChangesResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const operatorId = required(request.context?.operatorId, 'operatorId')
    const publishTransaction = this.repository.runPublishTransaction
      ? (callback: () => Promise<any>) => this.repository.runPublishTransaction!(siteId, callback)
      : (callback: () => Promise<any>) => this.repository.runInTransaction(callback)
    const outcome = await publishTransaction(async () => {
      const preflight = await this.repository.checkSitePagePreflight?.({ siteId })
      if (preflight?.ok === false) {
        const state = await this.repository.getSitePublishStateForSync(siteId)
        return {
          kind: 'blocked' as const,
          publishVersion: state.currentPublishVersion,
          preflightIssues: preflight.issues
        }
      }
      const state = await this.repository.getSitePublishStateForSync(siteId)
      const pendingResources = await this.repository.listPendingSyncResources(siteId)
      const plan = createSyncBatchPlan({
        siteId,
        currentPublishVersion: state.currentPublishVersion,
        pendingResources
      })

      if (!plan) {
        return { kind: 'noop' as const, publishVersion: state.currentPublishVersion }
      }

      const syncId = this.id('sync')
      const updatedAt = this.now()
      for (const resource of plan.resources) {
        if (resource.resourceType === 'site-exposure') {
          await this.repository.publishSiteExposure?.({
            siteId,
            publishVersion: plan.publishVersion,
            publishedAt: updatedAt
          })
          if (this.repository.markPendingResourceSynced) {
            await this.repository.markPendingResourceSynced({
              siteId,
              resourceType: resource.resourceType,
              resourceId: resource.resourceId,
              locale: resource.locale,
              expectedRevision: resource.expectedRevision
            })
          } else {
            await this.repository.markSiteExposureSynced?.({ siteId })
          }
          continue
        }
        if (
          this.repository.prepareDynamicSlugForSync &&
          (resource.resourceType === 'blog' ||
            resource.resourceType === 'news' ||
            resource.resourceType === 'article-category')
        ) {
          await this.repository.prepareDynamicSlugForSync({
            siteId,
            resourceType: resource.resourceType,
            resourceId: resource.resourceId,
            locale: resource.locale,
            expectedRevision: resource.expectedRevision,
            promoteDraft:
              resource.changeType !== 'unpublish' && resource.changeType !== 'locale_disable'
          })
        }
        const view = await this.buildPendingPublicView(
          siteId,
          plan.publishVersion,
          updatedAt,
          resource
        )
        if (!view) {
          if (this.repository.markPendingResourceSynced) {
            throw new Error('pending sync revision changed')
          }
          continue
        }
        await this.repository.upsertPublicView({
          siteId,
          tenantId: state.tenantId,
          resourceType: view.resource_type,
          resourceId: view.resource_id,
          locale: view.locale,
          slug: 'slug' in view ? view.slug : '',
          status: view.status,
          publishVersion: view.publish_version,
          payload: view.payload,
          updatedAt
        })
        if (this.repository.markPendingResourceSynced) {
          await this.repository.markPendingResourceSynced({
            siteId,
            resourceType: resource.resourceType,
            resourceId: resource.resourceId,
            locale: resource.locale,
            expectedRevision: resource.expectedRevision
          })
        } else if (resource.resourceType === 'product') {
          await this.repository.markProductPublicationSynced({
            siteId,
            productId: resource.resourceId,
            locale: resource.locale
          })
        } else if (resource.resourceType === 'category') {
          await this.repository.markCategoryPublicationSynced({
            siteId,
            categoryId: resource.resourceId,
            locale: resource.locale
          })
        } else if (resource.resourceType === 'article-category') {
          await this.repository.markContentCategoryVersionSynced({
            categoryId: resource.resourceId,
            locale: resource.locale
          })
        } else {
          const marked = await this.repository.markContentVersionSynced({
            siteId,
            contentId: resource.resourceId,
            locale: resource.locale
          })
          if (marked === false) {
            throw new NotFoundException('content version not found')
          }
        }
      }
      await this.repository.createSyncBatch({
        syncId,
        siteId,
        tenantId: state.tenantId,
        publishVersion: plan.publishVersion,
        status: 'completed',
        triggeredBy: operatorId,
        resources: plan.resources.map(({ expectedRevision: _expectedRevision, ...resource }) => resource)
      })
      return { kind: 'published' as const, syncId, state, publishVersion: plan.publishVersion }
    })

    if (outcome.kind === 'blocked') {
      const firstIssue = outcome.preflightIssues[0]
      await this.auditFromContext(request.context, 'site_sync.blocked', 'site', siteId, {
        siteId,
        reason: firstIssue.code,
        issues: outcome.preflightIssues
      })
      return {
        syncId: '',
        publishVersion: outcome.publishVersion,
        webhookDispatched: false,
        blocked: true,
        preflightIssues: outcome.preflightIssues
      }
    }
    if (outcome.kind === 'noop') {
      return { syncId: '', publishVersion: outcome.publishVersion, webhookDispatched: false }
    }

    const { syncId, state } = outcome
    const webhookDispatched = await this.recordPublishAvailableWebhook({
      syncId,
      siteId,
      tenantId: state.tenantId,
      publishVersion: outcome.publishVersion,
      resent: false
    })

    return { syncId, publishVersion: outcome.publishVersion, webhookDispatched }
  }

  /** issuePreviewToken creates a short-lived resource-bound preview token without embedding draft content. */
  async issuePreviewToken(request: IssuePreviewTokenRequest): Promise<IssuePreviewTokenResponse> {
    const context = this.requireCompleteAdminContext(request.context)
    const siteId = await this.assertSiteOwnershipForTenant(context.tenantId, request.siteId)
    const resourceType = requirePreviewResourceType(request.resourceType)
    const resourceId = requiredPreviewInput(request.resourceId)
    const locale = requiredPreviewInput(request.locale)
    const ownership = await this.repository.findPreviewResourceOwnership({
      siteId,
      resourceType,
      resourceId,
      locale
    })
    assertPreviewResourceOwnership(ownership, siteId, resourceType)
    const issued = issueBoundPreviewToken({
      secret: requireSitePreviewTokenSecret(this.options.previewTokenSecret),
      now: this.now(),
      siteId,
      resourceType,
      resourceId,
      locale,
      operatorId: context.operatorId
    })
    const previewBaseUrl = process.env.SITE_PREVIEW_BASE_URL ?? 'https://preview.local/oes-preview'

    const response = {
      previewToken: issued.token,
      previewUrl: `${previewBaseUrl}?preview_token=${encodeURIComponent(issued.token)}`,
      expiresAt: issued.expiresAt.toISOString()
    }
    if (resourceType !== 'product') {
      await this.auditFromContext(
        context,
        'content.preview_token_issued',
        'site_content',
        resourceId,
        {
          siteId,
          contentType: resourceType,
          contentId: resourceId,
          locale,
          expiresAt: response.expiresAt
        }
      )
    }
    return response
  }

  /** updateSiteSettings is the Admin settings command boundary for the site-service owner. */
  async updateSiteSettings(
    request: UpdateSiteSettingsRequest
  ): Promise<UpdateSiteSettingsResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    await this.repository.updateSiteSettings({
      siteId,
      siteName: nullable(request.siteName),
      primaryDomain: nullable(request.primaryDomain),
      previewBaseUrl: nullable(request.previewBaseUrl),
      webhookUrl: nullable(request.webhookUrl),
      runtimeStatusUrl: nullable(request.runtimeStatusUrl),
      allowedOrigins: request.allowedOrigins ?? []
    })
    await this.auditFromContext(request.context, 'site.settings_updated', 'site', request.siteId, {
      siteId: request.siteId
    })
    return { updated: true }
  }

  /** disableSite is the Admin lifecycle command boundary for disabling a site. */
  async disableSite(request: DisableSiteRequest): Promise<DisableSiteResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    await this.repository.disableSite({
      siteId,
      disabledAt: this.now(),
      reason: nullable(request.reason)
    })
    await this.auditFromContext(request.context, 'site.disabled', 'site', siteId, {
      siteId,
      reason: nullable(request.reason)
    })
    return { disabled: true }
  }

  /** addPreparingLocale is the Admin locale command boundary for preparing a new locale. */
  async addPreparingLocale(
    request: AddPreparingLocaleRequest
  ): Promise<AddPreparingLocaleResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const locale = required(request.locale, 'locale')
    await this.ensureSystemLocaleEnabled(locale)
    await this.repository.addPreparingLocale({ siteId, locale })
    await this.auditFromContext(
      request.context,
      'site_locale.added',
      'site_locale',
      `${siteId}:${locale}`,
      { siteId, locale }
    )
    return { added: true }
  }

  /** checkLocaleCompleteness is the Admin locale query boundary before activation. */
  async checkLocaleCompleteness(
    request: CheckLocaleCompletenessRequest
  ): Promise<CheckLocaleCompletenessResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const locale = required(request.locale, 'locale')
    const completeness = await this.repository.checkLocaleCompleteness({ siteId, locale })
    const pagePreflight = await this.repository.checkSitePagePreflight?.({
      siteId,
      activatingLocale: locale
    })
    const preflightIssues = pagePreflight?.issues ?? []
    return {
      complete: completeness.complete && preflightIssues.length === 0,
      issues: [
        ...completeness.issues,
        ...preflightIssues.map((issue) => `${issue.code}:${issue.pageKey}:${issue.locale}`)
      ],
      ...(preflightIssues.length > 0 ? { preflightIssues } : {})
    }
  }

  /** activateLocale is the Admin locale lifecycle boundary for publishing a prepared locale. */
  async activateLocale(request: ActivateLocaleRequest): Promise<ActivateLocaleResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const locale = required(request.locale, 'locale')
    const completeness = await this.repository.checkLocaleCompleteness({ siteId, locale })
    const pagePreflight = await this.repository.checkSitePagePreflight?.({
      siteId,
      activatingLocale: locale
    })
    if (!completeness.complete || pagePreflight?.ok === false) {
      const firstIssue = pagePreflight?.issues?.[0]
      const error = new Error(
        firstIssue
          ? `${firstIssue.code}:${firstIssue.pageKey}:${firstIssue.locale}`
          : `locale is incomplete: ${completeness.issues.join(', ')}`
      ) as Error & { code?: string }
      error.code = firstIssue?.code
      throw error
    }
    await this.repository.activateLocale({ siteId, locale })
    await this.repository.markSiteExposurePending?.({ siteId })
    await this.auditFromContext(
      request.context,
      'site_locale.activated',
      'site_locale',
      `${siteId}:${locale}`,
      { siteId, locale }
    )
    return { activated: true }
  }

  /** disableLocale is the Admin locale lifecycle boundary for hiding a locale. */
  async disableLocale(request: DisableLocaleRequest): Promise<DisableLocaleResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const locale = required(request.locale, 'locale')
    await this.repository.disableLocale({ siteId, locale })
    await this.repository.markLocaleResourcesPending({ siteId, locale })
    await this.repository.markSiteExposurePending?.({ siteId })
    await this.auditFromContext(
      request.context,
      'site_locale.disabled',
      'site_locale',
      `${siteId}:${locale}`,
      { siteId, locale }
    )
    return { disabled: true }
  }

  /** listSitePages returns discovery and page-wide governance for the Admin Pages section. */
  async listSitePages(request: ListSitePagesRequest): Promise<ListSitePagesResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const pages = await this.repository.listSitePages?.({
      siteId
    })
    return { pages: (pages ?? []).map(toSitePageRecord) }
  }

  /** updateSitePageGovernance changes enabled/index intent and creates an exposure pending state. */
  async updateSitePageGovernance(
    request: UpdateSitePageGovernanceRequest
  ): Promise<UpdateSitePageGovernanceResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const pageKey = required(request.pageKey, 'pageKey')
    const page = await this.repository.updateSitePageGovernance?.({
      siteId,
      pageKey,
      enabled: request.enabled === true,
      indexable: request.indexable === true
    })
    await this.repository.markSiteExposurePending?.({ siteId })
    await this.auditFromContext(
      request.context,
      'site_page.governance_updated',
      'site_page',
      `${siteId}:${pageKey}`,
      {
        siteId,
        pageKey,
        enabled: request.enabled === true,
        indexable: request.indexable === true
      }
    )
    return { page: toSitePageRecord(page) }
  }

  /** listSiteCategories is the Admin category projection query boundary. */
  async listSiteCategories(request: {
    context?: AdminRequestContext
    siteId?: string
    locale?: string
  }): Promise<{ categories: any[] }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    return {
      categories: (await this.repository.listSiteCategories({
        siteId,
        locale: nullable(request.locale) ?? undefined
      })) as any[]
    }
  }

  /** createSiteCategory creates a site-owned category projection for runtime category views. */
  async createSiteCategory(request: {
    context?: { tenantId?: string; orgId?: string; operatorId?: string; traceId?: string }
    siteId?: string
    parentCategoryId?: string
    sourceCategoryId?: string
    locale?: string
    slug?: string
    displayTitle?: string
    description?: string
    image?: string
    sortOrder?: number
    seoTitle?: string
    seoDescription?: string
    seoImage?: string
  }): Promise<{ category: any }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const locale = required(request.locale, 'locale')
    await this.ensureSiteLocaleWritable(siteId, locale)
    const category = await this.repository.createSiteCategory({
      categoryId: this.id('category'),
      siteId,
      tenantId: required(request.context?.tenantId, 'tenantId'),
      parentCategoryId: nullable(request.parentCategoryId),
      sourceCategoryId: nullable(request.sourceCategoryId),
      locale,
      slug: required(request.slug, 'slug'),
      displayTitle: required(request.displayTitle, 'displayTitle'),
      description: nullable(request.description),
      image: nullable(request.image),
      sortOrder: request.sortOrder ?? 0,
      seoTitle: required(request.seoTitle, 'seoTitle'),
      seoDescription: request.seoDescription ?? '',
      seoImage: nullable(request.seoImage),
      publishStatus: 'published',
      syncStatus: 'pending'
    })
    await this.auditFromContext(
      request.context,
      'site_category.created',
      'site_category',
      (category as any).categoryId ?? siteId,
      {
        siteId,
        categoryId: (category as any).categoryId
      }
    )
    return { category: category as any }
  }

  /** updateSiteCategory updates a site-owned category projection and marks it pending sync. */
  async updateSiteCategory(request: {
    context?: { tenantId?: string; orgId?: string; operatorId?: string; traceId?: string }
    siteId?: string
    category?: any
  }): Promise<{ category: any }> {
    const category = request.category
    const siteId = await this.assertSiteOwnership(
      request.context,
      request.siteId ?? category?.siteId
    )
    if (!category) {
      throw new Error('category is required')
    }
    const updated = await this.repository.updateSiteCategory({
      categoryId: required(category.categoryId, 'categoryId'),
      siteId,
      parentCategoryId: nullable(category.parentCategoryId),
      sourceCategoryId: nullable(category.sourceCategoryId),
      slug: required(category.slug, 'slug'),
      displayTitle: required(category.displayTitle, 'displayTitle'),
      description: nullable(category.description),
      image: nullable(category.image),
      sortOrder: category.sortOrder ?? 0,
      seoTitle: required(category.seoTitle, 'seoTitle'),
      seoDescription: category.seoDescription ?? '',
      seoImage: nullable(category.seoImage),
      publishStatus: category.publishStatus || 'published',
      syncStatus: 'pending'
    })
    await this.auditFromContext(
      request.context,
      'site_category.updated',
      'site_category',
      category.categoryId,
      {
        siteId: request.siteId ?? category.siteId,
        categoryId: category.categoryId
      }
    )
    return { category: updated as any }
  }

  /** unpublishSiteCategory marks one site category projection unpublished for explicit sync. */
  async unpublishSiteCategory(request: {
    context?: { tenantId?: string; orgId?: string; operatorId?: string; traceId?: string }
    siteId?: string
    categoryId?: string
    locale?: string
  }): Promise<{ unpublished: boolean }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const categoryId = required(request.categoryId, 'categoryId')
    const locale = required(request.locale, 'locale')
    await this.repository.unpublishSiteCategory({ siteId, categoryId, locale })
    await this.auditFromContext(
      request.context,
      'site_category.unpublished',
      'site_category',
      categoryId,
      { siteId, categoryId, locale }
    )
    return { unpublished: true }
  }

  /** listSiteProducts is the Admin product publication query boundary. */
  async listSiteProducts(request: ListSiteProductsRequest): Promise<ListSiteProductsResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    return {
      products: (await this.repository.listSiteProducts({
        siteId,
        locale: nullable(request.locale) ?? undefined
      })) as any
    }
  }

  /** searchProductMasterForAdd is the anti-corruption query boundary for Product Master candidates. */
  async searchProductMasterForAdd(
    request: SearchProductMasterForAddRequest
  ): Promise<SearchProductMasterForAddResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    return this.repository.searchProductMasterForAdd({
      siteId,
      keyword: nullable(request.keyword) ?? undefined,
      page: request.page || 1,
      pageSize: request.pageSize || 20
    }) as Promise<SearchProductMasterForAddResponse>
  }

  /** getSiteProductPublication is the Admin product publication detail query boundary. */
  async getSiteProductPublication(
    request: GetSiteProductPublicationRequest
  ): Promise<GetSiteProductPublicationResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    return {
      publication: (await this.repository.getSiteProductPublication({
        siteId,
        publicationId: required(request.publicationId, 'publicationId')
      })) as any
    }
  }

  /** addProductsToSite is the Admin command boundary for adding Product Master refs to a site. */
  async addProductsToSite(request: AddProductsToSiteRequest): Promise<AddProductsToSiteResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const tenantId = required(request.context?.tenantId, 'tenantId')
    const productIds = request.productIds ?? []
    const locales = request.locales ?? []
    const publications = []
    for (const locale of uniqueStrings(locales)) {
      await this.ensureSiteLocaleWritable(siteId, required(locale, 'locale'))
    }

    for (const productId of productIds) {
      for (const locale of locales) {
        const title = titleFromProductId(productId)
        publications.push(
          await this.repository.addProductPublication({
            publicationId: this.id('publication'),
            siteId,
            tenantId,
            productId: required(productId, 'productId'),
            locale: required(locale, 'locale'),
            slug: slugFromParts([productId, locale]),
            displayTitle: title,
            displayDescription: '',
            seoTitle: title,
            seoDescription: '',
            seoImage: null,
            imageOverride: null,
            categoryIds: request.categoryIds ?? [],
            publishStatus: 'published',
            syncStatus: 'pending'
          })
        )
      }
    }
    await this.auditFromContext(
      request.context,
      'site_product.added',
      'site_product_publication',
      siteId,
      {
        siteId,
        productIds,
        locales
      }
    )
    return { publications: publications as any }
  }

  /** updateSiteProductPublication is the Admin command boundary for site-owned product display config. */
  async updateSiteProductPublication(
    request: UpdateSiteProductPublicationRequest
  ): Promise<UpdateSiteProductPublicationResponse> {
    const publication = request.publication
    const siteId = await this.assertSiteOwnership(request.context, publication?.siteId)
    if (!publication) {
      throw new Error('publication is required')
    }
    const updated = await this.repository.updateSiteProductPublication({
      publicationId: required(publication.publicationId, 'publicationId'),
      siteId,
      slug: required(publication.slug, 'slug'),
      displayTitle: required(publication.displayTitle, 'displayTitle'),
      displayDescription: publication.displayDescription ?? '',
      seoTitle: required(publication.seoTitle, 'seoTitle'),
      seoDescription: publication.seoDescription ?? '',
      seoImage: nullable(publication.seoImage),
      imageOverride: nullable(publication.imageOverride),
      categoryIds: publication.categoryIds ?? [],
      publishStatus: publication.publishStatus || 'published',
      syncStatus: 'pending'
    })
    await this.auditFromContext(
      request.context,
      'site_product.updated',
      'site_product_publication',
      publication.publicationId,
      {
        siteId: publication.siteId,
        publicationId: publication.publicationId
      }
    )
    return { publication: updated as any }
  }

  /** unpublishSiteProduct is the Admin command boundary for product unpublish state changes. */
  async unpublishSiteProduct(
    request: UnpublishSiteProductRequest
  ): Promise<UnpublishSiteProductResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const publicationId = required(request.publicationId, 'publicationId')
    await this.repository.unpublishSiteProduct({ siteId, publicationId })
    await this.auditFromContext(
      request.context,
      'site_product.unpublished',
      'site_product_publication',
      publicationId,
      {
        siteId,
        publicationId
      }
    )
    return { unpublished: true }
  }

  /** listSiteContents is the Admin Blog/News list query boundary. */
  async listSiteContents(request: ListSiteContentsRequest): Promise<ListSiteContentsResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    return {
      contents: (await this.repository.listSiteContents({
        siteId,
        contentType: nullable(request.contentType) ?? undefined
      })) as any
    }
  }

  /** listFaqCategories exposes tenant-authorized, locale-filtered FAQ Category read models. */
  async listFaqCategories(request: ListFaqCategoriesRequest): Promise<ListFaqCategoriesResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    return { categories: ((await this.repository.listFaqCategories?.({ siteId, locale: nullable(request.locale) ?? undefined })) ?? []).map(toFaqCategoryRecord) }
  }

  /** getFaqCategory verifies tenant and descendant ownership before returning one Category. */
  async getFaqCategory(request: GetFaqCategoryRequest): Promise<GetFaqCategoryResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const category = await this.repository.getFaqCategory?.({ siteId, categoryId: required(request.categoryId, 'categoryId') })
    if (!category) throw new NotFoundException('faq category not found')
    return { category: toFaqCategoryRecord(category) }
  }

  /** createFaqCategory creates a flat site-owned FAQ Category and emits its audit fact. */
  async createFaqCategory(request: CreateFaqCategoryRequest): Promise<CreateFaqCategoryResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const category = await this.repository.createFaqCategory?.({ categoryId: this.id('faq_category'), siteId, tenantId: required(request.context?.tenantId, 'tenantId') })
    if (!category) throw new Error('faq repository is not configured')
    await this.auditFromContext(request.context, 'faq_category.created', 'faq_category', category.categoryId, { siteId, categoryId: category.categoryId })
    return { category: toFaqCategoryRecord(category) }
  }

  /** updateFaqCategoryLocaleVersion saves one writable-locale Category revision and directory pending state. */
  async updateFaqCategoryLocaleVersion(request: UpdateFaqCategoryLocaleVersionRequest): Promise<UpdateFaqCategoryLocaleVersionResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const version = request.version
    if (!version) throw new Error('version is required')
    const categoryId = required(version.categoryId, 'categoryId')
    if (!await this.repository.getFaqCategory?.({ siteId, categoryId })) throw new NotFoundException('faq category not found')
    const locale = required(version.locale, 'locale'); await this.ensureSiteLocaleWritable(siteId, locale)
    const saved = await this.repository.updateFaqCategoryLocaleVersion?.({ categoryVersionId: version.categoryVersionId || this.id('faq_category_version'), categoryId, siteId, locale, title: required(version.title, 'title'), anchorKey: required(version.anchorKey, 'anchorKey'), sortOrder: version.sortOrder ?? 0 })
    if (!saved) throw new Error('faq repository is not configured')
    await this.auditFromContext(request.context, 'faq_category.updated', 'faq_category', categoryId, { siteId, categoryId, locale })
    return { version: toFaqCategoryVersionRecord(saved) }
  }

  /** disableFaqCategory denies the transition when published Entries still belong to the Category. */
  async disableFaqCategory(request: DisableFaqCategoryRequest): Promise<DisableFaqCategoryResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId); const categoryId = required(request.categoryId, 'categoryId')
    if (!await this.repository.getFaqCategory?.({ siteId, categoryId })) throw new NotFoundException('faq category not found')
    await this.repository.disableFaqCategory?.({ siteId, categoryId }); await this.auditFromContext(request.context, 'faq_category.disabled', 'faq_category', categoryId, { siteId, categoryId })
    return { disabled: true }
  }

  /** listFaqEntries returns only Entries under an owned site and optional flat Category. */
  async listFaqEntries(request: ListFaqEntriesRequest): Promise<ListFaqEntriesResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    if (request.categoryId && !await this.repository.getFaqCategory?.({ siteId, categoryId: request.categoryId })) throw new NotFoundException('faq category not found')
    return { entries: ((await this.repository.listFaqEntries?.({ siteId, categoryId: nullable(request.categoryId) ?? undefined, locale: nullable(request.locale) ?? undefined })) ?? []).map(toFaqEntryRecord) }
  }

  /** getFaqEntry verifies site descendant ownership before returning an Entry. */
  async getFaqEntry(request: GetFaqEntryRequest): Promise<GetFaqEntryResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId); const entry = await this.repository.getFaqEntry?.({ siteId, entryId: required(request.entryId, 'entryId') })
    if (!entry) throw new NotFoundException('faq entry not found'); return { entry: toFaqEntryRecord(entry) }
  }

  /** createFaqEntry binds exactly one Entry to one owned FAQ Category. */
  async createFaqEntry(request: CreateFaqEntryRequest): Promise<CreateFaqEntryResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId); const categoryId = required(request.categoryId, 'categoryId')
    if (!await this.repository.getFaqCategory?.({ siteId, categoryId })) throw new NotFoundException('faq category not found')
    const entry = await this.repository.createFaqEntry?.({ entryId: this.id('faq_entry'), siteId, tenantId: required(request.context?.tenantId, 'tenantId'), categoryId }); if (!entry) throw new Error('faq repository is not configured')
    await this.auditFromContext(request.context, 'faq_entry.created', 'faq_entry', entry.entryId, { siteId, categoryId, entryId: entry.entryId }); return { entry: toFaqEntryRecord(entry) }
  }

  /** updateFaqEntryLocaleVersion stores a sanitized-on-publication FAQ answer in one writable locale. */
  async updateFaqEntryLocaleVersion(request: UpdateFaqEntryLocaleVersionRequest): Promise<UpdateFaqEntryLocaleVersionResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId); const version = request.version; if (!version) throw new Error('version is required')
    const entryId = required(version.entryId, 'entryId'); if (!await this.repository.getFaqEntry?.({ siteId, entryId })) throw new NotFoundException('faq entry not found')
    const locale = required(version.locale, 'locale'); await this.ensureSiteLocaleWritable(siteId, locale)
    const saved = await this.repository.updateFaqEntryLocaleVersion?.({ entryVersionId: version.entryVersionId || this.id('faq_entry_version'), entryId, siteId, locale, question: required(version.question, 'question'), answerHtml: required(version.answerHtml, 'answerHtml'), sortOrder: version.sortOrder ?? 0 }); if (!saved) throw new Error('faq repository is not configured')
    await this.auditFromContext(request.context, 'faq_entry.updated', 'faq_entry', entryId, { siteId, entryId, locale }); return { version: toFaqEntryVersionRecord(saved) }
  }

  /** unpublishFaqEntry withdraws one locale without touching other locale revisions. */
  async unpublishFaqEntry(request: UnpublishFaqEntryRequest): Promise<UnpublishFaqEntryResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId); const entryId = required(request.entryId, 'entryId'); if (!await this.repository.getFaqEntry?.({ siteId, entryId })) throw new NotFoundException('faq entry not found')
    const locale = required(request.locale, 'locale'); const unpublished = await this.repository.unpublishFaqEntry?.({ siteId, entryId, locale }); if (!unpublished) throw new NotFoundException('faq entry locale not found')
    await this.auditFromContext(request.context, 'faq_entry.unpublished', 'faq_entry', entryId, { siteId, entryId, locale }); return { unpublished: true }
  }

  /** checkFaqCompleteness validates required locale fields before an FAQ directory can publish. */
  async checkFaqCompleteness(request: CheckFaqCompletenessRequest): Promise<CheckFaqCompletenessResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId); const locale = required(request.locale, 'locale')
    const categories = (await this.repository.listFaqCategories?.({ siteId, locale })) ?? []; const entries = (await this.repository.listFaqEntries?.({ siteId, locale })) ?? []; const issues: string[] = []
    const anchors = new Set<string>(); for (const category of categories) for (const version of category.versions ?? []) { if (!version.title || !version.anchorKey) issues.push(`category ${category.categoryId} is incomplete`); if (anchors.has(version.anchorKey)) issues.push(`duplicate anchor_key ${version.anchorKey}`); anchors.add(version.anchorKey) }
    for (const entry of entries) for (const version of entry.versions ?? []) if (!version.question || !version.answerHtml || !entry.categoryId) issues.push(`entry ${entry.entryId} is incomplete`)
    return { complete: issues.length === 0, issues }
  }

  /** getSiteContent is the Admin Blog/News detail query boundary. */
  async getSiteContent(request: GetSiteContentRequest): Promise<GetSiteContentResponse> {
    const context = this.requireCompleteAdminContext(request.context)
    const siteId = await this.assertSiteOwnershipForTenant(context.tenantId, request.siteId)
    const ownership = await this.assertContentOwnership(siteId, request.contentId)
    const content = await this.repository.getSiteContent({
      siteId,
      contentId: ownership.contentId
    })
    if (content === null) {
      throw new NotFoundException('content not found')
    }
    return { content: content as any }
  }

  /** createSiteContent creates the site-scoped Blog/News container before locale drafts are saved. */
  async createSiteContent(request: CreateSiteContentRequest): Promise<CreateSiteContentResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const content = await this.repository.createContentEntry({
      contentId: this.id('content'),
      siteId,
      tenantId: required(request.context?.tenantId, 'tenantId'),
      contentType: required(request.contentType, 'contentType'),
      status: 'draft'
    })

    return { content: content as any }
  }

  /** updateSiteContentLocaleVersion saves a locale draft and marks it pending for explicit sync. */
  async updateSiteContentLocaleVersion(
    request: UpdateSiteContentLocaleVersionRequest
  ): Promise<UpdateSiteContentLocaleVersionResponse> {
    const context = this.requireCompleteAdminContext(request.context)
    const siteId = await this.assertSiteOwnershipForTenant(context.tenantId, request.siteId)
    const version = request.version
    const contentId = required(version?.contentId, 'contentId')
    let saved: unknown
    try {
      saved = await this.repository.runInTransaction(async () => {
        const ownership = await this.assertContentOwnership(siteId, contentId)
        if (!version) {
          throw new Error('version is required')
        }
        const locale = required(version.locale, 'locale')
        const slug = required(version.slug, 'slug')
        await this.ensureSiteLocaleWritable(siteId, locale)
        const categoryIds = uniqueStrings(
          (version as { categoryIds?: string[] }).categoryIds ?? version.tags ?? []
        )
        if (categoryIds.length > 0) {
          if (ownership.contentType !== 'blog' && ownership.contentType !== 'news') {
            throw new Error('contentType must be blog or news for category references')
          }
          assertContentCategoryReferencesValid({
            contentType: ownership.contentType,
            targetLocale: locale,
            referencedCategoryIds: categoryIds,
            categories: (await this.repository.listContentCategories({ siteId })) as any[]
          })
        }
        const updateResult = await this.repository.updateContentLocaleVersion({
          contentVersionId: version.contentVersionId || this.id('version'),
          contentId,
          siteId,
          tenantId: context.tenantId,
          locale,
          slug,
          title: required(version.title, 'title'),
          bodyHtml: required(version.bodyHtml, 'bodyHtml'),
          summary: nullable(version.summary),
          coverImage: nullable(version.coverImage),
          coverImageAlt: nullable((version as { coverImageAlt?: string | null }).coverImageAlt),
          author: nullable(version.author),
          categoryIds,
          seoTitle: required(version.seoTitle, 'seoTitle'),
          seoDescription: required(version.seoDescription, 'seoDescription'),
          seoImage: nullable(version.seoImage),
          publishedAt: version.publishedAt ? new Date(version.publishedAt) : null,
          status: version.status || 'draft',
          syncStatus: 'pending'
        })
        if (updateResult === null) {
          throw new NotFoundException('content not found')
        }
        await this.auditFromContext(context, 'content.updated', 'site_content', contentId, {
          siteId,
          contentId,
          locale
        })
        if (updateResult.slugChanged) {
          await this.auditFromContext(context, 'content.slug_changed', 'site_content', contentId, {
            siteId,
            contentId,
            locale,
            previousSlug: updateResult.previousSlug,
            currentSlug: slug
          })
        }
        return updateResult.version
      })
    } catch (error) {
      throw mapDynamicSlugWriteError(error)
    }

    return { version: saved as any }
  }

  /** createContentCategory atomically creates a neutral Category and its complete default-locale draft. */
  async createContentCategory(request: {
    context?: { tenantId?: string; orgId?: string; operatorId?: string; traceId?: string }
    siteId?: string
    sortOrder?: number
    initialLocaleVersion?: { locale?: string; slug?: string; displayName?: string; archiveIntro?: string; archiveLabel?: string; seoTitle?: string; seoDescription?: string; seoImage?: string }
  }): Promise<{ category: any }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const initial = request.initialLocaleVersion
    if (!initial) throw new Error('initialLocaleVersion is required')
    const defaultLocale = await this.repository.getDefaultSiteLocale(siteId)
    if (required(initial.locale, 'initialLocaleVersion.locale') !== defaultLocale) throw new Error('initialLocaleVersion.locale must equal the site default locale')
    const category = await this.repository.runInTransaction(async () => {
      const created = await this.repository.createContentCategory({ categoryId: this.id('content_category'), siteId, tenantId: required(request.context?.tenantId, 'tenantId'), sortOrder: request.sortOrder ?? 0, syncStatus: 'pending' }) as any
      await this.repository.updateContentCategoryLocaleVersion({ categoryVersionId: this.id('content_category_version'), categoryId: created.categoryId, siteId, locale: defaultLocale, slug: required(initial.slug, 'initialLocaleVersion.slug'), displayName: required(initial.displayName, 'initialLocaleVersion.displayName'), archiveIntro: nullable(initial.archiveIntro), archiveLabel: nullable(initial.archiveLabel), seoTitle: nullable(initial.seoTitle), seoDescription: nullable(initial.seoDescription), seoImage: nullable(initial.seoImage), syncStatus: 'pending' })
      return (await this.repository.getContentCategory({ siteId, categoryId: created.categoryId })) as any
    })
    await this.auditFromContext(
      request.context,
      'content_category.created',
      'article-category',
      (category as any).categoryId ?? siteId,
      {
        siteId,
        categoryId: (category as any).categoryId
      }
    )
    return { category: category as any }
  }

  /** updateContentCategoryLocaleVersion saves one Category locale version without resyncing referencing content. */
  async updateContentCategoryLocaleVersion(request: {
    context?: { tenantId?: string; orgId?: string; operatorId?: string; traceId?: string }
    siteId?: string
    version?: {
      categoryId?: string
      locale?: string
      slug?: string
      displayName?: string
      archiveIntro?: string
      archiveLabel?: string
      seoTitle?: string
      seoDescription?: string
      seoImage?: string
    }
  }): Promise<{ version: any }> {
    const version = request.version
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    if (!version) {
      throw new Error('version is required')
    }
    try {
      const saved = await this.repository.runInTransaction(async () => {
        const locale = required(version.locale, 'locale')
        await this.ensureSiteLocaleWritable(siteId, locale)
        const updated = await this.repository.updateContentCategoryLocaleVersion({
          categoryVersionId: this.id('content_category_version'),
          categoryId: required(version.categoryId, 'categoryId'),
          siteId,
          locale,
          slug: required(version.slug, 'slug'),
          displayName: required(version.displayName, 'displayName'),
          archiveIntro: nullable(version.archiveIntro),
          archiveLabel: nullable(version.archiveLabel),
          seoTitle: nullable(version.seoTitle),
          seoDescription: nullable(version.seoDescription),
          seoImage: nullable(version.seoImage),
          syncStatus: 'pending'
        })
        await this.auditFromContext(
          request.context,
          'content_category.updated',
          'article-category',
          version.categoryId,
          {
            siteId: request.siteId,
            categoryId: version.categoryId,
            locale: version.locale
          }
        )
        return updated
      })
      return { version: saved as any }
    } catch (error) {
      throw mapDynamicSlugWriteError(error)
    }
  }

  /** publishContentCategoryLocale records approval of the current locale draft before the next Site Sync. */
  async publishContentCategoryLocale(request: {
    context?: { tenantId?: string; orgId?: string; operatorId?: string; traceId?: string }
    siteId?: string
    categoryId?: string
    locale?: string
  }): Promise<{ version: any }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const categoryId = required(request.categoryId, 'categoryId')
    const locale = required(request.locale, 'locale')
    const category = await this.repository.getContentCategory({ siteId, categoryId }) as any
    const draft = category?.localeVersions?.find((version: any) => version.locale === locale)
    if (!draft?.displayName || !draft?.slug) throw new Error('content category locale is incomplete')
    if (!this.repository.requestContentCategoryLocalePublication) throw new Error('content category publication is unavailable')
    const published = await this.repository.requestContentCategoryLocalePublication({ siteId, categoryId, locale })
    await this.auditFromContext(request.context, 'content_category.locale_published', 'article-category', categoryId, { siteId, categoryId, locale })
    return { version: published }
  }

  /** deleteContentCategory enforces draft/published reference blockers and records the resulting tombstone. */
  async deleteContentCategory(request: { context?: AdminRequestContext; siteId?: string; categoryId?: string }): Promise<{ deleted: boolean; tombstoned: boolean }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const categoryId = required(request.categoryId, 'categoryId')
    if (!this.repository.deleteContentCategory) throw new Error('content category deletion is unavailable')
    const result = await this.repository.deleteContentCategory({ siteId, categoryId })
    await this.auditFromContext(request.context, 'content_category.deleted', 'article-category', categoryId, { siteId, categoryId, tombstoned: result.tombstoned })
    return { deleted: true, tombstoned: result.tombstoned }
  }

  /** reorderContentCategories commits the complete neutral Category rank sequence for one site. */
  async reorderContentCategories(request: { context?: AdminRequestContext; siteId?: string; orderedCategoryIds?: string[] }): Promise<{ categories: any[] }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const orderedCategoryIds = request.orderedCategoryIds ?? []
    if (!this.repository.reorderContentCategories) throw new Error('content category reordering is unavailable')
    return { categories: await this.repository.reorderContentCategories({ siteId, orderedCategoryIds }) as any[] }
  }

  /** listContentCategories returns Category read models for Admin Blog/News operations. */
  async listContentCategories(request: {
    context?: AdminRequestContext
    siteId?: string
    locale?: string
  }): Promise<{ categories: any[] }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    return {
      categories: (await this.repository.listContentCategories({
        siteId,
        locale: nullable(request.locale) ?? undefined
      })) as any[]
    }
  }

  /** getContentCategory returns one site-scoped Category read model. */
  async getContentCategory(request: {
    context?: AdminRequestContext
    siteId?: string
    categoryId?: string
  }): Promise<{ category: any }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    return {
      category: (await this.repository.getContentCategory({
        siteId,
        categoryId: required(request.categoryId, 'categoryId')
      })) as any
    }
  }

  /** listVisibleContentCategories returns only Categories with same-locale published Article usage for the requested type. */
  async listVisibleContentCategories(request: { context?: AdminRequestContext; siteId?: string; contentType?: string; locale?: string }): Promise<{ categories: any[] }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const contentType = required(request.contentType, 'contentType')
    if (contentType !== 'blog' && contentType !== 'news') throw new Error('contentType must be blog or news')
    const locale = required(request.locale, 'locale')
    const categories = await this.repository.listContentCategories({ siteId, locale }) as any[]
    const visible: any[] = []
    for (const category of categories) {
      const usage = await this.repository.getContentCategoryUsage?.({ siteId, categoryId: category.categoryId })
      if ((contentType === 'blog' ? usage?.blogCount : usage?.newsCount) && category.localeVersions?.some((version: any) => version.locale === locale && version.lastPublishedRevision > 0)) visible.push(category)
    }
    return { categories: visible }
  }

  /** checkContentCategoryCompleteness reports publication readiness without inventing SEO blockers. */
  async checkContentCategoryCompleteness(request: { context?: AdminRequestContext; siteId?: string; categoryId?: string; locale?: string }): Promise<{ complete: boolean; issues: string[] }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const category = await this.repository.getContentCategory({ siteId, categoryId: required(request.categoryId, 'categoryId') }) as any
    const version = category?.localeVersions?.find((item: any) => item.locale === required(request.locale, 'locale'))
    const issues = [!version ? 'locale version does not exist' : '', !version?.displayName ? 'displayName is required' : '', !version?.slug ? 'slug is required' : ''].filter(Boolean)
    return { complete: issues.length === 0, issues }
  }

  /** listContentCategoryUsage exposes Article reference projections rather than legacy applicability flags. */
  async listContentCategoryUsage(request: { context?: AdminRequestContext; siteId?: string; categoryId?: string }): Promise<{ usage: any }> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const usage = await this.repository.getContentCategoryUsage?.({ siteId, categoryId: required(request.categoryId, 'categoryId') })
    return { usage: usage ?? { blogCount: 0, newsCount: 0, draftReferenceCount: 0 } }
  }

  /** unpublishSiteContent is the Admin Blog/News unpublish command boundary. */
  async unpublishSiteContent(
    request: UnpublishSiteContentRequest
  ): Promise<{ unpublished: boolean }> {
    const context = this.requireCompleteAdminContext(request.context)
    const siteId = await this.assertSiteOwnershipForTenant(context.tenantId, request.siteId)
    const contentId = required(request.contentId, 'contentId')
    await this.repository.runInTransaction(async () => {
      await this.assertContentOwnership(siteId, contentId)
      const locale = required(request.locale, 'locale')
      const unpublished = await this.repository.unpublishSiteContent({
        siteId,
        contentId,
        locale
      })
      if (unpublished === false) {
        throw new NotFoundException('content version not found')
      }
      await this.auditFromContext(context, 'content.unpublished', 'site_content', contentId, {
        siteId,
        contentId,
        locale
      })
    })
    return { unpublished: true }
  }

  /** getPendingSyncSummary is the Admin sync summary query boundary. */
  async getPendingSyncSummary(
    request: GetPendingSyncSummaryRequest
  ): Promise<GetPendingSyncSummaryResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    return this.repository.getPendingSyncSummary({ siteId })
  }

  /** listPendingSyncResources is the Admin pending sync resource query boundary. */
  async listPendingSyncResources(
    request: ListPendingSyncResourcesRequest
  ): Promise<ListPendingSyncResourcesResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    return {
      resources: (await this.repository.listPendingSyncResources(siteId)) as any
    }
  }

  /** listSyncHistory is the Admin sync history query boundary. */
  async listSyncHistory(request: ListSyncHistoryRequest): Promise<ListSyncHistoryResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    return {
      batches: (await this.repository.listSyncHistory({
        siteId
      })) as any
    }
  }

  /** getSyncDetail is the Admin sync detail query boundary. */
  async getSyncDetail(request: GetSyncDetailRequest): Promise<GetSyncDetailResponse> {
    const context = this.requireCompleteAdminContext(request.context)
    const ownership = await this.assertSyncOwnership(context.tenantId, request.syncId)
    const batch = await this.repository.getSyncDetail({
      siteId: ownership.siteId,
      syncId: ownership.syncId
    })
    if (!batch) {
      throw new NotFoundException('sync not found')
    }
    return {
      batch: batch as any
    }
  }

  /** retryLastSync is the Admin sync retry command boundary. */
  async retryLastSync(request: RetryLastSyncRequest): Promise<RetryLastSyncResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const last = await this.repository.getLastSyncBatch({
      siteId
    })
    if (!last) {
      return { syncId: '', publishVersion: 0 }
    }
    await this.recordPublishAvailableWebhook({
      syncId: last.syncId,
      siteId,
      tenantId: required(request.context?.tenantId, 'tenantId'),
      publishVersion: last.publishVersion,
      resent: true
    })
    await this.auditFromContext(
      request.context,
      'site_sync.retried',
      'site_sync_batch',
      last.syncId,
      {
        siteId,
        publishVersion: last.publishVersion
      }
    )
    return { syncId: last.syncId, publishVersion: last.publishVersion }
  }

  /** resendWebhook is the Admin webhook resend command boundary that must not create a new version. */
  async resendWebhook(request: ResendWebhookRequest): Promise<ResendWebhookResponse> {
    const context = this.requireCompleteAdminContext(request.context)
    const ownership = await this.assertSyncOwnership(context.tenantId, request.syncId)
    const sync = await this.repository.getSyncDetail({
      siteId: ownership.siteId,
      syncId: ownership.syncId
    })
    if (!sync) {
      throw new NotFoundException('sync not found')
    }
    const syncRecord = sync as { publishVersion?: number }
    await this.recordPublishAvailableWebhook({
      syncId: ownership.syncId,
      siteId: ownership.siteId,
      tenantId: ownership.tenantId,
      publishVersion: syncRecord?.publishVersion ?? 0,
      resent: true
    })
    await this.auditFromContext(
      context,
      'site_webhook.resent',
      'site_sync_batch',
      ownership.syncId,
      { syncId: ownership.syncId }
    )
    return { resent: true }
  }

  /** rotateSiteCredential creates replacement credential material and revokes the previous credential id. */
  async rotateSiteCredential(
    request: RotateSiteCredentialRequest
  ): Promise<RotateSiteCredentialResponse> {
    const context = this.requireCompleteAdminContext(request.context)
    const siteId = await this.assertSiteOwnershipForTenant(context.tenantId, request.siteId)
    const credentialId = await this.assertCredentialOwnership(siteId, request.credentialId)
    const rotate = async () => {
      const replacement = await this.persistSiteCredential({
        siteId,
        operatorId: context.operatorId,
        scopes: DEFAULT_CREDENTIAL_SCOPES
      })
      const revoked = await this.repository.revokeSiteCredential({
        siteId,
        credentialId,
        revokedAt: this.now()
      })
      if (!revoked) {
        throw new NotFoundException('credential not found')
      }
      await this.auditFromContext(
        context,
        'site_credential.rotated',
        'site_credential',
        credentialId,
        { siteId, replacementCredentialId: replacement.credentialId }
      )
      return this.toGeneratedCredentialResponse(replacement)
    }
    return this.repository.runInTransaction(rotate)
  }

  /** revokeSiteCredential revokes one credential so future signed requests fail closed. */
  async revokeSiteCredential(
    request: RevokeSiteCredentialRequest
  ): Promise<RevokeSiteCredentialResponse> {
    const context = this.requireCompleteAdminContext(request.context)
    const siteId = await this.assertSiteOwnershipForTenant(context.tenantId, request.siteId)
    const credentialId = await this.assertCredentialOwnership(siteId, request.credentialId)
    const revoke = async () => {
      const revoked = await this.repository.revokeSiteCredential({
        siteId,
        credentialId,
        revokedAt: this.now()
      })
      if (!revoked) {
        throw new NotFoundException('credential not found')
      }
      await this.auditFromContext(
        context,
        'site_credential.revoked',
        'site_credential',
        credentialId,
        { siteId }
      )
    }
    await this.repository.runInTransaction(revoke)

    return { revoked: true }
  }

  /** listSiteAuditLogs is the Admin audit query boundary. */
  async listSiteAuditLogs(request: ListSiteAuditLogsRequest): Promise<ListSiteAuditLogsResponse> {
    const siteId = await this.assertSiteOwnership(request.context, request.siteId)
    const logs = await this.repository.listSiteAuditLogs({
      siteId,
      tenantId: nullable(request.context?.tenantId) ?? undefined
    })
    return {
      auditLogs: (logs as any[]).map((log) => ({
        auditId: log.auditId ?? log.eventId,
        siteId: log.siteId ?? siteId,
        operation: log.operation ?? log.eventType,
        resourceType: log.resourceType,
        resourceId: log.resourceId ?? '',
        operatorId: log.operatorId ?? '',
        result: log.result,
        reason: log.reason ?? '',
        traceId: log.traceId ?? '',
        occurredAt: formatDate(log.occurredAt)
      }))
    }
  }

  /** now returns the injectable clock for deterministic tests and audit timestamps. */
  private now(): Date {
    return this.options.now?.() ?? new Date()
  }

  /** id returns a prefixed application identifier. */
  private id(prefix: string): string {
    return this.options.randomId?.(prefix) ?? `${prefix}_${randomUUID()}`
  }

  /** persistSiteCredential stores new secret material only after the caller has authorized its Site. */
  private async persistSiteCredential(input: {
    siteId: string
    operatorId: string
    scopes: string[]
  }) {
    const clientSecret = this.secret()
    const credentialId = this.id('cred')
    const clientId = this.id('client')
    await this.repository.saveCredentialMetadata({
      credentialId,
      siteId: input.siteId,
      clientId,
      secretHash: createHash('sha256').update(clientSecret).digest('hex'),
      secretCiphertext: protectSecret(clientSecret),
      scopes: input.scopes,
      status: 'active',
      createdBy: input.operatorId
    })
    return { ...input, credentialId, clientId, clientSecret, createdAt: this.now() }
  }

  /** toGeneratedCredentialResponse builds the one-time credential response without exposing it to audit. */
  private toGeneratedCredentialResponse(input: {
    siteId: string
    scopes: string[]
    credentialId: string
    clientId: string
    clientSecret: string
    createdAt: Date
  }): GenerateSiteCredentialResponse {
    return {
      metadata: {
        credentialId: input.credentialId,
        clientId: input.clientId,
        status: 'active',
        scopes: input.scopes,
        createdAt: input.createdAt.toISOString()
      },
      credentialBundle: createCredentialBundle({
        siteId: input.siteId,
        clientId: input.clientId,
        credentialId: input.credentialId,
        clientSecret: input.clientSecret,
        oesBaseUrl:
          this.options.oesBaseUrl ??
          process.env.OES_SITE_API_BASE_URL ??
          'http://localhost:5771/api/v1/site',
        environment: this.options.environment ?? process.env.NODE_ENV ?? 'local'
      })
    }
  }

  /** assertSiteOwnership authenticates Admin tenant context before resolving and authorizing one Site target. */
  private async assertSiteOwnership(
    context: AdminRequestContext | undefined,
    siteId: string | undefined
  ): Promise<string> {
    const tenantId = this.requireAdminTenantContext(context)
    return this.assertSiteOwnershipForTenant(tenantId, siteId)
  }

  /** assertSiteOwnershipForTenant resolves one Site only after its Admin tenant context is validated. */
  private async assertSiteOwnershipForTenant(
    tenantId: string,
    siteId: string | undefined
  ): Promise<string> {
    const normalizedSiteId = required(siteId, 'siteId')
    const ownerTenantId = await this.repository.findTenantIdForSite(normalizedSiteId)
    if (!ownerTenantId) {
      throw new NotFoundException('site not found')
    }
    if (ownerTenantId !== tenantId) {
      throw ExceptionFactory.application(ACCESS_DENIED)
    }
    return normalizedSiteId
  }

  /** assertContentOwnership resolves one minimal Content parent fact and binds it to the authorized Site. */
  private async assertContentOwnership(
    siteId: string,
    contentId: string | undefined
  ): Promise<{ contentId: string; contentType: string }> {
    const normalizedContentId = required(contentId, 'contentId')
    const ownership = await this.repository.findContentOwnership(normalizedContentId)
    if (!ownership) {
      throw new NotFoundException('content not found')
    }
    if (ownership.siteId !== siteId) {
      throw ExceptionFactory.application(ACCESS_DENIED)
    }
    return { contentId: normalizedContentId, contentType: ownership.contentType }
  }

  /** assertCredentialOwnership resolves one credential fact and binds it to the authorized Site. */
  private async assertCredentialOwnership(
    siteId: string,
    credentialId: string | undefined
  ): Promise<string> {
    const normalizedCredentialId = required(credentialId, 'credentialId')
    const ownership = await this.repository.findCredentialOwnership(normalizedCredentialId)
    if (!ownership) {
      throw new NotFoundException('credential not found')
    }
    if (ownership.siteId !== siteId) {
      throw ExceptionFactory.application(ACCESS_DENIED)
    }
    return normalizedCredentialId
  }

  /** assertSyncOwnership resolves one sync only after complete Admin context has been validated. */
  private async assertSyncOwnership(
    tenantId: string,
    syncId: string | undefined
  ): Promise<{ syncId: string; siteId: string; tenantId: string }> {
    const normalizedSyncId = required(syncId, 'syncId')
    const ownership = await this.repository.findSyncOwnership(normalizedSyncId)
    if (!ownership) {
      throw new NotFoundException('sync not found')
    }
    if (ownership.tenantId !== tenantId) {
      throw ExceptionFactory.application(ACCESS_DENIED)
    }
    return { ...ownership, syncId: normalizedSyncId, tenantId }
  }

  /** requireCompleteAdminContext normalizes tenant and operator identity before any target lookup. */
  private requireCompleteAdminContext(
    context: AdminRequestContext | undefined
  ): AdminRequestContext & { tenantId: string; operatorId: string } {
    const tenantId = this.requireAdminTenantContext(context)
    const operatorId = context?.operatorId?.trim()
    if (!operatorId) {
      throw ExceptionFactory.application(UNAUTHENTICATED)
    }
    return { ...context, tenantId, operatorId }
  }

  /** requireAdminTenantContext validates and normalizes the tenant hard boundary before target parsing. */
  private requireAdminTenantContext(context: AdminRequestContext | undefined): string {
    const tenantId = context?.tenantId?.trim()
    if (!tenantId) {
      throw ExceptionFactory.application(UNAUTHENTICATED)
    }
    return tenantId
  }

  /** ensureSystemLocaleEnabled fails writes that reference locales outside the common fixed enum. */
  private async ensureSystemLocaleEnabled(locale: string): Promise<void> {
    if (!isSupportedSiteLocale(locale)) {
      throw new Error(`locale ${locale} is not supported`)
    }
  }

  /** ensureSiteLocaleWritable restricts site-scoped content writes to active or preparing site locales. */
  private async ensureSiteLocaleWritable(siteId: string, locale: string): Promise<void> {
    await this.ensureSystemLocaleEnabled(locale)
    const siteLocaleStatus = await this.repository.getLocaleStatus({ siteId, locale })
    if (!siteLocaleStatus) {
      throw new Error(`locale ${locale} is not configured on site ${siteId}`)
    }
    if (siteLocaleStatus !== 'active' && siteLocaleStatus !== 'preparing') {
      throw new Error(`locale ${locale} is not active or preparing on site ${siteId}`)
    }
  }

  /** secret returns a base64url HMAC secret for Site Runtime credentials. */
  private secret(): string {
    return this.options.randomSecret?.() ?? randomBytes(32).toString('base64url')
  }

  /** audit records one Admin command audit envelope through the repository. */
  private audit(input: {
    eventType: string
    tenantId: string | null
    orgId: string | null
    operatorId: string
    traceId: string | null
    resourceType: string
    resourceId: string
    details: Record<string, unknown>
  }) {
    return this.repository.saveAuditEnvelope({
      eventId: this.id('audit'),
      service: 'site-service',
      module: 'site-admin',
      eventType: input.eventType,
      occurredAt: this.now(),
      result: 'SUCCEEDED',
      operatorId: input.operatorId,
      operatorType: 'HUMAN',
      tenantId: input.tenantId,
      orgId: input.orgId,
      traceId: input.traceId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      details: input.details
    })
  }

  /** auditFromContext records an audit envelope for commands using AdminRequestContext. */
  private auditFromContext(
    context:
      | { tenantId?: string; orgId?: string; operatorId?: string; traceId?: string }
      | undefined,
    eventType: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, unknown>
  ) {
    return this.audit({
      eventType,
      tenantId: nullable(context?.tenantId),
      orgId: nullable(context?.orgId),
      operatorId: required(context?.operatorId, 'operatorId'),
      traceId: nullable(context?.traceId),
      resourceType,
      resourceId,
      details
    })
  }

  /** buildPendingPublicView maps one pending sync resource into its public runtime envelope. */
  private async buildPendingPublicView(
    siteId: string,
    publishVersion: number,
    updatedAt: Date,
    resource: Omit<PendingSyncResource, 'markedAt' | 'syncRevision'> & { expectedRevision?: number }
  ) {
    const revision = this.repository.markPendingResourceSynced
      ? { expectedRevision: resource.expectedRevision }
      : {}
    if (resource.resourceType === 'product') {
      const publication = await this.repository.getProductPublicationForPublicView({
        siteId,
        productId: resource.resourceId,
        locale: resource.locale,
        ...revision
      })
      if (!publication) {
        return null
      }
      return withSyncResourceStatus(
        buildProductPublicView({
          siteId,
          publishVersion,
          updatedAt,
          ...publication,
          facts: {
            productId: publication.productId,
            summary: publication.displayDescription,
            categoryIds: publication.categoryIds ?? [],
            images: publication.imageOverride
              ? [{ url: publication.imageOverride, alt: publication.displayTitle, role: 'primary' }]
              : []
          }
        }),
        await this.publicViewStatusForResource(siteId, resource)
      )
    }

    if (resource.resourceType === 'category') {
      const category = await this.repository.getCategoryPublicationForPublicView({
        siteId,
        categoryId: resource.resourceId,
        locale: resource.locale,
        ...revision
      })
      if (!category) {
        return null
      }
      return withSyncResourceStatus(
        buildCategoryPublicView({
          siteId,
          publishVersion,
          updatedAt,
          ...category
        }),
        await this.publicViewStatusForResource(siteId, resource)
      )
    }

    if (resource.resourceType === 'article-category') {
      const category = await this.repository.getContentCategoryLocaleVersionForPublicView({
        siteId,
        categoryId: resource.resourceId,
        locale: resource.locale,
        ...revision
      })
      if (!category) {
        return null
      }
      return withSyncResourceStatus(
        buildArticleCategoryPublicView({
          siteId,
          publishVersion,
          updatedAt,
          ...category
        }),
        await this.publicViewStatusForResource(siteId, resource)
      )
    }

    if (resource.resourceType === 'faq') {
      const categories = await this.repository.getFaqDirectoryForPublicView?.({ siteId, locale: resource.locale, ...revision })
      if (!categories) return null
      return buildFaqDirectoryPublicView({ siteId, locale: resource.locale, publishVersion, updatedAt, categories, status: categories.length > 0 ? 'published' : 'unpublished' })
    }

    if (resource.resourceType !== 'blog' && resource.resourceType !== 'news') {
      return null
    }
    const content = await this.repository.getContentVersionForPublicView({
      siteId,
      contentId: resource.resourceId,
      locale: resource.locale,
      ...revision
    })
    if (!content) {
      return null
    }
    const view =
      resource.resourceType === 'blog'
        ? buildBlogPublicView({ siteId, publishVersion, updatedAt, ...content })
        : buildNewsPublicView({ siteId, publishVersion, updatedAt, ...content })
    return withSyncResourceStatus(view, await this.publicViewStatusForResource(siteId, resource))
  }

  /** publicViewStatusForResource maps sync change intent and locale status into runtime public-view status. */
  private async publicViewStatusForResource(
    siteId: string,
    resource: Omit<PendingSyncResource, 'markedAt' | 'syncRevision'>
  ) {
    if (resource.changeType === 'locale_disable') {
      return 'disabled'
    }
    if (resource.changeType === 'unpublish') {
      return 'unpublished'
    }
    const localeStatus = await this.repository.getLocaleStatus({ siteId, locale: resource.locale })
    return localeStatus === 'disabled' ? 'disabled' : 'published'
  }

  /** recordPublishAvailableWebhook stores one frozen webhook delivery fact without exposing changed resources. */
  private async recordPublishAvailableWebhook(input: {
    syncId: string
    siteId: string
    tenantId: string
    publishVersion: number
    resent: boolean
  }): Promise<boolean> {
    const eventType = 'site.publish.available'
    if (
      !input.resent &&
      (await this.repository.hasInitialWebhookDelivery({ syncId: input.syncId, eventType }))
    ) {
      return false
    }
    const occurredAt = this.now()
    const eventId = this.id('webhook')
    const payload = {
      event_id: eventId,
      site_id: input.siteId,
      event_type: eventType,
      publish_version: input.publishVersion,
      occurred_at: occurredAt.toISOString()
    }
    const headers = {
      'x-oes-site-id': input.siteId,
      'x-oes-event-id': eventId
    }
    const dispatchConfig = await this.repository.getWebhookDispatchConfig({ siteId: input.siteId })
    let status = 'skipped'
    let failureReason: string | null = dispatchConfig?.targetUrl
      ? null
      : 'webhook targetUrl is not configured'

    if (dispatchConfig?.targetUrl && dispatchConfig.signingSecret) {
      try {
        await this.webhookPublisher.publish({
          targetUrl: dispatchConfig.targetUrl,
          signingSecret: dispatchConfig.signingSecret,
          syncId: input.syncId,
          siteId: input.siteId,
          eventId,
          eventType,
          publishVersion: input.publishVersion,
          payload,
          headers,
          resent: input.resent,
          occurredAt
        })
        status = 'dispatched'
        failureReason = null
      } catch {
        status = 'failed'
        failureReason = WEBHOOK_DISPATCH_FAILURE_REASON
      }
    } else if (dispatchConfig?.targetUrl && !dispatchConfig.signingSecret) {
      failureReason = 'webhook signingSecret is not configured'
    }

    await this.repository.recordWebhookDelivery({
      deliveryId: this.id('delivery'),
      syncId: input.syncId,
      siteId: input.siteId,
      tenantId: input.tenantId,
      eventId,
      eventType,
      publishVersion: input.publishVersion,
      targetUrl: dispatchConfig?.targetUrl ?? null,
      status,
      payload,
      headers,
      resent: input.resent,
      deliveredAt: occurredAt,
      failureReason
    })
    return status === 'dispatched'
  }
}

/** required enforces command/query inputs at the application boundary. */
function required(value: string | undefined, field: string): string {
  if (!value?.trim()) {
    throw new Error(`${field} is required`)
  }
  return value.trim()
}

/** mapDynamicSlugWriteError exposes the existing validation failure contract while retaining safe diagnostics. */
function mapDynamicSlugWriteError(error: unknown): unknown {
  if (error instanceof SiteSlugConflictError) {
    return ExceptionFactory.application(VALIDATION_FAILED, { reason: error.message })
  }
  return error
}

/** toSitePageRecord converts repository page governance rows into generated Admin read models. */
function toSitePageRecord(page: any) {
  if (!page) {
    return undefined
  }
  return {
    pageKey: page.pageKey ?? '',
    supportedLocales: page.supportedLocales ?? [],
    capabilityAvailable: page.available ?? page.capabilityAvailable ?? false,
    enabled: page.enabled ?? false,
    indexable: page.indexable ?? false,
    capabilityDrift: page.drift ?? page.capabilityDrift ?? false,
    syncStatus: page.syncStatus ?? 'synced',
    lastDiscoveredAt: formatDate(page.lastDiscoveredAt)
  }
}

/** nullable trims optional string values and stores blanks as null. */
function nullable(value?: string): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

/** uniqueStrings normalizes optional repeated id lists before policy validation and storage. */
/** toFaqCategoryVersionRecord maps persistence field names to the frozen gRPC FAQ Category locale contract. */
function toFaqCategoryVersionRecord(version: any) { return { categoryVersionId: version.categoryVersionId, categoryId: version.categoryId, locale: version.locale, title: version.title, anchorKey: version.anchorKey, sortOrder: version.sortOrder, syncStatus: version.syncStatus } }
/** toFaqCategoryRecord maps a site-owned FAQ Category and its locale versions to the Admin read model. */
function toFaqCategoryRecord(category: any) { return { categoryId: category.categoryId, siteId: category.siteId, status: category.status, syncStatus: category.syncStatus, localeVersions: (category.versions ?? category.localeVersions ?? []).map(toFaqCategoryVersionRecord) } }
/** toFaqEntryVersionRecord maps persistence field names to the frozen gRPC FAQ Entry locale contract. */
function toFaqEntryVersionRecord(version: any) { return { entryVersionId: version.entryVersionId, entryId: version.entryId, locale: version.locale, question: version.question, answerHtml: version.answerHtml, sortOrder: version.sortOrder, syncStatus: version.syncStatus } }
/** toFaqEntryRecord maps a one-Category FAQ Entry and its locale versions to the Admin read model. */
function toFaqEntryRecord(entry: any) { return { entryId: entry.entryId, siteId: entry.siteId, categoryId: entry.categoryId, status: entry.status, syncStatus: entry.syncStatus, localeVersions: (entry.versions ?? entry.localeVersions ?? []).map(toFaqEntryVersionRecord) } }
function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

/** requirePreviewResourceType restricts Admin preview token issuance to P1 preview-capable resource types. */
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

/** assertPreviewResourceOwnership rejects missing, mismatched, foreign, or locale-incomplete preview targets. */
function assertPreviewResourceOwnership(
  ownership: {
    siteId: string
    resourceType: string
    localeMatched: boolean
  } | null,
  siteId: string,
  resourceType: 'product' | 'blog' | 'news'
): void {
  if (!ownership || ownership.resourceType !== resourceType) {
    throw new NotFoundException('preview resource not found')
  }
  if (ownership.siteId !== siteId) {
    throw ExceptionFactory.application(ACCESS_DENIED)
  }
  if (!ownership.localeMatched) {
    throw new NotFoundException('preview resource not found')
  }
}

/** requireCategoryAppliesTo restricts Category applicability to the P1 Blog/News vocabulary. */

/** siteCodeFromName derives a stable P1 site code from the display name. */
function siteCodeFromName(siteName: string): string {
  return siteName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** protectSecret keeps plaintext out of persistence while leaving room for managed encryption. */
function protectSecret(secret: string): string {
  return Buffer.from(JSON.stringify({ alg: 'local-dev-v1', secret }), 'utf8').toString('base64url')
}

/** slugFromParts creates a conservative URL slug for P1 product defaults. */
function slugFromParts(parts: string[]): string {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** titleFromProductId creates a safe display title when Product Master public fields are not available. */
function titleFromProductId(productId: string): string {
  return productId
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

/** formatDate serializes Date-like read model values for generated gRPC DTOs. */
function formatDate(value: unknown): string {
  return value instanceof Date ? value.toISOString() : typeof value === 'string' ? value : ''
}

/** withSyncResourceStatus returns one public-view envelope with the status required by the sync change. */
function withSyncResourceStatus<TView extends { status: string }>(
  view: TView,
  status: string
): TView {
  return {
    ...view,
    status
  }
}
