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

  export interface SiteLocaleOption {
    locale: string
    nativeName: string
  }

  export interface ListLocaleOptionsResult {
    locales: SiteLocaleOption[]
  }

  export interface SitePagePreflightIssue {
    code: string
    pageKey: string
    locale: string
  }

  export interface LocaleCompletenessResult {
    complete: boolean
    issues: string[]
    preflightIssues?: SitePagePreflightIssue[]
  }

  export interface SitePage {
    pageKey: string
    supportedLocales: string[]
    capabilityAvailable: boolean
    enabled: boolean
    indexable: boolean
    capabilityDrift: boolean
    syncStatus: string
    lastDiscoveredAt: string
  }

  export interface ListSitePagesResult {
    pages: SitePage[]
  }

  export interface UpdateSitePageGovernancePayload {
    enabled: boolean
    indexable: boolean
  }

  export interface UpdateSitePageGovernanceResult {
    page: SitePage
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
    coverImageAlt?: string
    status?: string
    categoryIds?: string[]
  }

  export interface SiteContentEntry {
    contentId: string
    contentType: 'blog' | 'news' | string
    localeVersions?: SiteContentLocaleVersion[]
  }

  export interface ContentCategoryLocaleVersion {
    categoryVersionId?: string
    categoryId: string
    locale: string
    slug: string
    displayName: string
    archiveIntro?: string
    archiveLabel?: string
    seoTitle?: string
    seoDescription?: string
    seoImage?: string
    historicalSlugs?: string[]
    syncStatus?: string
    draftRevision?: number
    lastPublishedRevision?: number
    lastPublishedAt?: string
  }

  export interface ContentCategory {
    categoryId: string
    siteId: string
    sortOrder?: number
    syncStatus?: string
    deleted?: boolean
    publishedUsage?: { blogCount?: number; newsCount?: number; draftReferenceCount?: number }
    localeVersions?: ContentCategoryLocaleVersion[]
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
    coverImageAlt?: string
    categoryIds?: string[]
    bodyHtml: string
    seoTitle: string
    seoDescription: string
  }

  export interface CreateContentCategoryPayload {
    sortOrder?: number
    initialLocaleVersion: SaveContentCategoryLocaleVersionPayload
  }

  export interface SaveContentCategoryLocaleVersionPayload {
    locale: string
    slug: string
    displayName: string
    archiveIntro?: string
    archiveLabel?: string
    seoTitle?: string
    seoDescription?: string
    seoImage?: string
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
  export interface FaqCategoryLocaleVersion { categoryId: string; locale: string; title: string; anchorKey: string; sortOrder: number; syncStatus?: string }
  export interface FaqCategory { categoryId: string; siteId: string; status: string; syncStatus: string; localeVersions: FaqCategoryLocaleVersion[] }
  export interface FaqEntryLocaleVersion { entryId: string; locale: string; question: string; answerHtml: string; sortOrder: number; syncStatus?: string }
  export interface FaqEntry { entryId: string; siteId: string; categoryId: string; status: string; syncStatus: string; localeVersions: FaqEntryLocaleVersion[] }
  export interface SaveFaqCategoryLocaleVersionPayload { locale: string; title: string; anchorKey: string; sortOrder: number }
  export interface CreateFaqEntryPayload { categoryId: string }
  export interface SaveFaqEntryLocaleVersionPayload { locale: string; question: string; answerHtml: string; sortOrder: number }
  export interface FaqCompleteness { complete: boolean; issues: string[] }
}

const siteBase = (tenantId: string) => `/site-management/tenants/${encodeURIComponent(tenantId)}/sites`
const localeOptionsBase = (tenantId: string) => `/site-management/tenants/${encodeURIComponent(tenantId)}/locale-options`

/** invalidSitePageResponse creates one stable API-boundary validation error. */
function invalidSitePageResponse(field: string): TypeError {
  return new TypeError(`Invalid SitePage response: ${field}`)
}

/** parsePlainSitePageRecord rejects null, arrays, and class instances at the SitePage API boundary. */
function parsePlainSitePageRecord(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw invalidSitePageResponse(field)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    throw invalidSitePageResponse(field)
  }
  return value as Record<string, unknown>
}

/** parseDenseSitePageArray enforces an own-indexed array without inventing capacity limits or repairing holes. */
function parseDenseSitePageArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw invalidSitePageResponse(field)
  }
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index)) {
      throw invalidSitePageResponse(`${field}[${index}]`)
    }
  }
  return value
}

/** parseSitePageString requires one present non-empty string field. */
function parseSitePageString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw invalidSitePageResponse(field)
  }
  return value
}

/** parseSitePageBoolean requires one present boolean field without coercion. */
function parseSitePageBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw invalidSitePageResponse(field)
  }
  return value
}

