import { Inject, Injectable } from '@nestjs/common'
import { SITE_SUPPORTED_LOCALE_OPTIONS } from '@oes/common/contracts'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { VerifiedTenantTarget } from '../../common/tenant-target'
import {
  CreateSiteContentDto,
  CreateSiteDto,
  GenerateSiteCredentialDto,
  IssuePreviewTokenDto,
  UpdateSiteContentLocaleVersionDto,
  UpdateSiteSettingsDto,
  AddPreparingLocaleDto,
  AddProductsToSiteDto,
  CreateSiteCategoryDto,
  CreateContentCategoryDto,
  UpdateSiteCategoryDto,
  UpdateContentCategoryLocaleVersionDto,
  UpdateSiteProductPublicationDto
  , UpdateFaqCategoryLocaleVersionDto, CreateFaqEntryDto, UpdateFaqEntryLocaleVersionDto
} from './interface/http/dtos/site-management.dto'

export const SITE_MANAGEMENT_DOWNSTREAM = Symbol('SITE_MANAGEMENT_DOWNSTREAM')

export interface SiteManagementAdminContext {
  tenantId: string
  orgId?: string
  operatorId?: string
  traceId?: string
  requestId?: string
}

export interface SiteManagementDownstream {
  listSiteCards(
    context: SiteManagementAdminContext,
    source: DownstreamRequestSource
  ): Promise<unknown>
  createSite(
    input: SiteManagementAdminContext & CreateSiteDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  updateSiteSettings(
    input: { context: SiteManagementAdminContext; siteId: string } & UpdateSiteSettingsDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  disableSite(
    input: { context: SiteManagementAdminContext; siteId: string; reason?: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  addPreparingLocale(
    input: { context: SiteManagementAdminContext; siteId: string } & AddPreparingLocaleDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  checkLocaleCompleteness(
    input: { context: SiteManagementAdminContext; siteId: string; locale: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  activateLocale(
    input: { context: SiteManagementAdminContext; siteId: string; locale: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  disableLocale(
    input: { context: SiteManagementAdminContext; siteId: string; locale: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  listSitePages(
    input: { context: SiteManagementAdminContext; siteId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  updateSitePageGovernance(
    input: {
      context: SiteManagementAdminContext
      siteId: string
      pageKey: string
      enabled: boolean
      indexable: boolean
    },
    source: DownstreamRequestSource
  ): Promise<unknown>
  listSiteCategories(
    input: { context: SiteManagementAdminContext; siteId: string; locale?: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  createSiteCategory(
    input: { context: SiteManagementAdminContext; siteId: string } & CreateSiteCategoryDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  updateSiteCategory(
    input: {
      context: SiteManagementAdminContext
      siteId: string
      categoryId: string
      category: UpdateSiteCategoryDto
    },
    source: DownstreamRequestSource
  ): Promise<unknown>
  unpublishSiteCategory(
    input: {
      context: SiteManagementAdminContext
      siteId: string
      categoryId: string
      locale: string
    },
    source: DownstreamRequestSource
  ): Promise<unknown>
  listSiteProducts(
    input: { context: SiteManagementAdminContext; siteId: string; locale?: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  searchProductMasterForAdd(
    input: {
      context: SiteManagementAdminContext
      siteId: string
      keyword?: string
      page?: number
      pageSize?: number
    },
    source: DownstreamRequestSource
  ): Promise<unknown>
  getSiteProductPublication(
    input: { context: SiteManagementAdminContext; siteId: string; publicationId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  addProductsToSite(
    input: { context: SiteManagementAdminContext; siteId: string } & AddProductsToSiteDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  updateSiteProductPublication(
    input: {
      context: SiteManagementAdminContext
      siteId: string
      publicationId: string
      publication: UpdateSiteProductPublicationDto
    },
    source: DownstreamRequestSource
  ): Promise<unknown>
  unpublishSiteProduct(
    input: { context: SiteManagementAdminContext; siteId: string; publicationId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  syncAllPendingChanges(
    input: { context: SiteManagementAdminContext; siteId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  getPendingSyncSummary(
    input: { context: SiteManagementAdminContext; siteId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  listPendingSyncResources(
    input: { context: SiteManagementAdminContext; siteId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  listSyncHistory(
    input: { context: SiteManagementAdminContext; siteId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  getSyncDetail(
    input: { context: SiteManagementAdminContext; syncId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  retryLastSync(
    input: { context: SiteManagementAdminContext; siteId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  resendWebhook(
    input: { context: SiteManagementAdminContext; syncId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  issuePreviewToken(
    input: { context: SiteManagementAdminContext; siteId: string } & IssuePreviewTokenDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  generateSiteCredential(
    input: { context: SiteManagementAdminContext; siteId: string } & GenerateSiteCredentialDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  listSiteCredentials(
    input: { context: SiteManagementAdminContext; siteId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  rotateSiteCredential(
    input: { context: SiteManagementAdminContext; siteId: string; credentialId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  revokeSiteCredential(
    input: { context: SiteManagementAdminContext; siteId: string; credentialId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  createSiteContent(
    input: { context: SiteManagementAdminContext; siteId: string } & CreateSiteContentDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  updateSiteContentLocaleVersion(
    input: {
      context: SiteManagementAdminContext
      siteId: string
      version: UpdateSiteContentLocaleVersionDto
    },
    source: DownstreamRequestSource
  ): Promise<unknown>
  listSiteContents(
    input: { context: SiteManagementAdminContext; siteId: string; contentType?: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  getSiteContent(
    input: { context: SiteManagementAdminContext; siteId: string; contentId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  unpublishSiteContent(
    input: {
      context: SiteManagementAdminContext
      siteId: string
      contentId: string
      locale: string
    },
    source: DownstreamRequestSource
  ): Promise<unknown>
  listContentCategories(
    input: {
      context: SiteManagementAdminContext
      siteId: string
      locale?: string
    },
    source: DownstreamRequestSource
  ): Promise<unknown>
  getContentCategory(
    input: { context: SiteManagementAdminContext; siteId: string; categoryId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  createContentCategory(
    input: { context: SiteManagementAdminContext; siteId: string } & CreateContentCategoryDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  updateContentCategoryLocaleVersion(
    input: {
      context: SiteManagementAdminContext
      siteId: string
      version: UpdateContentCategoryLocaleVersionDto
    },
    source: DownstreamRequestSource
  ): Promise<unknown>
  publishContentCategoryLocale(
    input: { context: SiteManagementAdminContext; siteId: string; categoryId: string; locale: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  reorderContentCategories(input: { context: SiteManagementAdminContext; siteId: string; orderedCategoryIds: string[] }, source: DownstreamRequestSource): Promise<unknown>
  deleteContentCategory(input: { context: SiteManagementAdminContext; siteId: string; categoryId: string }, source: DownstreamRequestSource): Promise<unknown>
  listVisibleContentCategories(input: { context: SiteManagementAdminContext; siteId: string; contentType: string; locale: string }, source: DownstreamRequestSource): Promise<unknown>
  checkContentCategoryCompleteness(input: { context: SiteManagementAdminContext; siteId: string; categoryId: string; locale: string }, source: DownstreamRequestSource): Promise<unknown>
  listContentCategoryUsage(input: { context: SiteManagementAdminContext; siteId: string; categoryId: string }, source: DownstreamRequestSource): Promise<unknown>
  listFaqCategories(input: { context: SiteManagementAdminContext; siteId: string; locale?: string }, source: DownstreamRequestSource): Promise<unknown>
  getFaqCategory(input: { context: SiteManagementAdminContext; siteId: string; categoryId: string }, source: DownstreamRequestSource): Promise<unknown>
  createFaqCategory(input: { context: SiteManagementAdminContext; siteId: string }, source: DownstreamRequestSource): Promise<unknown>
  updateFaqCategoryLocaleVersion(input: { context: SiteManagementAdminContext; siteId: string; version: UpdateFaqCategoryLocaleVersionDto }, source: DownstreamRequestSource): Promise<unknown>
  disableFaqCategory(input: { context: SiteManagementAdminContext; siteId: string; categoryId: string }, source: DownstreamRequestSource): Promise<unknown>
  listFaqEntries(input: { context: SiteManagementAdminContext; siteId: string; categoryId?: string; locale?: string }, source: DownstreamRequestSource): Promise<unknown>
  getFaqEntry(input: { context: SiteManagementAdminContext; siteId: string; entryId: string }, source: DownstreamRequestSource): Promise<unknown>
  createFaqEntry(input: { context: SiteManagementAdminContext; siteId: string } & CreateFaqEntryDto, source: DownstreamRequestSource): Promise<unknown>
  updateFaqEntryLocaleVersion(input: { context: SiteManagementAdminContext; siteId: string; version: UpdateFaqEntryLocaleVersionDto }, source: DownstreamRequestSource): Promise<unknown>
  unpublishFaqEntry(input: { context: SiteManagementAdminContext; siteId: string; entryId: string; locale: string }, source: DownstreamRequestSource): Promise<unknown>
  checkFaqCompleteness(input: { context: SiteManagementAdminContext; siteId: string; locale: string }, source: DownstreamRequestSource): Promise<unknown>
  listSiteAuditLogs(
    input: { context: SiteManagementAdminContext; siteId: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
}

/** SiteManagementService orchestrates Admin BFF requests before forwarding them to site-service. */
@Injectable()
export class SiteManagementService {
  constructor(
    @Inject(SITE_MANAGEMENT_DOWNSTREAM)
    private readonly downstream: SiteManagementDownstream
  ) {}

  /** listSiteCards delegates card workspace reads with explicit tenant/operator context. */
  listSiteCards(tenantId: VerifiedTenantTarget, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.listSiteCards(buildAdminContext(tenantId, source), source)
  }

  /** listLocaleOptions returns the fixed system locale enum used by Site Management. */
  listLocaleOptions(): { locales: Array<{ locale: string; nativeName: string }> } {
    return { locales: SITE_SUPPORTED_LOCALE_OPTIONS.map((option) => ({ ...option })) }
  }

  /** createSite delegates draft site creation without embedding lifecycle rules in the gateway. */
  createSite(
    tenantId: VerifiedTenantTarget,
    body: CreateSiteDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.createSite({ ...buildAdminContext(tenantId, source), ...body }, source)
  }

  /** updateSiteSettings delegates editable site settings to site-service. */
  updateSiteSettings(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    body: UpdateSiteSettingsDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.updateSiteSettings(
      { context: buildAdminContext(tenantId, source), siteId, ...body },
      source
    )
  }

  /** disableSite delegates site disablement to site-service lifecycle rules. */
  disableSite(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    reason: string | undefined,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.disableSite(
      { context: buildAdminContext(tenantId, source), siteId, reason },
      source
    )
  }

  /** addPreparingLocale delegates locale preparation to site-service. */
  addPreparingLocale(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    body: AddPreparingLocaleDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.addPreparingLocale(
      { context: buildAdminContext(tenantId, source), siteId, ...body },
      source
    )
  }

  /** checkLocaleCompleteness delegates locale validation to site-service. */
  checkLocaleCompleteness(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    locale: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.checkLocaleCompleteness(
      { context: buildAdminContext(tenantId, source), siteId, locale },
      source
    )
  }

  /** activateLocale delegates locale activation to site-service. */
  activateLocale(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    locale: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.activateLocale(
      { context: buildAdminContext(tenantId, source), siteId, locale },
      source
    )
  }

  /** disableLocale delegates locale hiding to site-service. */
  disableLocale(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    locale: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.disableLocale(
      { context: buildAdminContext(tenantId, source), siteId, locale },
      source
    )
  }

  /** listSitePages returns discovered capability and page-wide governance data for Admin. */
  listSitePages(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.listSitePages(
      { context: buildAdminContext(tenantId, source), siteId },
      source
    )
  }

  /** updateSitePageGovernance forwards page-wide enabled/index intent without adding locale switches. */
  updateSitePageGovernance(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    pageKey: string,
    body: { enabled: boolean; indexable: boolean },
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.updateSitePageGovernance(
      {
        context: buildAdminContext(tenantId, source),
        siteId,
        pageKey,
        enabled: body.enabled,
        indexable: body.indexable
      },
      source
    )
  }

  /** listSiteCategories delegates site-owned category projection reads to site-service. */
  listSiteCategories(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    locale: string | undefined,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.listSiteCategories(
      { context: buildAdminContext(tenantId, source), siteId, locale },
      source
    )
  }

  /** createSiteCategory delegates site-owned category projection creation to site-service. */
  createSiteCategory(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    body: CreateSiteCategoryDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.createSiteCategory(
      { context: buildAdminContext(tenantId, source), siteId, ...body },
      source
    )
  }

  /** updateSiteCategory delegates category projection edits to site-service. */
  updateSiteCategory(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    categoryId: string,
    body: UpdateSiteCategoryDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.updateSiteCategory(
      {
        context: buildAdminContext(tenantId, source),
        siteId,
        categoryId,
        category: { ...body, categoryId, siteId }
      },
      source
    )
  }

  /** unpublishSiteCategory delegates category unpublish commands to site-service. */
  unpublishSiteCategory(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    categoryId: string,
    locale: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.unpublishSiteCategory(
      { context: buildAdminContext(tenantId, source), siteId, categoryId, locale },
      source
    )
  }

  /** listSiteProducts delegates site-owned product read models to site-service. */
  listSiteProducts(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    locale: string | undefined,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.listSiteProducts(
      { context: buildAdminContext(tenantId, source), siteId, locale },
      source
    )
  }

  /** searchProductMasterForAdd delegates Product Master candidate lookup through the site-service anti-corruption boundary. */
  searchProductMasterForAdd(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    query: { keyword?: string; page?: string; pageSize?: string },
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.searchProductMasterForAdd(
      {
        context: buildAdminContext(tenantId, source),
        siteId,
        keyword: query.keyword,
        page: query.page ? Number(query.page) : undefined,
        pageSize: query.pageSize ? Number(query.pageSize) : undefined
      },
      source
    )
  }

  /** getSiteProductPublication delegates product publication detail reads to site-service. */
  getSiteProductPublication(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    publicationId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.getSiteProductPublication(
      { context: buildAdminContext(tenantId, source), siteId, publicationId },
      source
    )
  }

  /** addProductsToSite delegates product publication creation to site-service. */
  addProductsToSite(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    body: AddProductsToSiteDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.addProductsToSite(
      { context: buildAdminContext(tenantId, source), siteId, ...body },
      source
    )
  }

  /** updateSiteProductPublication delegates site-owned product display edits to site-service. */
  updateSiteProductPublication(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    publicationId: string,
    body: UpdateSiteProductPublicationDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.updateSiteProductPublication(
      {
        context: buildAdminContext(tenantId, source),
        siteId,
        publicationId,
        publication: { ...body, publicationId, siteId }
      },
      source
    )
  }

  /** unpublishSiteProduct delegates product unpublish commands to site-service. */
  unpublishSiteProduct(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    publicationId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.unpublishSiteProduct(
      { context: buildAdminContext(tenantId, source), siteId, publicationId },
      source
    )
  }

  /** syncAllPendingChanges delegates explicit publish sync to the owning site-service. */
  syncAllPendingChanges(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.syncAllPendingChanges(
      { context: buildAdminContext(tenantId, source), siteId },
      source
    )
  }

  /** getPendingSyncSummary delegates pending sync summary reads to site-service. */
  getPendingSyncSummary(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.getPendingSyncSummary(
      { context: buildAdminContext(tenantId, source), siteId },
      source
    )
  }

  /** listPendingSyncResources delegates pending resource reads to site-service. */
  listPendingSyncResources(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.listPendingSyncResources(
      { context: buildAdminContext(tenantId, source), siteId },
      source
    )
  }

  /** listSyncHistory delegates sync history reads to site-service. */
  listSyncHistory(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.listSyncHistory(
      { context: buildAdminContext(tenantId, source), siteId },
      source
    )
  }

  /** getSyncDetail delegates sync detail reads to site-service. */
  getSyncDetail(
    tenantId: VerifiedTenantTarget,
    syncId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.getSyncDetail(
      { context: buildAdminContext(tenantId, source), syncId },
      source
    )
  }

  /** retryLastSync delegates sync retry without generating duplicate public views. */
  retryLastSync(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.retryLastSync(
      { context: buildAdminContext(tenantId, source), siteId },
      source
    )
  }

  /** resendWebhook delegates webhook resend without advancing publish version. */
  resendWebhook(
    tenantId: VerifiedTenantTarget,
    syncId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.resendWebhook(
      { context: buildAdminContext(tenantId, source), syncId },
      source
    )
  }

  /** issuePreviewToken delegates short-lived preview token issuance to the owning site-service. */
  issuePreviewToken(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    body: IssuePreviewTokenDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.issuePreviewToken(
      { context: buildAdminContext(tenantId, source), siteId, ...body },
      source
    )
  }

  /** generateSiteCredential delegates one-time Site Runtime credential generation to site-service. */
  generateSiteCredential(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    body: GenerateSiteCredentialDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.generateSiteCredential(
      { context: buildAdminContext(tenantId, source), siteId, ...body },
      source
    )
  }

  /** listSiteCredentials delegates metadata-only credential reads to site-service. */
  listSiteCredentials(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.listSiteCredentials(
      { context: buildAdminContext(tenantId, source), siteId },
      source
    )
  }

  /** rotateSiteCredential delegates credential rotation while preserving Admin context. */
  rotateSiteCredential(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    credentialId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.rotateSiteCredential(
      { context: buildAdminContext(tenantId, source), siteId, credentialId },
      source
    )
  }

  /** revokeSiteCredential delegates credential revocation so future signed requests fail closed. */
  revokeSiteCredential(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    credentialId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.revokeSiteCredential(
      { context: buildAdminContext(tenantId, source), siteId, credentialId },
      source
    )
  }

  /** createSiteContent delegates Blog/News container creation to site-service. */
  createSiteContent(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    body: CreateSiteContentDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.createSiteContent(
      { context: buildAdminContext(tenantId, source), siteId, ...body },
      source
    )
  }

  /** updateSiteContentLocaleVersion delegates Blog/News locale draft saves to site-service. */
  updateSiteContentLocaleVersion(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    body: UpdateSiteContentLocaleVersionDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.updateSiteContentLocaleVersion(
      {
        context: buildAdminContext(tenantId, source),
        siteId,
        version: body
      },
      source
    )
  }

  /** listSiteContents delegates Blog/News list reads to site-service. */
  listSiteContents(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    contentType: string | undefined,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.listSiteContents(
      { context: buildAdminContext(tenantId, source), siteId, contentType },
      source
    )
  }

  /** getSiteContent delegates Blog/News detail reads to site-service. */
  getSiteContent(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    contentId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.getSiteContent(
      { context: buildAdminContext(tenantId, source), siteId, contentId },
      source
    )
  }

  /** unpublishSiteContent delegates content unpublish commands to site-service. */
  unpublishSiteContent(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    contentId: string,
    locale: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.unpublishSiteContent(
      { context: buildAdminContext(tenantId, source), siteId, contentId, locale },
      source
    )
  }

  /** listContentCategories delegates Category reads for Blog/News operations to site-service. */
  listContentCategories(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    locale: string | undefined,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.listContentCategories(
      { context: buildAdminContext(tenantId, source), siteId, locale },
      source
    )
  }

  /** getContentCategory delegates one Category read to site-service. */
  getContentCategory(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    categoryId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.getContentCategory(
      { context: buildAdminContext(tenantId, source), siteId, categoryId },
      source
    )
  }

  /** createContentCategory delegates Category creation without owning business rules in the gateway. */
  createContentCategory(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    body: CreateContentCategoryDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.createContentCategory(
      { context: buildAdminContext(tenantId, source), siteId, ...body },
      source
    )
  }

  /** updateContentCategoryLocaleVersion delegates Category locale draft saves to site-service. */
  updateContentCategoryLocaleVersion(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    categoryId: string,
    body: UpdateContentCategoryLocaleVersionDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.updateContentCategoryLocaleVersion(
      {
        context: buildAdminContext(tenantId, source),
        siteId,
        version: { ...body, categoryId }
      },
      source
    )
  }

  /** publishContentCategoryLocale delegates explicit Category locale publication approval. */
  publishContentCategoryLocale(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    categoryId: string,
    locale: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.publishContentCategoryLocale(
      { context: buildAdminContext(tenantId, source), siteId, categoryId, locale },
      source
    )
  }

  /** reorderContentCategories delegates the full neutral Category ordering sequence. */
  reorderContentCategories(tenantId: VerifiedTenantTarget, siteId: string, orderedCategoryIds: string[], source: DownstreamRequestSource): Promise<unknown> { return this.downstream.reorderContentCategories({ context: buildAdminContext(tenantId, source), siteId, orderedCategoryIds }, source) }
  /** deleteContentCategory delegates delete blockers and slug tombstones. */
  deleteContentCategory(tenantId: VerifiedTenantTarget, siteId: string, categoryId: string, source: DownstreamRequestSource): Promise<unknown> { return this.downstream.deleteContentCategory({ context: buildAdminContext(tenantId, source), siteId, categoryId }, source) }
  /** listVisibleContentCategories delegates Article-usage derived visibility. */
  listVisibleContentCategories(tenantId: VerifiedTenantTarget, siteId: string, contentType: string, locale: string, source: DownstreamRequestSource): Promise<unknown> { return this.downstream.listVisibleContentCategories({ context: buildAdminContext(tenantId, source), siteId, contentType, locale }, source) }
  /** checkContentCategoryCompleteness delegates locale readiness diagnostics. */
  checkContentCategoryCompleteness(tenantId: VerifiedTenantTarget, siteId: string, categoryId: string, locale: string, source: DownstreamRequestSource): Promise<unknown> { return this.downstream.checkContentCategoryCompleteness({ context: buildAdminContext(tenantId, source), siteId, categoryId, locale }, source) }
  /** listContentCategoryUsage delegates Article usage projections. */
  listContentCategoryUsage(tenantId: VerifiedTenantTarget, siteId: string, categoryId: string, source: DownstreamRequestSource): Promise<unknown> { return this.downstream.listContentCategoryUsage({ context: buildAdminContext(tenantId, source), siteId, categoryId }, source) }

  /** listFaqCategories delegates FAQ read ownership to site-service. */
  listFaqCategories(tenantId: VerifiedTenantTarget, siteId: string, locale: string | undefined, source: DownstreamRequestSource) { return this.downstream.listFaqCategories({ context: buildAdminContext(tenantId, source), siteId, locale }, source) }
  /** getFaqCategory delegates one Category read to site-service. */
  getFaqCategory(tenantId: VerifiedTenantTarget, siteId: string, categoryId: string, source: DownstreamRequestSource) { return this.downstream.getFaqCategory({ context: buildAdminContext(tenantId, source), siteId, categoryId }, source) }
  /** createFaqCategory delegates flat Category creation to site-service. */
  createFaqCategory(tenantId: VerifiedTenantTarget, siteId: string, source: DownstreamRequestSource) { return this.downstream.createFaqCategory({ context: buildAdminContext(tenantId, source), siteId }, source) }
  /** updateFaqCategoryLocaleVersion delegates locale Category edits to site-service. */
  updateFaqCategoryLocaleVersion(tenantId: VerifiedTenantTarget, siteId: string, categoryId: string, body: UpdateFaqCategoryLocaleVersionDto, source: DownstreamRequestSource) { return this.downstream.updateFaqCategoryLocaleVersion({ context: buildAdminContext(tenantId, source), siteId, version: { ...body, categoryId } }, source) }
  /** disableFaqCategory delegates published-entry protection to site-service. */
  disableFaqCategory(tenantId: VerifiedTenantTarget, siteId: string, categoryId: string, source: DownstreamRequestSource) { return this.downstream.disableFaqCategory({ context: buildAdminContext(tenantId, source), siteId, categoryId }, source) }
  /** listFaqEntries delegates optional Category filtering to site-service. */
  listFaqEntries(tenantId: VerifiedTenantTarget, siteId: string, categoryId: string | undefined, locale: string | undefined, source: DownstreamRequestSource) { return this.downstream.listFaqEntries({ context: buildAdminContext(tenantId, source), siteId, categoryId, locale }, source) }
  /** getFaqEntry delegates one Entry read to site-service. */
  getFaqEntry(tenantId: VerifiedTenantTarget, siteId: string, entryId: string, source: DownstreamRequestSource) { return this.downstream.getFaqEntry({ context: buildAdminContext(tenantId, source), siteId, entryId }, source) }
  /** createFaqEntry delegates one-Category Entry creation to site-service. */
  createFaqEntry(tenantId: VerifiedTenantTarget, siteId: string, body: CreateFaqEntryDto, source: DownstreamRequestSource) { return this.downstream.createFaqEntry({ context: buildAdminContext(tenantId, source), siteId, ...body }, source) }
  /** updateFaqEntryLocaleVersion delegates locale Entry edits to site-service. */
  updateFaqEntryLocaleVersion(tenantId: VerifiedTenantTarget, siteId: string, entryId: string, body: UpdateFaqEntryLocaleVersionDto, source: DownstreamRequestSource) { return this.downstream.updateFaqEntryLocaleVersion({ context: buildAdminContext(tenantId, source), siteId, version: { ...body, entryId } }, source) }
  /** unpublishFaqEntry delegates locale withdrawal to site-service. */
  unpublishFaqEntry(tenantId: VerifiedTenantTarget, siteId: string, entryId: string, locale: string, source: DownstreamRequestSource) { return this.downstream.unpublishFaqEntry({ context: buildAdminContext(tenantId, source), siteId, entryId, locale }, source) }
  /** checkFaqCompleteness delegates per-locale publication preflight to site-service. */
  checkFaqCompleteness(tenantId: VerifiedTenantTarget, siteId: string, locale: string, source: DownstreamRequestSource) { return this.downstream.checkFaqCompleteness({ context: buildAdminContext(tenantId, source), siteId, locale }, source) }

  /** listSiteAuditLogs delegates audit reads to site-service. */
  listSiteAuditLogs(
    tenantId: VerifiedTenantTarget,
    siteId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.listSiteAuditLogs(
      { context: buildAdminContext(tenantId, source), siteId },
      source
    )
  }
}

/** buildAdminContext maps gateway identity and trace inputs into the site-service Admin context contract. */
function buildAdminContext(
  tenantId: VerifiedTenantTarget,
  source: DownstreamRequestSource
): SiteManagementAdminContext {
  return {
    tenantId,
    orgId: normalize(source.user?.orgId),
    operatorId: normalize(
      source.user?.holderId ?? source.user?.aid ?? source.user?.id ?? source.user?.sub
    ),
    traceId: normalize(source.traceId),
    requestId: normalize(source.requestId)
  }
}

/** normalize trims optional string values before they cross the BFF boundary. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
