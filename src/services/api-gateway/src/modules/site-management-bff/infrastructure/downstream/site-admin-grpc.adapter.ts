import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { GRPC_METADATA_PROPAGATION_FACTORY, GrpcMetadataPropagationFactory } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  CreateSiteContentRequest,
  CreateSiteRequest,
  GenerateSiteCredentialRequest,
  IssuePreviewTokenRequest,
  ListSiteCardsRequest,
  ListSitePagesRequest,
  RevokeSiteCredentialRequest,
  RotateSiteCredentialRequest,
  SITE_ADMIN_MANAGEMENT_SERVICE_NAME,
  SiteAdminManagementServiceClient,
  SyncAllPendingChangesRequest,
  UpdateSitePageGovernanceRequest,
  UpdateSiteContentLocaleVersionRequest
  , ListFaqCategoriesRequest, GetFaqCategoryRequest, CreateFaqCategoryRequest, UpdateFaqCategoryLocaleVersionRequest, DisableFaqCategoryRequest, ListFaqEntriesRequest, GetFaqEntryRequest, CreateFaqEntryRequest, UpdateFaqEntryLocaleVersionRequest, UnpublishFaqEntryRequest, CheckFaqCompletenessRequest
} from '@oes/common/generated/site_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../../common/grpc/gateway-downstream-source.mapper'
import {
  SiteManagementAdminContext,
  SiteManagementDownstream
} from '../../site-management.service'
import { CreateSiteDto } from '../../interface/http/dtos/site-management.dto'

const CALLER = 'api-gateway'