/** parseSitePageRecord validates and reconstructs one exact SitePage read model. */
function parseSitePageRecord(value: unknown, field: string): SiteManagementApi.SitePage {
  const record = parsePlainSitePageRecord(value, field)
  const supportedLocales = parseDenseSitePageArray(
    record.supportedLocales,
    `${field}.supportedLocales`
  ).map((locale, index) =>
    parseSitePageString(locale, `${field}.supportedLocales[${index}]`)
  )
  return {
    pageKey: parseSitePageString(record.pageKey, `${field}.pageKey`),
    supportedLocales,
    capabilityAvailable: parseSitePageBoolean(
      record.capabilityAvailable,
      `${field}.capabilityAvailable`
    ),
    enabled: parseSitePageBoolean(record.enabled, `${field}.enabled`),
    indexable: parseSitePageBoolean(record.indexable, `${field}.indexable`),
    capabilityDrift: parseSitePageBoolean(record.capabilityDrift, `${field}.capabilityDrift`),
    syncStatus: parseSitePageString(record.syncStatus, `${field}.syncStatus`),
    lastDiscoveredAt: parseSitePageString(record.lastDiscoveredAt, `${field}.lastDiscoveredAt`)
  }
}

/** parseListSitePagesResult validates the list envelope and unique page identities. */
function parseListSitePagesResult(value: unknown): SiteManagementApi.ListSitePagesResult {
  const record = parsePlainSitePageRecord(value, 'result')
  const pageKeys = new Set<string>()
  const pages = parseDenseSitePageArray(record.pages, 'result.pages').map((page, index) => {
    const parsed = parseSitePageRecord(page, `result.pages[${index}]`)
    if (pageKeys.has(parsed.pageKey)) {
      throw invalidSitePageResponse(`duplicate pageKey ${parsed.pageKey}`)
    }
    pageKeys.add(parsed.pageKey)
    return parsed
  })
  return { pages }
}

/** parseUpdateSitePageGovernanceResult validates the response envelope and requested page identity. */
function parseUpdateSitePageGovernanceResult(
  value: unknown,
  requestedPageKey: string
): SiteManagementApi.UpdateSitePageGovernanceResult {
  const record = parsePlainSitePageRecord(value, 'result')
  const page = parseSitePageRecord(record.page, 'result.page')
  if (page.pageKey !== requestedPageKey) {
    throw invalidSitePageResponse('result.page.pageKey identity mismatch')
  }
  return { page }
}

/** listSiteCardsApi loads the Site Management card workspace from the Admin BFF. */
export function listSiteCardsApi(tenantId: string) {
  return requestClient.get<SiteManagementApi.ListSiteCardsResult>(siteBase(tenantId))
}

/** listLocaleOptionsApi loads fixed system locale options through the Admin BFF. */
export function listLocaleOptionsApi(tenantId: string) {
  return requestClient.get<SiteManagementApi.ListLocaleOptionsResult>(localeOptionsBase(tenantId))
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
  return requestClient.get<SiteManagementApi.LocaleCompletenessResult>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/locales/${encodeURIComponent(locale)}/completeness`
  )
}

/** listSitePagesApi loads discovered page capability facts and page-wide governance state. */
export async function listSitePagesApi(tenantId: string, siteId: string) {
  const response = await requestClient.get<unknown>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/pages`
  )
  return parseListSitePagesResult(response)
}

/** updateSitePageGovernanceApi sends the complete page-wide governance pair through the Admin BFF. */
export async function updateSitePageGovernanceApi(
  tenantId: string,
  siteId: string,
  pageKey: string,
  data: SiteManagementApi.UpdateSitePageGovernancePayload
) {
  const response = await requestClient.post<unknown>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageKey)}/governance`,
    { enabled: data.enabled, indexable: data.indexable }
  )
  return parseUpdateSitePageGovernanceResult(response, pageKey)
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

/** listContentCategoriesApi loads site-scoped Blog/News Categories for Admin selection and management. */
export function listContentCategoriesApi(
  tenantId: string,
  siteId: string,
  locale?: string
) {
  const params = locale ? { locale } : undefined
  return requestClient.get<{ categories: SiteManagementApi.ContentCategory[] }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/content-categories`,
    { params }
  )
}

/** getContentCategoryApi loads one site-scoped Category detail through Admin BFF. */
export function getContentCategoryApi(tenantId: string, siteId: string, categoryId: string) {
  return requestClient.get<{ category: SiteManagementApi.ContentCategory }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/content-categories/${encodeURIComponent(categoryId)}`
  )
}

/** createContentCategoryApi creates one site-scoped Blog/News Category. */
export function createContentCategoryApi(
  tenantId: string,
  siteId: string,
  data: SiteManagementApi.CreateContentCategoryPayload
) {
  return requestClient.post<{ category: SiteManagementApi.ContentCategory }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/content-categories`,
    data
  )
}

/** saveContentCategoryLocaleVersionApi saves one Category locale version for later explicit sync. */
export function saveContentCategoryLocaleVersionApi(
  tenantId: string,
  siteId: string,
  categoryId: string,
  data: SiteManagementApi.SaveContentCategoryLocaleVersionPayload
) {
  return requestClient.post<{ version: SiteManagementApi.ContentCategoryLocaleVersion }>(
    `${siteBase(tenantId)}/${encodeURIComponent(siteId)}/content-categories/${encodeURIComponent(categoryId)}/locale-version`,
    data
  )
}

