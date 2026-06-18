import { Inject, Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
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
  UpdateSiteCategoryDto,
  UpdateSiteProductPublicationDto
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
  listSiteCards(context: SiteManagementAdminContext, source: DownstreamRequestSource): Promise<unknown>
  createSite(input: SiteManagementAdminContext & CreateSiteDto, source: DownstreamRequestSource): Promise<unknown>
  updateSiteSettings(
    input: { context: SiteManagementAdminContext; siteId: string } & UpdateSiteSettingsDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  disableSite(input: { context: SiteManagementAdminContext; siteId: string; reason?: string }, source: DownstreamRequestSource): Promise<unknown>
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
  listSiteCategories(
    input: { context: SiteManagementAdminContext; siteId: string; locale?: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  createSiteCategory(
    input: { context: SiteManagementAdminContext; siteId: string } & CreateSiteCategoryDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  updateSiteCategory(
    input: { context: SiteManagementAdminContext; siteId: string; categoryId: string; category: UpdateSiteCategoryDto },
    source: DownstreamRequestSource
  ): Promise<unknown>
  unpublishSiteCategory(
    input: { context: SiteManagementAdminContext; siteId: string; categoryId: string; locale: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  listSiteProducts(
    input: { context: SiteManagementAdminContext; siteId: string; locale?: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  searchProductMasterForAdd(
    input: { context: SiteManagementAdminContext; siteId: string; keyword?: string; page?: number; pageSize?: number },
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
    input: { context: SiteManagementAdminContext; siteId: string; publicationId: string; publication: UpdateSiteProductPublicationDto },
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
  getPendingSyncSummary(input: { context: SiteManagementAdminContext; siteId: string }, source: DownstreamRequestSource): Promise<unknown>
  listPendingSyncResources(input: { context: SiteManagementAdminContext; siteId: string }, source: DownstreamRequestSource): Promise<unknown>
  listSyncHistory(input: { context: SiteManagementAdminContext; siteId: string }, source: DownstreamRequestSource): Promise<unknown>
  getSyncDetail(input: { context: SiteManagementAdminContext; syncId: string }, source: DownstreamRequestSource): Promise<unknown>
  retryLastSync(input: { context: SiteManagementAdminContext; siteId: string }, source: DownstreamRequestSource): Promise<unknown>
  resendWebhook(input: { context: SiteManagementAdminContext; syncId: string }, source: DownstreamRequestSource): Promise<unknown>
  issuePreviewToken(
    input: { context: SiteManagementAdminContext; siteId: string } & IssuePreviewTokenDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  generateSiteCredential(
    input: { context: SiteManagementAdminContext; siteId: string } & GenerateSiteCredentialDto,
    source: DownstreamRequestSource
  ): Promise<unknown>
  listSiteCredentials(input: { context: SiteManagementAdminContext; siteId: string }, source: DownstreamRequestSource): Promise<unknown>
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
    input: { context: SiteManagementAdminContext; siteId: string; version: UpdateSiteContentLocaleVersionDto },
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
    input: { context: SiteManagementAdminContext; siteId: string; contentId: string; locale: string },
    source: DownstreamRequestSource
  ): Promise<unknown>
  listSiteAuditLogs(input: { context: SiteManagementAdminContext; siteId: string }, source: DownstreamRequestSource): Promise<unknown>
}

/** SiteManagementService orchestrates Admin BFF requests before forwarding them to site-service. */
@Injectable()
export class SiteManagementService {
  constructor(
    @Inject(SITE_MANAGEMENT_DOWNSTREAM)
    private readonly downstream: SiteManagementDownstream
  ) {}

  /** listSiteCards delegates card workspace reads with explicit tenant/operator context. */
  listSiteCards(tenantId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.listSiteCards(buildAdminContext(tenantId, source), source)
  }

  /** createSite delegates draft site creation without embedding lifecycle rules in the gateway. */
  createSite(tenantId: string, body: CreateSiteDto, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.createSite({ ...buildAdminContext(tenantId, source), ...body }, source)
  }

  /** updateSiteSettings delegates editable site settings to site-service. */
  updateSiteSettings(tenantId: string, siteId: string, body: UpdateSiteSettingsDto, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.updateSiteSettings({ context: buildAdminContext(tenantId, source), siteId, ...body }, source)
  }

  /** disableSite delegates site disablement to site-service lifecycle rules. */
  disableSite(tenantId: string, siteId: string, reason: string | undefined, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.disableSite({ context: buildAdminContext(tenantId, source), siteId, reason }, source)
  }

  /** addPreparingLocale delegates locale preparation to site-service. */
  addPreparingLocale(tenantId: string, siteId: string, body: AddPreparingLocaleDto, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.addPreparingLocale({ context: buildAdminContext(tenantId, source), siteId, ...body }, source)
  }

  /** checkLocaleCompleteness delegates locale validation to site-service. */
  checkLocaleCompleteness(tenantId: string, siteId: string, locale: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.checkLocaleCompleteness({ context: buildAdminContext(tenantId, source), siteId, locale }, source)
  }

  /** activateLocale delegates locale activation to site-service. */
  activateLocale(tenantId: string, siteId: string, locale: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.activateLocale({ context: buildAdminContext(tenantId, source), siteId, locale }, source)
  }

  /** disableLocale delegates locale hiding to site-service. */
  disableLocale(tenantId: string, siteId: string, locale: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.disableLocale({ context: buildAdminContext(tenantId, source), siteId, locale }, source)
  }

  /** listSiteCategories delegates site-owned category projection reads to site-service. */
  listSiteCategories(tenantId: string, siteId: string, locale: string | undefined, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.listSiteCategories({ context: buildAdminContext(tenantId, source), siteId, locale }, source)
  }

  /** createSiteCategory delegates site-owned category projection creation to site-service. */
  createSiteCategory(tenantId: string, siteId: string, body: CreateSiteCategoryDto, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.createSiteCategory({ context: buildAdminContext(tenantId, source), siteId, ...body }, source)
  }

  /** updateSiteCategory delegates category projection edits to site-service. */
  updateSiteCategory(
    tenantId: string,
    siteId: string,
    categoryId: string,
    body: UpdateSiteCategoryDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.updateSiteCategory({
      context: buildAdminContext(tenantId, source),
      siteId,
      categoryId,
      category: { ...body, categoryId, siteId }
    }, source)
  }

  /** unpublishSiteCategory delegates category unpublish commands to site-service. */
  unpublishSiteCategory(
    tenantId: string,
    siteId: string,
    categoryId: string,
    locale: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.unpublishSiteCategory({ context: buildAdminContext(tenantId, source), siteId, categoryId, locale }, source)
  }

  /** listSiteProducts delegates site-owned product read models to site-service. */
  listSiteProducts(tenantId: string, siteId: string, locale: string | undefined, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.listSiteProducts({ context: buildAdminContext(tenantId, source), siteId, locale }, source)
  }

  /** searchProductMasterForAdd delegates Product Master candidate lookup through the site-service anti-corruption boundary. */
  searchProductMasterForAdd(
    tenantId: string,
    siteId: string,
    query: { keyword?: string; page?: string; pageSize?: string },
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.searchProductMasterForAdd({
      context: buildAdminContext(tenantId, source),
      siteId,
      keyword: query.keyword,
      page: query.page ? Number(query.page) : undefined,
      pageSize: query.pageSize ? Number(query.pageSize) : undefined
    }, source)
  }

  /** getSiteProductPublication delegates product publication detail reads to site-service. */
  getSiteProductPublication(tenantId: string, siteId: string, publicationId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.getSiteProductPublication({ context: buildAdminContext(tenantId, source), siteId, publicationId }, source)
  }

  /** addProductsToSite delegates product publication creation to site-service. */
  addProductsToSite(tenantId: string, siteId: string, body: AddProductsToSiteDto, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.addProductsToSite({ context: buildAdminContext(tenantId, source), siteId, ...body }, source)
  }

  /** updateSiteProductPublication delegates site-owned product display edits to site-service. */
  updateSiteProductPublication(
    tenantId: string,
    siteId: string,
    publicationId: string,
    body: UpdateSiteProductPublicationDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.updateSiteProductPublication({
      context: buildAdminContext(tenantId, source),
      siteId,
      publicationId,
      publication: { ...body, publicationId, siteId }
    }, source)
  }

  /** unpublishSiteProduct delegates product unpublish commands to site-service. */
  unpublishSiteProduct(tenantId: string, siteId: string, publicationId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.unpublishSiteProduct({ context: buildAdminContext(tenantId, source), siteId, publicationId }, source)
  }

  /** syncAllPendingChanges delegates explicit publish sync to the owning site-service. */
  syncAllPendingChanges(tenantId: string, siteId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.syncAllPendingChanges({ context: buildAdminContext(tenantId, source), siteId }, source)
  }

  /** getPendingSyncSummary delegates pending sync summary reads to site-service. */
  getPendingSyncSummary(tenantId: string, siteId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.getPendingSyncSummary({ context: buildAdminContext(tenantId, source), siteId }, source)
  }

  /** listPendingSyncResources delegates pending resource reads to site-service. */
  listPendingSyncResources(tenantId: string, siteId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.listPendingSyncResources({ context: buildAdminContext(tenantId, source), siteId }, source)
  }

  /** listSyncHistory delegates sync history reads to site-service. */
  listSyncHistory(tenantId: string, siteId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.listSyncHistory({ context: buildAdminContext(tenantId, source), siteId }, source)
  }

  /** getSyncDetail delegates sync detail reads to site-service. */
  getSyncDetail(tenantId: string, syncId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.getSyncDetail({ context: buildAdminContext(tenantId, source), syncId }, source)
  }

  /** retryLastSync delegates sync retry without generating duplicate public views. */
  retryLastSync(tenantId: string, siteId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.retryLastSync({ context: buildAdminContext(tenantId, source), siteId }, source)
  }

  /** resendWebhook delegates webhook resend without advancing publish version. */
  resendWebhook(tenantId: string, syncId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.resendWebhook({ context: buildAdminContext(tenantId, source), syncId }, source)
  }

  /** issuePreviewToken delegates short-lived preview token issuance to the owning site-service. */
  issuePreviewToken(
    tenantId: string,
    siteId: string,
    body: IssuePreviewTokenDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.issuePreviewToken({ context: buildAdminContext(tenantId, source), siteId, ...body }, source)
  }

  /** generateSiteCredential delegates one-time Site Runtime credential generation to site-service. */
  generateSiteCredential(
    tenantId: string,
    siteId: string,
    body: GenerateSiteCredentialDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.generateSiteCredential({ context: buildAdminContext(tenantId, source), siteId, ...body }, source)
  }

  /** listSiteCredentials delegates metadata-only credential reads to site-service. */
  listSiteCredentials(tenantId: string, siteId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.listSiteCredentials({ context: buildAdminContext(tenantId, source), siteId }, source)
  }

  /** rotateSiteCredential delegates credential rotation while preserving Admin context. */
  rotateSiteCredential(
    tenantId: string,
    siteId: string,
    credentialId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.rotateSiteCredential({ context: buildAdminContext(tenantId, source), siteId, credentialId }, source)
  }

  /** revokeSiteCredential delegates credential revocation so future signed requests fail closed. */
  revokeSiteCredential(
    tenantId: string,
    siteId: string,
    credentialId: string,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.revokeSiteCredential({ context: buildAdminContext(tenantId, source), siteId, credentialId }, source)
  }

  /** createSiteContent delegates Blog/News container creation to site-service. */
  createSiteContent(
    tenantId: string,
    siteId: string,
    body: CreateSiteContentDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.createSiteContent({ context: buildAdminContext(tenantId, source), siteId, ...body }, source)
  }

  /** updateSiteContentLocaleVersion delegates Blog/News locale draft saves to site-service. */
  updateSiteContentLocaleVersion(
    tenantId: string,
    siteId: string,
    body: UpdateSiteContentLocaleVersionDto,
    source: DownstreamRequestSource
  ): Promise<unknown> {
    return this.downstream.updateSiteContentLocaleVersion({
      context: buildAdminContext(tenantId, source),
      siteId,
      version: body
    }, source)
  }

  /** listSiteContents delegates Blog/News list reads to site-service. */
  listSiteContents(tenantId: string, siteId: string, contentType: string | undefined, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.listSiteContents({ context: buildAdminContext(tenantId, source), siteId, contentType }, source)
  }

  /** getSiteContent delegates Blog/News detail reads to site-service. */
  getSiteContent(tenantId: string, siteId: string, contentId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.getSiteContent({ context: buildAdminContext(tenantId, source), siteId, contentId }, source)
  }

  /** unpublishSiteContent delegates content unpublish commands to site-service. */
  unpublishSiteContent(tenantId: string, siteId: string, contentId: string, locale: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.unpublishSiteContent({ context: buildAdminContext(tenantId, source), siteId, contentId, locale }, source)
  }

  /** listSiteAuditLogs delegates audit reads to site-service. */
  listSiteAuditLogs(tenantId: string, siteId: string, source: DownstreamRequestSource): Promise<unknown> {
    return this.downstream.listSiteAuditLogs({ context: buildAdminContext(tenantId, source), siteId }, source)
  }
}

/** buildAdminContext maps gateway identity and trace inputs into the site-service Admin context contract. */
function buildAdminContext(tenantId: string, source: DownstreamRequestSource): SiteManagementAdminContext {
  return {
    tenantId,
    orgId: normalize(source.user?.orgId),
    operatorId: normalize(source.user?.holderId ?? source.user?.aid ?? source.user?.id ?? source.user?.sub),
    traceId: normalize(source.traceId),
    requestId: normalize(source.requestId)
  }
}

/** normalize trims optional string values before they cross the BFF boundary. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
