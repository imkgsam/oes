import { requestClient } from '#/api/request'

export namespace SiteManagementApi {
  export interface SiteCard {
    siteId: string
    siteName: string
    siteType: string
    primaryDomain?: string
    brandId?: string
    regionCode?: string
    channelCode?: string
    status: 'draft' | 'active' | 'disabled' | string
    activeLocales?: string[]
    preparingLocales?: string[]
    runtimeStatus?: 'healthy' | 'degraded' | 'blocked' | 'failed' | 'unknown' | string
    pendingSyncCount?: number
    latestPublishVersion?: number
    runtimePublishVersion?: number
    lastSyncAt?: string
    lastErrorSummary?: string
  }

  export interface ListSiteCardsResult {
    cards: SiteCard[]
  }

  export interface CreateSitePayload {
    siteName: string
    siteType: string
    defaultLocale: string
    primaryDomain?: string
    previewBaseUrl?: string
  }

  export interface CreateSiteResult {
    siteId: string
    status: string
    defaultLocale: string
  }

  export interface SiteCredentialMetadata {
    credentialId: string
    clientId: string
    status: string
    scopes: string[]
    createdAt: string
    lastUsedAt?: string
    revokedAt?: string
  }

  export interface SiteCategory {
    categoryId: string
    siteId: string
    parentCategoryId?: string
    sourceCategoryId?: string
    locale: string
    slug: string
    displayTitle: string
    description?: string
    image?: string
    sortOrder?: number
    seoTitle: string
    seoDescription?: string
    seoImage?: string
    publishStatus: string
    syncStatus: string
  }

  export interface SiteProductPublication {
    publicationId: string
    siteId?: string
    productId: string
    locale: string
    slug: string
    displayTitle: string
    displayDescription?: string
    seoTitle?: string
    seoDescription?: string
    seoImage?: string
    imageOverride?: string
    categoryIds?: string[]
    publishStatus: string
    syncStatus: string
  }

  export interface ProductMasterCandidate {
    productId: string
    displayName: string
    model?: string
    brand?: string
    categoryIds?: string[]
  }

  export interface SearchProductMasterForAddResult {
    candidates?: ProductMasterCandidate[]
    total?: number
  }

  export interface PendingSyncSummary {
    totalPending?: number
    byResourceType?: Record<string, number>
  }

  export interface PendingSyncResource {
    resourceType: string
    resourceId: string
    locale?: string
    changeType?: string
  }

  export interface SyncBatch {
    syncId: string
    status: string
    publishVersion?: number
    createdAt?: string
    resources?: PendingSyncResource[]
  }

  export interface SiteAuditLog {
    auditLogId: string
    action: string
    createdAt?: string
    actorId?: string
    resourceType?: string
    resourceId?: string
  }

  export interface SiteContentLocaleVersion {
    locale: string
    slug?: string
    title?: string
    summary?: string
    status?: string
  }

  export interface SiteContentEntry {
    contentId: string
    contentType: 'blog' | 'news' | string
    localeVersions?: SiteContentLocaleVersion[]
  }

  export interface CreateCategoryPayload {
    parentCategoryId?: string
    sourceCategoryId?: string
    locale: string
    slug: string
    displayTitle: string
    description?: string
    image?: string
    sortOrder?: number
    seoTitle: string
    seoDescription?: string
    seoImage?: string
  }

  export interface UpdateCategoryPayload extends Partial<CreateCategoryPayload> {
    categoryId?: string
  }

  export interface CreateContentPayload {
    contentType: 'blog' | 'news'
  }

  export interface SaveContentVersionPayload {
    locale: string
    slug: string
    title: string
    summary?: string
    bodyHtml: string
    seoTitle: string
    seoDescription: string
  }

  export interface AddProductsPayload {
    productIds: string[]
    locales: string[]
    categoryIds?: string[]
  }

  export interface UpdateSiteSettingsPayload {
    siteName?: string
    primaryDomain?: string
    previewBaseUrl?: string
    webhookUrl?: string
    runtimeStatusUrl?: string
    allowedOrigins?: string[]
  }

  export interface DisableSitePayload {
    reason?: string
  }

  export interface UpdateSiteProductPublicationPayload {
    locale?: string
    slug?: string
    displayTitle?: string
    displayDescription?: string
    seoTitle?: string
    seoDescription?: string
    seoImage?: string
    imageOverride?: string
    categoryIds?: string[]
    publishStatus?: string
  }

  export interface IssuePreviewTokenPayload {
    resourceType: 'blog' | 'category' | 'news' | 'product' | string
    resourceId: string
    locale: string
  }

  export interface IssuePreviewTokenResult {
    previewToken: string
    expiresAt: string
  }
}

const siteBase = (tenantId: string) => `/site-management/tenants/${encodeURIComponent(tenantId)}/sites`

/** listSiteCardsApi loads the Site Management card workspace from the Admin BFF. */
export function listSiteCardsApi(tenantId: string) {
  return requestClient.get<SiteManagementApi.ListSiteCardsResult>(siteBase(tenantId))
}