/** publishContentCategoryLocaleApi approves one locale draft for the next target-pinned Site Sync. */
export function publishContentCategoryLocaleApi(tenantId: string, siteId: string, categoryId: string, locale: string) { return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/content-categories/${encodeURIComponent(categoryId)}/publish`, { locale }) }
/** reorderContentCategoriesApi submits the complete, single global Category order. */
export function reorderContentCategoriesApi(tenantId: string, siteId: string, orderedCategoryIds: string[]) { return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/content-categories/reorder`, { orderedCategoryIds }) }
/** deleteContentCategoryApi requests protected deletion or a published-slug tombstone. */
export function deleteContentCategoryApi(tenantId: string, siteId: string, categoryId: string) { return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/content-categories/${encodeURIComponent(categoryId)}/delete`, {}) }
/** listVisibleContentCategoriesApi reads Category archive candidates derived from published Article usage. */
export function listVisibleContentCategoriesApi(tenantId: string, siteId: string, contentType: 'blog' | 'news', locale: string) { return requestClient.get<{ categories: SiteManagementApi.ContentCategory[] }>(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/content-categories/visible`, { params: { contentType, locale } }) }
/** checkContentCategoryCompletenessApi reports locale readiness without turning optional SEO into a blocker. */
export function checkContentCategoryCompletenessApi(tenantId: string, siteId: string, categoryId: string, locale: string) { return requestClient.get<{ complete: boolean; issues: string[] }>(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/content-categories/${encodeURIComponent(categoryId)}/completeness`, { params: { locale } }) }
/** listContentCategoryUsageApi reads published and draft Article references before a delete attempt. */
export function listContentCategoryUsageApi(tenantId: string, siteId: string, categoryId: string) { return requestClient.get<{ usage: NonNullable<SiteManagementApi.ContentCategory['publishedUsage']> }>(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/content-categories/${encodeURIComponent(categoryId)}/usage`) }

/** listFaqCategoriesApi reads flat site FAQ Categories through the Admin BFF. */
export function listFaqCategoriesApi(tenantId: string, siteId: string, locale?: string) { return requestClient.get<{ categories: SiteManagementApi.FaqCategory[] }>(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/faqs/categories`, { params: locale ? { locale } : undefined }) }
/** createFaqCategoryApi creates one flat FAQ Category. */
export function createFaqCategoryApi(tenantId: string, siteId: string) { return requestClient.post<{ category: SiteManagementApi.FaqCategory }>(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/faqs/categories`, {}) }
/** saveFaqCategoryLocaleVersionApi saves one locale Category revision for explicit Sync. */
export function saveFaqCategoryLocaleVersionApi(tenantId: string, siteId: string, categoryId: string, data: SiteManagementApi.SaveFaqCategoryLocaleVersionPayload) { return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/faqs/categories/${encodeURIComponent(categoryId)}/locale-version`, data) }
/** disableFaqCategoryApi disables only after server-side published Entry protection. */
export function disableFaqCategoryApi(tenantId: string, siteId: string, categoryId: string) { return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/faqs/categories/${encodeURIComponent(categoryId)}/disable`, {}) }
/** listFaqEntriesApi reads Entries with optional Category and locale filters. */
export function listFaqEntriesApi(tenantId: string, siteId: string, categoryId?: string, locale?: string) { const params = { ...(categoryId ? { categoryId } : {}), ...(locale ? { locale } : {}) }; return requestClient.get<{ entries: SiteManagementApi.FaqEntry[] }>(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/faqs/entries`, { params: Object.keys(params).length ? params : undefined }) }
/** createFaqEntryApi creates one Entry with its required single Category assignment. */
export function createFaqEntryApi(tenantId: string, siteId: string, data: SiteManagementApi.CreateFaqEntryPayload) { return requestClient.post<{ entry: SiteManagementApi.FaqEntry }>(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/faqs/entries`, data) }
/** saveFaqEntryLocaleVersionApi saves a locale Entry revision for explicit Sync. */
export function saveFaqEntryLocaleVersionApi(tenantId: string, siteId: string, entryId: string, data: SiteManagementApi.SaveFaqEntryLocaleVersionPayload) { return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/faqs/entries/${encodeURIComponent(entryId)}/locale-version`, data) }
/** unpublishFaqEntryApi withdraws only the selected locale Entry revision. */
export function unpublishFaqEntryApi(tenantId: string, siteId: string, entryId: string, locale: string) { return requestClient.post(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/faqs/entries/${encodeURIComponent(entryId)}/unpublish`, { locale }) }
/** checkFaqCompletenessApi queries locale-specific FAQ readiness before explicit publish. */
export function checkFaqCompletenessApi(tenantId: string, siteId: string, locale: string) { return requestClient.get<SiteManagementApi.FaqCompleteness>(`${siteBase(tenantId)}/${encodeURIComponent(siteId)}/faqs/completeness`, { params: { locale } }) }

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
