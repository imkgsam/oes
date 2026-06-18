import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import {
  CreateSiteRequest,
  CreateSiteResponse,
  CreateSiteContentRequest,
  CreateSiteContentResponse,
  DisableLocaleRequest,
  DisableLocaleResponse,
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
  SyncAllPendingChangesResponse
  ,
  RevokeSiteCredentialRequest,
  RevokeSiteCredentialResponse,
  RotateSiteCredentialRequest,
  RotateSiteCredentialResponse,
  UpdateSiteContentLocaleVersionRequest,
  UpdateSiteContentLocaleVersionResponse
} from '@oes/common/generated/site_service'
import { buildBlogPublicView, buildCategoryPublicView, buildNewsPublicView, buildProductPublicView } from '../../domain/public-view/public-view-builders'
import { issuePreviewToken as issueBoundPreviewToken } from '../../domain/preview/preview-token'
import { createCredentialBundle } from '../../domain/security/site-request-signing'
import { createSyncBatchPlan, PendingSyncResource } from '../../domain/sync/sync-batch-planner'
import { NoopSiteWebhookPublisher } from '../ports/site-webhook-publisher.port'
import type { SiteWebhookPublisher } from '../ports/site-webhook-publisher.port'

export interface SiteAdminApplicationRepository {
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
    author: string | null
    tags: string[]
    seoTitle: string
    seoDescription: string
    seoImage: string | null
    publishedAt: Date | null
    status: string
    syncStatus: string
  }): Promise<unknown>
  getSitePublishStateForSync(siteId: string): Promise<{ tenantId: string; currentPublishVersion: number }>
  listPendingSyncResources(siteId: string): Promise<PendingSyncResource[]>
  getContentVersionForPublicView(input: { contentId: string; locale: string }): Promise<{
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
    resources: Array<{ resourceType: string; resourceId: string; locale: string; changeType: string }>
  }): Promise<void>
  markContentVersionSynced(input: { contentId: string; locale: string }): Promise<void>
  markProductPublicationSynced(input: { siteId: string; productId: string; locale: string }): Promise<void>
  markCategoryPublicationSynced(input: { siteId: string; categoryId: string; locale: string }): Promise<void>
  revokeSiteCredential(input: { siteId: string; credentialId: string; revokedAt: Date }): Promise<void>
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
  checkLocaleCompleteness(input: { siteId: string; locale: string }): Promise<{ complete: boolean; issues: string[] }>
  activateLocale(input: { siteId: string; locale: string }): Promise<void>
  disableLocale(input: { siteId: string; locale: string }): Promise<void>
  markLocaleResourcesPending(input: { siteId: string; locale: string }): Promise<void>
  getLocaleStatus(input: { siteId: string; locale: string }): Promise<string | null>
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
  unpublishSiteCategory(input: { siteId: string; categoryId: string; locale: string }): Promise<void>
  getCategoryPublicationForPublicView(input: { siteId: string; categoryId: string; locale: string }): Promise<{
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
  searchProductMasterForAdd(input: { siteId: string; keyword?: string; page: number; pageSize: number }): Promise<{ candidates: unknown[]; total: number }>
  getSiteProductPublication(input: { siteId: string; publicationId: string }): Promise<unknown | null>
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
  getProductPublicationForPublicView(input: { siteId: string; productId: string; locale: string }): Promise<{
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
  unpublishSiteContent(input: { siteId: string; contentId: string; locale: string }): Promise<void>
  getPendingSyncSummary(input: { siteId: string }): Promise<{ pendingCount: number; resourceTypes: string[] }>
  listSyncHistory(input: { siteId: string }): Promise<unknown[]>
  getSyncDetail(input: { syncId: string }): Promise<unknown | null>
  getLastSyncBatch(input: { siteId: string }): Promise<{ syncId: string; publishVersion: number } | null>
  hasInitialWebhookDelivery(input: { syncId: string; eventType: string }): Promise<boolean>
  getWebhookDispatchConfig(input: { siteId: string }): Promise<{ targetUrl: string | null; signingSecret: string | null } | null>
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
  now?: () => Date
  randomId?: (prefix: string) => string
  randomSecret?: () => string
  oesBaseUrl?: string
  environment?: string
}

const DEFAULT_CREDENTIAL_SCOPES = ['site:read', 'site:sync', 'site:preview', 'site:status']

/** SiteAdminApplicationService orchestrates Admin Site Management commands and queries behind the gRPC adapter. */
@Injectable()
export class SiteAdminApplicationService {
  constructor(
    @Inject(SITE_ADMIN_APPLICATION_REPOSITORY)
    private readonly repository: SiteAdminApplicationRepository,
    private readonly options: SiteAdminApplicationOptions = {},
    private readonly webhookPublisher: SiteWebhookPublisher = new NoopSiteWebhookPublisher()
  ) {}

  /** listSiteCards returns the tenant-scoped card workspace read model. */
  async listSiteCards(request: ListSiteCardsRequest): Promise<ListSiteCardsResponse> {
    return { cards: (await this.repository.listSiteCards(required(request.tenantId, 'tenantId'))) as any }
  }

  /** createSite creates a draft site with one active default locale and records audit. */
  async createSite(request: CreateSiteRequest): Promise<CreateSiteResponse> {
    const siteId = this.id('site')
    const tenantId = required(request.tenantId, 'tenantId')
    const operatorId = required(request.operatorId, 'operatorId')

    await this.repository.createSiteWithDefaultLocale({
      siteId,
      tenantId,
      siteCode: siteCodeFromName(required(request.siteName, 'siteName')),
      siteName: required(request.siteName, 'siteName'),
      siteType: required(request.siteType, 'siteType'),
      defaultLocale: required(request.defaultLocale, 'defaultLocale'),
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

    return { siteId, status: 'draft', defaultLocale: request.defaultLocale }
  }

  /** generateSiteCredential creates one scoped credential and returns the secret bundle once. */
  async generateSiteCredential(request: GenerateSiteCredentialRequest): Promise<GenerateSiteCredentialResponse> {
    const siteId = required(request.siteId, 'siteId')
    const operatorId = required(request.context?.operatorId, 'operatorId')
    const scopes = request.scopes?.length ? request.scopes : DEFAULT_CREDENTIAL_SCOPES
    const clientSecret = this.secret()
    const credentialId = this.id('cred')
    const clientId = this.id('client')

    await this.repository.saveCredentialMetadata({
      credentialId,
      siteId,
      clientId,
      secretHash: createHash('sha256').update(clientSecret).digest('hex'),
      secretCiphertext: protectSecret(clientSecret),
      scopes,
      status: 'active',
      createdBy: operatorId
    })
    await this.audit({
      eventType: 'site_credential.generated',
      tenantId: nullable(request.context?.tenantId),
      orgId: nullable(request.context?.orgId),
      operatorId,
      traceId: nullable(request.context?.traceId),
      resourceType: 'site_credential',
      resourceId: credentialId,
      details: { siteId, scopes }
    })

    return {
      metadata: {
        credentialId,
        clientId,
        status: 'active',
        scopes,
        createdAt: this.now().toISOString()
      },
      credentialBundle: createCredentialBundle({
        siteId,
        clientId,
        credentialId,
        clientSecret,
        oesBaseUrl: this.options.oesBaseUrl ?? process.env.OES_SITE_API_BASE_URL ?? 'http://localhost:5771/api/v1/site',
        environment: this.options.environment ?? process.env.NODE_ENV ?? 'local'
      })
    }
  }

  /** listSiteCredentials returns credential metadata and never returns secret material or one-time bundles. */
  async listSiteCredentials(request: ListSiteCredentialsRequest): Promise<ListSiteCredentialsResponse> {
    const credentials = await this.repository.listSiteCredentials({ siteId: required(request.siteId, 'siteId') })
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
  async syncAllPendingChanges(request: SyncAllPendingChangesRequest): Promise<SyncAllPendingChangesResponse> {
    const siteId = required(request.siteId, 'siteId')
    const operatorId = required(request.context?.operatorId, 'operatorId')
    const state = await this.repository.getSitePublishStateForSync(siteId)
    const pendingResources = await this.repository.listPendingSyncResources(siteId)
    const plan = createSyncBatchPlan({
      siteId,
      currentPublishVersion: state.currentPublishVersion,
      pendingResources
    })

    if (!plan) {
      return { syncId: '', publishVersion: state.currentPublishVersion, webhookDispatched: false }
    }

    const syncId = this.id('sync')
    const updatedAt = this.now()
    for (const resource of plan.resources) {
      const view = await this.buildPendingPublicView(siteId, plan.publishVersion, updatedAt, resource)
      if (!view) {
        continue
      }
      await this.repository.upsertPublicView({
        siteId,
        tenantId: state.tenantId,
        resourceType: view.resource_type,
        resourceId: view.resource_id,
        locale: view.locale,
        slug: view.slug,
        status: view.status,
        publishVersion: view.publish_version,
        payload: view.payload,
        updatedAt
      })
      if (resource.resourceType === 'product') {
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
      } else {
        await this.repository.markContentVersionSynced({ contentId: resource.resourceId, locale: resource.locale })
      }
    }

    await this.repository.createSyncBatch({
      syncId,
      siteId,
      tenantId: state.tenantId,
      publishVersion: plan.publishVersion,
      status: 'completed',
      triggeredBy: operatorId,
      resources: plan.resources
    })
    const webhookDispatched = await this.recordPublishAvailableWebhook({
      syncId,
      siteId,
      tenantId: state.tenantId,
      publishVersion: plan.publishVersion,
      resent: false
    })

    return { syncId, publishVersion: plan.publishVersion, webhookDispatched }
  }

  /** issuePreviewToken creates a short-lived resource-bound preview token without embedding draft content. */
  async issuePreviewToken(request: IssuePreviewTokenRequest): Promise<IssuePreviewTokenResponse> {
    const resourceType = requirePreviewResourceType(request.resourceType)
    const issued = issueBoundPreviewToken({
      secret: process.env.SITE_PREVIEW_TOKEN_SECRET ?? 'site-service-local-preview-secret',
      now: this.now(),
      siteId: required(request.siteId, 'siteId'),
      resourceType,
      resourceId: required(request.resourceId, 'resourceId'),
      locale: required(request.locale, 'locale'),
      operatorId: required(request.context?.operatorId, 'operatorId')
    })
    const previewBaseUrl = process.env.SITE_PREVIEW_BASE_URL ?? 'https://preview.local/oes-preview'

    return {
      previewToken: issued.token,
      previewUrl: `${previewBaseUrl}?preview_token=${encodeURIComponent(issued.token)}`,
      expiresAt: issued.expiresAt.toISOString()
    }
  }

  /** updateSiteSettings is the Admin settings command boundary for the site-service owner. */
  async updateSiteSettings(request: UpdateSiteSettingsRequest): Promise<UpdateSiteSettingsResponse> {
    await this.repository.updateSiteSettings({
      siteId: required(request.siteId, 'siteId'),
      siteName: nullable(request.siteName),
      primaryDomain: nullable(request.primaryDomain),
      previewBaseUrl: nullable(request.previewBaseUrl),
      webhookUrl: nullable(request.webhookUrl),
      runtimeStatusUrl: nullable(request.runtimeStatusUrl),
      allowedOrigins: request.allowedOrigins ?? []
    })
    await this.auditFromContext(request.context, 'site.settings_updated', 'site', request.siteId, { siteId: request.siteId })
    return { updated: true }
  }

  /** disableSite is the Admin lifecycle command boundary for disabling a site. */
  async disableSite(request: DisableSiteRequest): Promise<DisableSiteResponse> {
    const siteId = required(request.siteId, 'siteId')
    await this.repository.disableSite({ siteId, disabledAt: this.now(), reason: nullable(request.reason) })
    await this.auditFromContext(request.context, 'site.disabled', 'site', siteId, { siteId, reason: nullable(request.reason) })
    return { disabled: true }
  }

  /** addPreparingLocale is the Admin locale command boundary for preparing a new locale. */
  async addPreparingLocale(request: AddPreparingLocaleRequest): Promise<AddPreparingLocaleResponse> {
    const siteId = required(request.siteId, 'siteId')
    const locale = required(request.locale, 'locale')
    await this.repository.addPreparingLocale({ siteId, locale })
    await this.auditFromContext(request.context, 'site_locale.added', 'site_locale', `${siteId}:${locale}`, { siteId, locale })
    return { added: true }
  }

  /** checkLocaleCompleteness is the Admin locale query boundary before activation. */
  async checkLocaleCompleteness(request: CheckLocaleCompletenessRequest): Promise<CheckLocaleCompletenessResponse> {
    return this.repository.checkLocaleCompleteness({
      siteId: required(request.siteId, 'siteId'),
      locale: required(request.locale, 'locale')
    })
  }

  /** activateLocale is the Admin locale lifecycle boundary for publishing a prepared locale. */
  async activateLocale(request: ActivateLocaleRequest): Promise<ActivateLocaleResponse> {
    const siteId = required(request.siteId, 'siteId')
    const locale = required(request.locale, 'locale')
    const completeness = await this.repository.checkLocaleCompleteness({ siteId, locale })
    if (!completeness.complete) {
      throw new Error(`locale is incomplete: ${completeness.issues.join(', ')}`)
    }
    await this.repository.activateLocale({ siteId, locale })
    await this.auditFromContext(request.context, 'site_locale.activated', 'site_locale', `${siteId}:${locale}`, { siteId, locale })
    return { activated: true }
  }

  /** disableLocale is the Admin locale lifecycle boundary for hiding a locale. */
  async disableLocale(request: DisableLocaleRequest): Promise<DisableLocaleResponse> {
    const siteId = required(request.siteId, 'siteId')
    const locale = required(request.locale, 'locale')
    await this.repository.disableLocale({ siteId, locale })
    await this.repository.markLocaleResourcesPending({ siteId, locale })
    await this.auditFromContext(request.context, 'site_locale.disabled', 'site_locale', `${siteId}:${locale}`, { siteId, locale })
    return { disabled: true }
  }

  /** listSiteCategories is the Admin category projection query boundary. */
  async listSiteCategories(request: { siteId?: string; locale?: string }): Promise<{ categories: any[] }> {
    return {
      categories: (await this.repository.listSiteCategories({
        siteId: required(request.siteId, 'siteId'),
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
    const siteId = required(request.siteId, 'siteId')
    const category = await this.repository.createSiteCategory({
      categoryId: this.id('category'),
      siteId,
      tenantId: required(request.context?.tenantId, 'tenantId'),
      parentCategoryId: nullable(request.parentCategoryId),
      sourceCategoryId: nullable(request.sourceCategoryId),
      locale: required(request.locale, 'locale'),
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
    await this.auditFromContext(request.context, 'site_category.created', 'site_category', (category as any).categoryId ?? siteId, {
      siteId,
      categoryId: (category as any).categoryId
    })
    return { category: category as any }
  }

  /** updateSiteCategory updates a site-owned category projection and marks it pending sync. */
  async updateSiteCategory(request: {
    context?: { tenantId?: string; orgId?: string; operatorId?: string; traceId?: string }
    siteId?: string
    category?: any
  }): Promise<{ category: any }> {
    const category = request.category
    if (!category) {
      throw new Error('category is required')
    }
    const updated = await this.repository.updateSiteCategory({
      categoryId: required(category.categoryId, 'categoryId'),
      siteId: required(request.siteId ?? category.siteId, 'siteId'),
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
    await this.auditFromContext(request.context, 'site_category.updated', 'site_category', category.categoryId, {
      siteId: request.siteId ?? category.siteId,
      categoryId: category.categoryId
    })
    return { category: updated as any }
  }

  /** unpublishSiteCategory marks one site category projection unpublished for explicit sync. */
  async unpublishSiteCategory(request: {
    context?: { tenantId?: string; orgId?: string; operatorId?: string; traceId?: string }
    siteId?: string
    categoryId?: string
    locale?: string
  }): Promise<{ unpublished: boolean }> {
    const siteId = required(request.siteId, 'siteId')
    const categoryId = required(request.categoryId, 'categoryId')
    const locale = required(request.locale, 'locale')
    await this.repository.unpublishSiteCategory({ siteId, categoryId, locale })
    await this.auditFromContext(request.context, 'site_category.unpublished', 'site_category', categoryId, { siteId, categoryId, locale })
    return { unpublished: true }
  }

  /** listSiteProducts is the Admin product publication query boundary. */
  async listSiteProducts(request: ListSiteProductsRequest): Promise<ListSiteProductsResponse> {
    return {
      products: (await this.repository.listSiteProducts({
        siteId: required(request.siteId, 'siteId'),
        locale: nullable(request.locale) ?? undefined
      })) as any
    }
  }

  /** searchProductMasterForAdd is the anti-corruption query boundary for Product Master candidates. */
  async searchProductMasterForAdd(request: SearchProductMasterForAddRequest): Promise<SearchProductMasterForAddResponse> {
    return this.repository.searchProductMasterForAdd({
      siteId: required(request.siteId, 'siteId'),
      keyword: nullable(request.keyword) ?? undefined,
      page: request.page || 1,
      pageSize: request.pageSize || 20
    }) as Promise<SearchProductMasterForAddResponse>
  }

  /** getSiteProductPublication is the Admin product publication detail query boundary. */
  async getSiteProductPublication(request: GetSiteProductPublicationRequest): Promise<GetSiteProductPublicationResponse> {
    return {
      publication: (await this.repository.getSiteProductPublication({
        siteId: required(request.siteId, 'siteId'),
        publicationId: required(request.publicationId, 'publicationId')
      })) as any
    }
  }

  /** addProductsToSite is the Admin command boundary for adding Product Master refs to a site. */
  async addProductsToSite(request: AddProductsToSiteRequest): Promise<AddProductsToSiteResponse> {
    const siteId = required(request.siteId, 'siteId')
    const tenantId = required(request.context?.tenantId, 'tenantId')
    const productIds = request.productIds ?? []
    const locales = request.locales ?? []
    const publications = []

    for (const productId of productIds) {
      for (const locale of locales) {
        const title = titleFromProductId(productId)
        publications.push(await this.repository.addProductPublication({
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
        }))
      }
    }
    await this.auditFromContext(request.context, 'site_product.added', 'site_product_publication', siteId, {
      siteId,
      productIds,
      locales
    })
    return { publications: publications as any }
  }

  /** updateSiteProductPublication is the Admin command boundary for site-owned product display config. */
  async updateSiteProductPublication(request: UpdateSiteProductPublicationRequest): Promise<UpdateSiteProductPublicationResponse> {
    const publication = request.publication
    if (!publication) {
      throw new Error('publication is required')
    }
    const updated = await this.repository.updateSiteProductPublication({
      publicationId: required(publication.publicationId, 'publicationId'),
      siteId: required(publication.siteId, 'siteId'),
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
    await this.auditFromContext(request.context, 'site_product.updated', 'site_product_publication', publication.publicationId, {
      siteId: publication.siteId,
      publicationId: publication.publicationId
    })
    return { publication: updated as any }
  }

  /** unpublishSiteProduct is the Admin command boundary for product unpublish state changes. */
  async unpublishSiteProduct(request: UnpublishSiteProductRequest): Promise<UnpublishSiteProductResponse> {
    const siteId = required(request.siteId, 'siteId')
    const publicationId = required(request.publicationId, 'publicationId')
    await this.repository.unpublishSiteProduct({ siteId, publicationId })
    await this.auditFromContext(request.context, 'site_product.unpublished', 'site_product_publication', publicationId, {
      siteId,
      publicationId
    })
    return { unpublished: true }
  }

  /** listSiteContents is the Admin Blog/News list query boundary. */
  async listSiteContents(request: ListSiteContentsRequest): Promise<ListSiteContentsResponse> {
    return {
      contents: (await this.repository.listSiteContents({
        siteId: required(request.siteId, 'siteId'),
        contentType: nullable(request.contentType) ?? undefined
      })) as any
    }
  }

  /** getSiteContent is the Admin Blog/News detail query boundary. */
  async getSiteContent(request: GetSiteContentRequest): Promise<GetSiteContentResponse> {
    return {
      content: (await this.repository.getSiteContent({
        siteId: required(request.siteId, 'siteId'),
        contentId: required(request.contentId, 'contentId')
      })) as any
    }
  }

  /** createSiteContent creates the site-scoped Blog/News container before locale drafts are saved. */
  async createSiteContent(request: CreateSiteContentRequest): Promise<CreateSiteContentResponse> {
    const content = await this.repository.createContentEntry({
      contentId: this.id('content'),
      siteId: required(request.siteId, 'siteId'),
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
    const version = request.version
    if (!version) {
      throw new Error('version is required')
    }
    const saved = await this.repository.updateContentLocaleVersion({
      contentVersionId: version.contentVersionId || this.id('version'),
      contentId: required(version.contentId, 'contentId'),
      siteId: required(request.siteId, 'siteId'),
      tenantId: required(request.context?.tenantId, 'tenantId'),
      locale: required(version.locale, 'locale'),
      slug: required(version.slug, 'slug'),
      title: required(version.title, 'title'),
      bodyHtml: required(version.bodyHtml, 'bodyHtml'),
      summary: nullable(version.summary),
      coverImage: nullable(version.coverImage),
      author: nullable(version.author),
      tags: version.tags ?? [],
      seoTitle: required(version.seoTitle, 'seoTitle'),
      seoDescription: required(version.seoDescription, 'seoDescription'),
      seoImage: nullable(version.seoImage),
      publishedAt: version.publishedAt ? new Date(version.publishedAt) : null,
      status: version.status || 'draft',
      syncStatus: 'pending'
    })

    return { version: saved as any }
  }

  /** unpublishSiteContent is the Admin Blog/News unpublish command boundary. */
  async unpublishSiteContent(request: UnpublishSiteContentRequest): Promise<{ unpublished: boolean }> {
    const siteId = required(request.siteId, 'siteId')
    const contentId = required(request.contentId, 'contentId')
    const locale = required(request.locale, 'locale')
    await this.repository.unpublishSiteContent({ siteId, contentId, locale })
    await this.auditFromContext(request.context, 'site_content.unpublished', 'site_content', contentId, { siteId, contentId, locale })
    return { unpublished: true }
  }

  /** getPendingSyncSummary is the Admin sync summary query boundary. */
  async getPendingSyncSummary(request: GetPendingSyncSummaryRequest): Promise<GetPendingSyncSummaryResponse> {
    return this.repository.getPendingSyncSummary({ siteId: required(request.siteId, 'siteId') })
  }

  /** listPendingSyncResources is the Admin pending sync resource query boundary. */
  async listPendingSyncResources(request: ListPendingSyncResourcesRequest): Promise<ListPendingSyncResourcesResponse> {
    return { resources: (await this.repository.listPendingSyncResources(required(request.siteId, 'siteId'))) as any }
  }

  /** listSyncHistory is the Admin sync history query boundary. */
  async listSyncHistory(request: ListSyncHistoryRequest): Promise<ListSyncHistoryResponse> {
    return { batches: (await this.repository.listSyncHistory({ siteId: required(request.siteId, 'siteId') })) as any }
  }

  /** getSyncDetail is the Admin sync detail query boundary. */
  async getSyncDetail(request: GetSyncDetailRequest): Promise<GetSyncDetailResponse> {
    return { batch: (await this.repository.getSyncDetail({ syncId: required(request.syncId, 'syncId') })) as any }
  }

  /** retryLastSync is the Admin sync retry command boundary. */
  async retryLastSync(request: RetryLastSyncRequest): Promise<RetryLastSyncResponse> {
    const last = await this.repository.getLastSyncBatch({ siteId: required(request.siteId, 'siteId') })
    if (!last) {
      return { syncId: '', publishVersion: 0 }
    }
    await this.recordPublishAvailableWebhook({
      syncId: last.syncId,
      siteId: request.siteId,
      tenantId: required(request.context?.tenantId, 'tenantId'),
      publishVersion: last.publishVersion,
      resent: true
    })
    await this.auditFromContext(request.context, 'site_sync.retried', 'site_sync_batch', last.syncId, {
      siteId: request.siteId,
      publishVersion: last.publishVersion
    })
    return { syncId: last.syncId, publishVersion: last.publishVersion }
  }

  /** resendWebhook is the Admin webhook resend command boundary that must not create a new version. */
  async resendWebhook(request: ResendWebhookRequest): Promise<ResendWebhookResponse> {
    const syncId = required(request.syncId, 'syncId')
    const sync = await this.repository.getSyncDetail({ syncId })
    const syncRecord = sync as { siteId?: string; publishVersion?: number } | null
    await this.recordPublishAvailableWebhook({
      syncId,
      siteId: required(syncRecord?.siteId, 'siteId'),
      tenantId: required(request.context?.tenantId, 'tenantId'),
      publishVersion: syncRecord?.publishVersion ?? 0,
      resent: true
    })
    await this.auditFromContext(request.context, 'site_webhook.resent', 'site_sync_batch', syncId, { syncId })
    return { resent: true }
  }

  /** rotateSiteCredential creates replacement credential material and revokes the previous credential id. */
  async rotateSiteCredential(request: RotateSiteCredentialRequest): Promise<RotateSiteCredentialResponse> {
    const rotated = await this.generateSiteCredential({
      context: request.context,
      siteId: request.siteId,
      scopes: DEFAULT_CREDENTIAL_SCOPES
    })
    if (request.credentialId && request.siteId) {
      await this.repository.revokeSiteCredential({
        siteId: request.siteId,
        credentialId: request.credentialId,
        revokedAt: this.now()
      })
    }
    return rotated
  }

  /** revokeSiteCredential revokes one credential so future signed requests fail closed. */
  async revokeSiteCredential(request: RevokeSiteCredentialRequest): Promise<RevokeSiteCredentialResponse> {
    await this.repository.revokeSiteCredential({
      siteId: required(request.siteId, 'siteId'),
      credentialId: required(request.credentialId, 'credentialId'),
      revokedAt: this.now()
    })

    return { revoked: true }
  }

  /** listSiteAuditLogs is the Admin audit query boundary. */
  async listSiteAuditLogs(request: ListSiteAuditLogsRequest): Promise<ListSiteAuditLogsResponse> {
    const logs = await this.repository.listSiteAuditLogs({
      siteId: required(request.siteId, 'siteId'),
      tenantId: nullable(request.context?.tenantId) ?? undefined
    })
    return {
      auditLogs: (logs as any[]).map((log) => ({
        auditId: log.auditId ?? log.eventId,
        siteId: log.siteId ?? request.siteId,
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
    context: { tenantId?: string; orgId?: string; operatorId?: string; traceId?: string } | undefined,
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
    resource: Omit<PendingSyncResource, 'markedAt'>
  ) {
    if (resource.resourceType === 'product') {
      const publication = await this.repository.getProductPublicationForPublicView({
        siteId,
        productId: resource.resourceId,
        locale: resource.locale
      })
      if (!publication) {
        return null
      }
      return withSyncResourceStatus(buildProductPublicView({
        siteId,
        publishVersion,
        updatedAt,
        ...publication,
        facts: {
            productId: publication.productId,
            summary: publication.displayDescription,
            categoryIds: publication.categoryIds ?? [],
            images: publication.imageOverride ? [{ url: publication.imageOverride, alt: publication.displayTitle, role: 'primary' }] : []
          }
      }), await this.publicViewStatusForResource(siteId, resource))
    }

    if (resource.resourceType === 'category') {
      const category = await this.repository.getCategoryPublicationForPublicView({
        siteId,
        categoryId: resource.resourceId,
        locale: resource.locale
      })
      if (!category) {
        return null
      }
      return withSyncResourceStatus(buildCategoryPublicView({
        siteId,
        publishVersion,
        updatedAt,
        ...category
      }), await this.publicViewStatusForResource(siteId, resource))
    }

    if (resource.resourceType !== 'blog' && resource.resourceType !== 'news') {
      return null
    }
    const content = await this.repository.getContentVersionForPublicView({
      contentId: resource.resourceId,
      locale: resource.locale
    })
    if (!content) {
      return null
    }
    const view = resource.resourceType === 'blog'
      ? buildBlogPublicView({ siteId, publishVersion, updatedAt, ...content })
      : buildNewsPublicView({ siteId, publishVersion, updatedAt, ...content })
    return withSyncResourceStatus(view, await this.publicViewStatusForResource(siteId, resource))
  }

  /** publicViewStatusForResource maps sync change intent and locale status into runtime public-view status. */
  private async publicViewStatusForResource(siteId: string, resource: Omit<PendingSyncResource, 'markedAt'>) {
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
    if (!input.resent && await this.repository.hasInitialWebhookDelivery({ syncId: input.syncId, eventType })) {
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
    let failureReason: string | null = dispatchConfig?.targetUrl ? null : 'webhook targetUrl is not configured'

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
      } catch (error) {
        status = 'failed'
        failureReason = error instanceof Error ? error.message : String(error)
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

/** nullable trims optional string values and stores blanks as null. */
function nullable(value?: string): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

/** requirePreviewResourceType restricts Admin preview token issuance to P1 preview-capable resource types. */
function requirePreviewResourceType(value: string | undefined): 'product' | 'blog' | 'news' {
  const resourceType = required(value, 'resourceType')
  if (resourceType !== 'product' && resourceType !== 'blog' && resourceType !== 'news') {
    throw new Error('resourceType is unsupported')
  }
  return resourceType
}

/** siteCodeFromName derives a stable P1 site code from the display name. */
function siteCodeFromName(siteName: string): string {
  return siteName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** protectSecret keeps plaintext out of persistence while leaving room for managed encryption. */
function protectSecret(secret: string): string {
  return Buffer.from(JSON.stringify({ alg: 'local-dev-v1', secret }), 'utf8').toString('base64url')
}

/** slugFromParts creates a conservative URL slug for P1 product defaults. */
function slugFromParts(parts: string[]): string {
  return parts.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** titleFromProductId creates a safe display title when Product Master public fields are not available. */
function titleFromProductId(productId: string): string {
  return productId.trim().replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

/** formatDate serializes Date-like read model values for generated gRPC DTOs. */
function formatDate(value: unknown): string {
  return value instanceof Date ? value.toISOString() : typeof value === 'string' ? value : ''
}

/** withSyncResourceStatus returns one public-view envelope with the status required by the sync change. */
function withSyncResourceStatus<TView extends { status: string }>(view: TView, status: string): TView {
  return {
    ...view,
    status
  }
}