/** createSiteApi creates one draft managed external site through the Admin BFF. */
export function createSiteApi(tenantId: string, data: SiteManagementApi.CreateSitePayload) {
  return requestClient.post<SiteManagementApi.CreateSiteResult>(siteBase(tenantId), data)
}

/** syncSiteApi triggers explicit sync for one site and never runs from the public Storefront. */
export function syncSiteApi(tenantId: string, siteId: string) {
  return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/sync`, {})
}

/** getPendingSyncSummaryApi loads pending sync counters for one site. */
export function getPendingSyncSummaryApi(tenantId: string, siteId: string) {
  return requestClient.get<SiteManagementApi.PendingSyncSummary>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/sync/pending-summary`
  )
}

/** listPendingSyncResourcesApi loads pending sync resource refs for one site. */
export function listPendingSyncResourcesApi(tenantId: string, siteId: string) {
  return requestClient.get<{ resources: SiteManagementApi.PendingSyncResource[] }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/sync/pending-resources`
  )
}

/** listSyncHistoryApi loads sync batch history for one site. */
export function listSyncHistoryApi(tenantId: string, siteId: string) {
  return requestClient.get<{ batches: SiteManagementApi.SyncBatch[] }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/sync/history`
  )
}

/** getSyncDetailApi loads one sync batch and its resource list for the detail page. */
export function getSyncDetailApi(tenantId: string, syncId: string) {
  return requestClient.get<{ batch: SiteManagementApi.SyncBatch }>(
    `/site-management/tenants/${encodeURIComponent(tenantId)}/sync/${encodeURIComponent(syncId)}`
  )
}

/** retryLastSyncApi retries the latest sync notification without creating a new version. */
export function retryLastSyncApi(tenantId: string, siteId: string) {
  return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/sync/retry-last`, {})
}

/** resendWebhookApi resends the webhook for one existing sync batch without creating a new publish version. */
export function resendWebhookApi(tenantId: string, syncId: string) {
  return requestClient.post(`/site-management/tenants/${encodeURIComponent(tenantId)}/sync/${encodeURIComponent(syncId)}/webhook:resend`, {})
}

/** generateSiteCredentialApi requests a one-time backend-only Site Runtime credential bundle. */
export function generateSiteCredentialApi(tenantId: string, siteId: string, scopes: string[]) {
  return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/credentials`, { scopes })
}

/** listSiteCredentialsApi loads credential metadata only; it never returns credential bundles or secrets. */
export function listSiteCredentialsApi(tenantId: string, siteId: string) {
  return requestClient.get<{ credentials: SiteManagementApi.SiteCredentialMetadata[] }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/credentials`
  )
}

/** rotateSiteCredentialApi rotates one credential and returns the one-time bundle only to the operator. */
export function rotateSiteCredentialApi(tenantId: string, siteId: string, credentialId: string) {
  return requestClient.post(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/credentials/${encodeURIComponent(credentialId)}/rotate`,
    {}
  )
}

/** revokeSiteCredentialApi revokes one Site Runtime credential through the Admin BFF. */
export function revokeSiteCredentialApi(tenantId: string, siteId: string, credentialId: string) {
  return requestClient.post(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/credentials/${encodeURIComponent(credentialId)}/revoke`,
    {}
  )
}

/** updateSiteSettingsApi saves editable site settings through Admin BFF. */
export function updateSiteSettingsApi(
  tenantId: string,
  siteId: string,
  data: SiteManagementApi.UpdateSiteSettingsPayload
) {
  return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/settings`, data)
}

/** disableSiteApi disables one managed external site through the Admin BFF lifecycle boundary. */
export function disableSiteApi(tenantId: string, siteId: string, data: SiteManagementApi.DisableSitePayload = {}) {
  return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/disable`, data)
}

/** addPreparingLocaleApi adds one hidden preparing locale. */
export function addPreparingLocaleApi(tenantId: string, siteId: string, locale: string) {
  return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/locales`, { locale })
}

/** activateLocaleApi activates a prepared locale after completeness checks pass server-side. */
export function activateLocaleApi(tenantId: string, siteId: string, locale: string) {
  return requestClient.post(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/locales/${encodeURIComponent(locale)}/activate`,
    {}
  )
}

/** disableLocaleApi disables a non-default locale and lets sync propagate disabled public views. */
export function disableLocaleApi(tenantId: string, siteId: string, locale: string) {
  return requestClient.post(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/locales/${encodeURIComponent(locale)}/disable`,
    {}
  )
}

/** listSiteCategoriesApi loads site-owned category projections from Admin BFF. */
export function listSiteCategoriesApi(tenantId: string, siteId: string, locale?: string) {
  return requestClient.get<{ categories: SiteManagementApi.SiteCategory[] }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/categories`,
    { params: locale ? { locale } : undefined }
  )
}

/** createSiteCategoryApi creates one site-owned category projection through Admin BFF. */
export function createSiteCategoryApi(
  tenantId: string,
  siteId: string,
  data: SiteManagementApi.CreateCategoryPayload
) {
  return requestClient.post<{ category: SiteManagementApi.SiteCategory }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/categories`,
    data
  )
}