/** SiteAdminGrpcAdapter maps Admin Site Management BFF calls to the site-service gRPC contract. */
@Injectable()
export class SiteAdminGrpcAdapter implements SiteManagementDownstream, OnModuleInit {
  private siteAdmin!: SiteAdminManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.SITE)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  /** onModuleInit resolves the generated site admin gRPC client from the transport registry. */
  onModuleInit(): void {
    this.siteAdmin = this.client.getService<SiteAdminManagementServiceClient>(SITE_ADMIN_MANAGEMENT_SERVICE_NAME)
  }

  /** listSiteCards forwards the card workspace query with tenant/operator context. */
  listSiteCards(context: SiteManagementAdminContext, source: DownstreamRequestSource) {
    const request: ListSiteCardsRequest = {
      tenantId: context.tenantId,
      operatorId: context.operatorId,
      traceId: context.traceId
    }

    return this.call('listSiteCards', this.siteAdmin.listSiteCards(request, this.metadata(source)))
  }

  /** createSite forwards draft site creation to the owning site-service. */
  createSite(input: SiteManagementAdminContext & CreateSiteDto, source: DownstreamRequestSource) {
    const request: CreateSiteRequest = {
      tenantId: input.tenantId,
      orgId: input.orgId,
      operatorId: input.operatorId,
      traceId: input.traceId,
      siteName: input.siteName,
      siteType: input.siteType,
      brandId: input.brandId,
      regionCode: input.regionCode,
      channelCode: input.channelCode,
      defaultLocale: input.defaultLocale,
      primaryDomain: input.primaryDomain,
      previewBaseUrl: input.previewBaseUrl
    }

    return this.call('createSite', this.siteAdmin.createSite(request, this.metadata(source)))
  }

  /** updateSiteSettings forwards settings edits to site-service. */
  updateSiteSettings(input: any, source: DownstreamRequestSource) {
    return this.call('updateSiteSettings', this.siteAdmin.updateSiteSettings(input, this.metadata(source)))
  }

  /** disableSite forwards site disable commands to site-service. */
  disableSite(input: any, source: DownstreamRequestSource) {
    return this.call('disableSite', this.siteAdmin.disableSite(input, this.metadata(source)))
  }

  /** addPreparingLocale forwards locale creation commands to site-service. */
  addPreparingLocale(input: any, source: DownstreamRequestSource) {
    return this.call('addPreparingLocale', this.siteAdmin.addPreparingLocale(input, this.metadata(source)))
  }

  /** checkLocaleCompleteness forwards locale completeness queries to site-service. */
  checkLocaleCompleteness(input: any, source: DownstreamRequestSource) {
    return this.call('checkLocaleCompleteness', this.siteAdmin.checkLocaleCompleteness(input, this.metadata(source)))
  }

  /** activateLocale forwards locale activation commands to site-service. */
  activateLocale(input: any, source: DownstreamRequestSource) {
    return this.call('activateLocale', this.siteAdmin.activateLocale(input, this.metadata(source)))
  }

  /** disableLocale forwards locale disable commands to site-service. */
  disableLocale(input: any, source: DownstreamRequestSource) {
    return this.call('disableLocale', this.siteAdmin.disableLocale(input, this.metadata(source)))
  }

  /** listSitePages forwards discovery/governance reads to site-service. */
  listSitePages(input: any, source: DownstreamRequestSource) {
    const request: ListSitePagesRequest = {
      context: input.context,
      siteId: input.siteId
    }
    return this.call('listSitePages', this.siteAdmin.listSitePages(request, this.metadata(source)))
  }

  /** updateSitePageGovernance forwards page-wide governance intent to site-service. */
  updateSitePageGovernance(input: any, source: DownstreamRequestSource) {
    const request: UpdateSitePageGovernanceRequest = {
      context: input.context,
      siteId: input.siteId,
      pageKey: input.pageKey,
      enabled: input.enabled === true,
      indexable: input.indexable === true
    }
    return this.call('updateSitePageGovernance', this.siteAdmin.updateSitePageGovernance(request, this.metadata(source)))
  }

  /** listSiteCategories forwards category projection reads to site-service. */
  listSiteCategories(input: any, source: DownstreamRequestSource) {
    return this.call('listSiteCategories', this.siteAdmin.listSiteCategories(input, this.metadata(source)))
  }

  /** createSiteCategory forwards category projection creation to site-service. */
  createSiteCategory(input: any, source: DownstreamRequestSource) {
    return this.call('createSiteCategory', this.siteAdmin.createSiteCategory(input, this.metadata(source)))
  }

  /** updateSiteCategory forwards category projection edits to site-service. */
  updateSiteCategory(input: any, source: DownstreamRequestSource) {
    return this.call('updateSiteCategory', this.siteAdmin.updateSiteCategory(input, this.metadata(source)))
  }

  /** unpublishSiteCategory forwards category unpublish commands to site-service. */
  unpublishSiteCategory(input: any, source: DownstreamRequestSource) {
    return this.call('unpublishSiteCategory', this.siteAdmin.unpublishSiteCategory(input, this.metadata(source)))
  }

  /** listSiteProducts forwards product publication reads to site-service. */
  listSiteProducts(input: any, source: DownstreamRequestSource) {
    return this.call('listSiteProducts', this.siteAdmin.listSiteProducts(input, this.metadata(source)))
  }

  /** searchProductMasterForAdd forwards candidate lookup through site-service anti-corruption boundary. */
  searchProductMasterForAdd(input: any, source: DownstreamRequestSource) {
    return this.call('searchProductMasterForAdd', this.siteAdmin.searchProductMasterForAdd(input, this.metadata(source)))
  }

  /** getSiteProductPublication forwards product publication detail reads to site-service. */
  getSiteProductPublication(input: any, source: DownstreamRequestSource) {
    return this.call('getSiteProductPublication', this.siteAdmin.getSiteProductPublication(input, this.metadata(source)))
  }

  /** addProductsToSite forwards product publication create commands to site-service. */
  addProductsToSite(input: any, source: DownstreamRequestSource) {
    return this.call('addProductsToSite', this.siteAdmin.addProductsToSite(input, this.metadata(source)))
  }

  /** updateSiteProductPublication forwards product display edits to site-service. */
  updateSiteProductPublication(input: any, source: DownstreamRequestSource) {
    return this.call('updateSiteProductPublication', this.siteAdmin.updateSiteProductPublication(input, this.metadata(source)))
  }

  /** unpublishSiteProduct forwards product unpublish commands to site-service. */
  unpublishSiteProduct(input: any, source: DownstreamRequestSource) {
    return this.call('unpublishSiteProduct', this.siteAdmin.unpublishSiteProduct(input, this.metadata(source)))
  }

  /** syncAllPendingChanges forwards the explicit publish action without owning sync rules in the gateway. */
  syncAllPendingChanges(input: SyncAllPendingChangesRequest, source: DownstreamRequestSource) {
    return this.call(
      'syncAllPendingChanges',
      this.siteAdmin.syncAllPendingChanges(input, this.metadata(source))
    )
  }

  /** getPendingSyncSummary forwards pending sync summary reads to site-service. */
  getPendingSyncSummary(input: any, source: DownstreamRequestSource) {
    return this.call('getPendingSyncSummary', this.siteAdmin.getPendingSyncSummary(input, this.metadata(source)))
  }

  /** listPendingSyncResources forwards pending resource reads to site-service. */
  listPendingSyncResources(input: any, source: DownstreamRequestSource) {
    return this.call('listPendingSyncResources', this.siteAdmin.listPendingSyncResources(input, this.metadata(source)))
  }

  /** listSyncHistory forwards sync history reads to site-service. */
  listSyncHistory(input: any, source: DownstreamRequestSource) {
    return this.call('listSyncHistory', this.siteAdmin.listSyncHistory(input, this.metadata(source)))
  }

  /** getSyncDetail forwards sync detail reads to site-service. */
  getSyncDetail(input: any, source: DownstreamRequestSource) {
    return this.call('getSyncDetail', this.siteAdmin.getSyncDetail(input, this.metadata(source)))
  }

  /** retryLastSync forwards sync retry commands to site-service. */
  retryLastSync(input: any, source: DownstreamRequestSource) {
    return this.call('retryLastSync', this.siteAdmin.retryLastSync(input, this.metadata(source)))
  }

  /** resendWebhook forwards webhook resend commands to site-service. */
  resendWebhook(input: any, source: DownstreamRequestSource) {
    return this.call('resendWebhook', this.siteAdmin.resendWebhook(input, this.metadata(source)))
  }

  /** issuePreviewToken forwards short-lived preview-token issuance to site-service. */
  issuePreviewToken(input: IssuePreviewTokenRequest, source: DownstreamRequestSource) {
    return this.call('issuePreviewToken', this.siteAdmin.issuePreviewToken(input, this.metadata(source)))
  }

  /** generateSiteCredential forwards one-time credential generation to site-service. */
  generateSiteCredential(input: GenerateSiteCredentialRequest, source: DownstreamRequestSource) {
    return this.call('generateSiteCredential', this.siteAdmin.generateSiteCredential(input, this.metadata(source)))
  }

  /** listSiteCredentials forwards metadata-only credential reads to site-service. */
  listSiteCredentials(input: any, source: DownstreamRequestSource) {
    return this.call('listSiteCredentials', this.siteAdmin.listSiteCredentials(input, this.metadata(source)))
  }

  /** rotateSiteCredential forwards credential rotation to site-service. */
  rotateSiteCredential(input: RotateSiteCredentialRequest, source: DownstreamRequestSource) {
    return this.call('rotateSiteCredential', this.siteAdmin.rotateSiteCredential(input, this.metadata(source)))
  }

  /** revokeSiteCredential forwards credential revocation to site-service. */
  revokeSiteCredential(input: RevokeSiteCredentialRequest, source: DownstreamRequestSource) {
    return this.call('revokeSiteCredential', this.siteAdmin.revokeSiteCredential(input, this.metadata(source)))
  }

  /** createSiteContent forwards Blog/News container creation to site-service. */
  createSiteContent(input: CreateSiteContentRequest, source: DownstreamRequestSource) {
    return this.call('createSiteContent', this.siteAdmin.createSiteContent(input, this.metadata(source)))
  }

  /** updateSiteContentLocaleVersion forwards Blog/News locale draft saves to site-service. */
  updateSiteContentLocaleVersion(input: UpdateSiteContentLocaleVersionRequest, source: DownstreamRequestSource) {
    return this.call(
      'updateSiteContentLocaleVersion',
      this.siteAdmin.updateSiteContentLocaleVersion(input, this.metadata(source))
    )
  }

  /** listSiteContents forwards Blog/News list reads to site-service. */
  listSiteContents(input: any, source: DownstreamRequestSource) {
    return this.call('listSiteContents', this.siteAdmin.listSiteContents(input, this.metadata(source)))
  }

  /** getSiteContent forwards Blog/News detail reads to site-service. */
  getSiteContent(input: any, source: DownstreamRequestSource) {
    return this.call('getSiteContent', this.siteAdmin.getSiteContent(input, this.metadata(source)))
  }

  /** unpublishSiteContent forwards Blog/News unpublish commands to site-service. */
  unpublishSiteContent(input: any, source: DownstreamRequestSource) {
    return this.call('unpublishSiteContent', this.siteAdmin.unpublishSiteContent(input, this.metadata(source)))
  }

  /** listContentCategories forwards Blog/News Category reads to site-service. */
  listContentCategories(input: any, source: DownstreamRequestSource) {
    return this.call('listContentCategories', this.siteAdmin.listContentCategories(input, this.metadata(source)))
  }

  /** getContentCategory forwards one Blog/News Category read to site-service. */
  getContentCategory(input: any, source: DownstreamRequestSource) {
    return this.call('getContentCategory', this.siteAdmin.getContentCategory(input, this.metadata(source)))
  }

  /** createContentCategory forwards Category creation commands to site-service. */
  createContentCategory(input: any, source: DownstreamRequestSource) {
    return this.call('createContentCategory', this.siteAdmin.createContentCategory(input, this.metadata(source)))
  }

  /** updateContentCategoryLocaleVersion forwards Category locale draft saves to site-service. */
  updateContentCategoryLocaleVersion(input: any, source: DownstreamRequestSource) {
    return this.call(
      'updateContentCategoryLocaleVersion',
      this.siteAdmin.updateContentCategoryLocaleVersion(input, this.metadata(source))
    )
  }

  /** publishContentCategoryLocale forwards explicit locale publication approval. */
  publishContentCategoryLocale(input: any, source: DownstreamRequestSource) { return this.call('publishContentCategoryLocale', this.siteAdmin.publishContentCategoryLocale(input, this.metadata(source))) }
  /** reorderContentCategories forwards a complete global neutral rank sequence. */
  reorderContentCategories(input: any, source: DownstreamRequestSource) { return this.call('reorderContentCategories', this.siteAdmin.reorderContentCategories(input, this.metadata(source))) }
  /** deleteContentCategory forwards protected deletion and tombstone semantics. */
  deleteContentCategory(input: any, source: DownstreamRequestSource) { return this.call('deleteContentCategory', this.siteAdmin.deleteContentCategory(input, this.metadata(source))) }
  /** listVisibleContentCategories forwards usage-derived eligibility reads. */
  listVisibleContentCategories(input: any, source: DownstreamRequestSource) { return this.call('listVisibleContentCategories', this.siteAdmin.listVisibleContentCategories(input, this.metadata(source))) }
  /** checkContentCategoryCompleteness forwards locale publication readiness. */
  checkContentCategoryCompleteness(input: any, source: DownstreamRequestSource) { return this.call('checkContentCategoryCompleteness', this.siteAdmin.checkContentCategoryCompleteness(input, this.metadata(source))) }
  /** listContentCategoryUsage forwards Article usage projections. */
  listContentCategoryUsage(input: any, source: DownstreamRequestSource) { return this.call('listContentCategoryUsage', this.siteAdmin.listContentCategoryUsage(input, this.metadata(source))) }

  /** listFaqCategories forwards a typed FAQ Category list request. */
  listFaqCategories(input: ListFaqCategoriesRequest, source: DownstreamRequestSource) { return this.call('listFaqCategories', this.siteAdmin.listFaqCategories(input, this.metadata(source))) }
  /** getFaqCategory forwards a typed FAQ Category detail request. */
  getFaqCategory(input: GetFaqCategoryRequest, source: DownstreamRequestSource) { return this.call('getFaqCategory', this.siteAdmin.getFaqCategory(input, this.metadata(source))) }
  /** createFaqCategory forwards flat FAQ Category creation. */
  createFaqCategory(input: CreateFaqCategoryRequest, source: DownstreamRequestSource) { return this.call('createFaqCategory', this.siteAdmin.createFaqCategory(input, this.metadata(source))) }
  /** updateFaqCategoryLocaleVersion forwards typed Category locale content. */
  updateFaqCategoryLocaleVersion(input: UpdateFaqCategoryLocaleVersionRequest, source: DownstreamRequestSource) { return this.call('updateFaqCategoryLocaleVersion', this.siteAdmin.updateFaqCategoryLocaleVersion(input, this.metadata(source))) }
  /** disableFaqCategory forwards lifecycle validation to Site Service. */
  disableFaqCategory(input: DisableFaqCategoryRequest, source: DownstreamRequestSource) { return this.call('disableFaqCategory', this.siteAdmin.disableFaqCategory(input, this.metadata(source))) }
  /** listFaqEntries forwards an optional Category/locale filter. */
  listFaqEntries(input: ListFaqEntriesRequest, source: DownstreamRequestSource) { return this.call('listFaqEntries', this.siteAdmin.listFaqEntries(input, this.metadata(source))) }
  /** getFaqEntry forwards a typed Entry detail request. */
  getFaqEntry(input: GetFaqEntryRequest, source: DownstreamRequestSource) { return this.call('getFaqEntry', this.siteAdmin.getFaqEntry(input, this.metadata(source))) }
  /** createFaqEntry forwards one-Category Entry creation. */
  createFaqEntry(input: CreateFaqEntryRequest, source: DownstreamRequestSource) { return this.call('createFaqEntry', this.siteAdmin.createFaqEntry(input, this.metadata(source))) }
  /** updateFaqEntryLocaleVersion forwards typed Entry locale content. */
  updateFaqEntryLocaleVersion(input: UpdateFaqEntryLocaleVersionRequest, source: DownstreamRequestSource) { return this.call('updateFaqEntryLocaleVersion', this.siteAdmin.updateFaqEntryLocaleVersion(input, this.metadata(source))) }
  /** unpublishFaqEntry forwards one locale withdrawal. */
  unpublishFaqEntry(input: UnpublishFaqEntryRequest, source: DownstreamRequestSource) { return this.call('unpublishFaqEntry', this.siteAdmin.unpublishFaqEntry(input, this.metadata(source))) }
  /** checkFaqCompleteness forwards per-locale publication preflight. */
  checkFaqCompleteness(input: CheckFaqCompletenessRequest, source: DownstreamRequestSource) { return this.call('checkFaqCompleteness', this.siteAdmin.checkFaqCompleteness(input, this.metadata(source))) }

  /** listSiteAuditLogs forwards site audit queries to site-service. */
  listSiteAuditLogs(input: any, source: DownstreamRequestSource) {
    return this.call('listSiteAuditLogs', this.siteAdmin.listSiteAuditLogs(input, this.metadata(source)))
  }

  /** metadata creates operator-scoped gRPC metadata for Admin BFF calls. */
  private metadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
  }

  /** call wraps one site admin gRPC call with the shared gateway safety behavior. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts identifies the gateway caller and downstream method for transport error context. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