/** updateSiteCategoryApi saves one site-owned category projection and keeps Product Master categories outside this service. */
export function updateSiteCategoryApi(
  tenantId: string,
  siteId: string,
  categoryId: string,
  data: SiteManagementApi.UpdateCategoryPayload
) {
  return requestClient.post<{ category: SiteManagementApi.SiteCategory }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/categories/${encodeURIComponent(categoryId)}`,
    data
  )
}

/** unpublishSiteCategoryApi marks one site-owned category projection unpublished for the next explicit sync. */
export function unpublishSiteCategoryApi(tenantId: string, siteId: string, categoryId: string, locale: string) {
  return requestClient.post(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/categories/${encodeURIComponent(categoryId)}/unpublish`,
    { locale }
  )
}

/** checkLocaleCompletenessApi validates whether one locale can be activated. */
export function checkLocaleCompletenessApi(tenantId: string, siteId: string, locale: string) {
  return requestClient.get(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/locales/${encodeURIComponent(locale)}/completeness`
  )
}

/** listSiteProductsApi loads product publications already joined to one site. */
export function listSiteProductsApi(tenantId: string, siteId: string, locale?: string) {
  return requestClient.get<{ products: SiteManagementApi.SiteProductPublication[] }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/products`,
    {
      params: locale ? { locale } : undefined
    }
  )
}

/** searchProductMasterForAddApi searches candidate products through the Admin BFF. */
export function searchProductMasterForAddApi(tenantId: string, siteId: string, keyword: string) {
  return requestClient.get<SiteManagementApi.SearchProductMasterForAddResult>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/product-master-candidates`,
    {
      params: { keyword }
    }
  )
}

/** getSiteProductPublicationApi loads one site-owned product display configuration. */
export function getSiteProductPublicationApi(tenantId: string, siteId: string, publicationId: string) {
  return requestClient.get<{ product: SiteManagementApi.SiteProductPublication }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/products/${encodeURIComponent(publicationId)}`
  )
}

/** updateSiteProductPublicationApi saves site-owned product display configuration without touching Product Master truth. */
export function updateSiteProductPublicationApi(
  tenantId: string,
  siteId: string,
  publicationId: string,
  data: SiteManagementApi.UpdateSiteProductPublicationPayload
) {
  return requestClient.post(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/products/${encodeURIComponent(publicationId)}`,
    data
  )
}

/** unpublishSiteProductApi marks one product publication unpublished and leaves propagation to explicit sync. */
export function unpublishSiteProductApi(tenantId: string, siteId: string, publicationId: string) {
  return requestClient.post(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/products/${encodeURIComponent(publicationId)}/unpublish`,
    {}
  )
}

/** addProductsToSiteApi joins Product Master refs to one site without reading Product Master internals. */
export function addProductsToSiteApi(
  tenantId: string,
  siteId: string,
  data: SiteManagementApi.AddProductsPayload
) {
  return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/products:add`, data)
}

/** listSiteContentsApi loads Blog/News entries for one site. */
export function listSiteContentsApi(tenantId: string, siteId: string, contentType?: 'blog' | 'news') {
  return requestClient.get<{ contents: SiteManagementApi.SiteContentEntry[] }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/contents`,
    {
      params: contentType ? { contentType } : undefined
    }
  )
}

/** getSiteContentApi loads one site-scoped Blog/News entry through Admin BFF. */
export function getSiteContentApi(tenantId: string, siteId: string, contentId: string) {
  return requestClient.get<{ content: SiteManagementApi.SiteContentEntry }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/contents/${encodeURIComponent(contentId)}`
  )
}

/** listSiteAuditLogsApi loads site audit rows through Admin BFF. */
export function listSiteAuditLogsApi(tenantId: string, siteId: string) {
  return requestClient.get<{ auditLogs: SiteManagementApi.SiteAuditLog[] }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/audit`
  )
}

/** createSiteContentApi creates one site-scoped Blog or News entry. */
export function createSiteContentApi(
  tenantId: string,
  siteId: string,
  data: SiteManagementApi.CreateContentPayload
) {
  return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/contents`, data)
}

/** saveSiteContentLocaleVersionApi saves one Blog/News locale draft for later explicit sync. */
export function saveSiteContentLocaleVersionApi(
  tenantId: string,
  siteId: string,
  contentId: string,
  data: SiteManagementApi.SaveContentVersionPayload
) {
  return requestClient.post(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/contents/${encodeURIComponent(contentId)}/locale-version`,
    data
  )
}

/** unpublishSiteContentApi marks one Blog/News locale version unpublished and leaves propagation to explicit sync. */
export function unpublishSiteContentApi(tenantId: string, siteId: string, contentId: string, locale: string) {
  return requestClient.post(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/contents/${encodeURIComponent(contentId)}/unpublish`,
    { locale }
  )
}

/** issuePreviewTokenApi requests a short-lived preview token for a saved draft resource. */
export function issuePreviewTokenApi(
  tenantId: string,
  siteId: string,
  data: SiteManagementApi.IssuePreviewTokenPayload
) {
  return requestClient.post<SiteManagementApi.IssuePreviewTokenResult>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/preview-token`,
    data
  )
}
