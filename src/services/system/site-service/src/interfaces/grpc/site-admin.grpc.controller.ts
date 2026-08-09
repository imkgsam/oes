import { Controller, Inject, Optional, UseFilters, UseGuards } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { AuthorizeBusinessRpc, getAuthenticatedGrpcRequestContext, SITE_MANAGEMENT_PERMISSION_CODES, TrustedExecutionGuard } from '@oes/common/authorization'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ActivateLocaleRequest,
  ActivateLocaleResponse,
  AddPreparingLocaleRequest,
  AddPreparingLocaleResponse,
  AddProductsToSiteRequest,
  AddProductsToSiteResponse,
  CheckLocaleCompletenessRequest,
  CheckLocaleCompletenessResponse,
  CreateSiteContentRequest,
  CreateSiteContentResponse,
  CreateContentCategoryRequest,
  CreateContentCategoryResponse,
  CreateSiteCategoryRequest,
  CreateSiteCategoryResponse,
  CreateSiteRequest,
  CreateSiteResponse,
  DisableLocaleRequest,
  DisableLocaleResponse,
  DisableSiteRequest,
  DisableSiteResponse,
  PublishContentCategoryLocaleRequest,
  PublishContentCategoryLocaleResponse,
  ReorderContentCategoriesRequest,
  ReorderContentCategoriesResponse,
  DeleteContentCategoryRequest,
  DeleteContentCategoryResponse,
  ListVisibleContentCategoriesRequest,
  ListVisibleContentCategoriesResponse,
  CheckContentCategoryCompletenessRequest,
  CheckContentCategoryCompletenessResponse,
  ListContentCategoryUsageRequest,
  ListContentCategoryUsageResponse,
  GenerateSiteCredentialRequest,
  GenerateSiteCredentialResponse,
  GetPendingSyncSummaryRequest,
  GetPendingSyncSummaryResponse,
  GetSiteContentRequest,
  GetSiteContentResponse,
  GetContentCategoryRequest,
  GetContentCategoryResponse,
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
  ListSiteCategoriesRequest,
  ListSiteCategoriesResponse,
  ListSiteCredentialsRequest,
  ListSiteCredentialsResponse,
  ListSiteContentsRequest,
  ListSiteContentsResponse,
  ListContentCategoriesRequest,
  ListContentCategoriesResponse,
  ListSiteProductsRequest,
  ListSiteProductsResponse,
  ListSitePagesRequest,
  ListSitePagesResponse,
  ListSyncHistoryRequest,
  ListSyncHistoryResponse,
  ResendWebhookRequest,
  ResendWebhookResponse,
  RetryLastSyncRequest,
  RetryLastSyncResponse,
  RevokeSiteCredentialRequest,
  RevokeSiteCredentialResponse,
  RotateSiteCredentialRequest,
  RotateSiteCredentialResponse,
  SearchProductMasterForAddRequest,
  SearchProductMasterForAddResponse,
  SiteAdminManagementServiceController,
  SiteAdminManagementServiceControllerMethods,
  SyncAllPendingChangesRequest,
  SyncAllPendingChangesResponse,
  UnpublishSiteContentRequest,
  UnpublishSiteContentResponse,
  UnpublishSiteCategoryRequest,
  UnpublishSiteCategoryResponse,
  UnpublishSiteProductRequest,
  UnpublishSiteProductResponse,
  UpdateSiteContentLocaleVersionRequest,
  UpdateSiteContentLocaleVersionResponse,
  UpdateContentCategoryLocaleVersionRequest,
  UpdateContentCategoryLocaleVersionResponse,
  UpdateSiteCategoryRequest,
  UpdateSiteCategoryResponse,
  UpdateSiteProductPublicationRequest,
  UpdateSiteProductPublicationResponse,
  UpdateSiteSettingsRequest,
  UpdateSiteSettingsResponse,
  UpdateSitePageGovernanceRequest,
  UpdateSitePageGovernanceResponse
  , ListFaqCategoriesRequest, ListFaqCategoriesResponse, GetFaqCategoryRequest, GetFaqCategoryResponse, CreateFaqCategoryRequest, CreateFaqCategoryResponse, UpdateFaqCategoryLocaleVersionRequest, UpdateFaqCategoryLocaleVersionResponse, DisableFaqCategoryRequest, DisableFaqCategoryResponse, ListFaqEntriesRequest, ListFaqEntriesResponse, GetFaqEntryRequest, GetFaqEntryResponse, CreateFaqEntryRequest, CreateFaqEntryResponse, UpdateFaqEntryLocaleVersionRequest, UpdateFaqEntryLocaleVersionResponse, UnpublishFaqEntryRequest, UnpublishFaqEntryResponse, CheckFaqCompletenessRequest, CheckFaqCompletenessResponse
} from '@oes/common/generated/site_service'
import { ASSET_SITE_MEDIA_PORT } from '../../application/ports/asset-site-media.port'
import { SiteTrustedAssetGrpcAdapter } from '../../infrastructure/grpc/site-trusted-asset.grpc.adapter'

export interface SiteAdminApplicationPort {
  listSiteCards(request: ListSiteCardsRequest): Promise<ListSiteCardsResponse>
  createSite(request: CreateSiteRequest): Promise<CreateSiteResponse>
  updateSiteSettings(request: UpdateSiteSettingsRequest): Promise<UpdateSiteSettingsResponse>
  disableSite(request: DisableSiteRequest): Promise<DisableSiteResponse>
  addPreparingLocale(request: AddPreparingLocaleRequest): Promise<AddPreparingLocaleResponse>
  checkLocaleCompleteness(request: CheckLocaleCompletenessRequest): Promise<CheckLocaleCompletenessResponse>
  activateLocale(request: ActivateLocaleRequest): Promise<ActivateLocaleResponse>
  disableLocale(request: DisableLocaleRequest): Promise<DisableLocaleResponse>
  listSitePages(request: ListSitePagesRequest): Promise<ListSitePagesResponse>
  updateSitePageGovernance(request: UpdateSitePageGovernanceRequest): Promise<UpdateSitePageGovernanceResponse>
  listSiteCategories(request: ListSiteCategoriesRequest): Promise<ListSiteCategoriesResponse>
  createSiteCategory(request: CreateSiteCategoryRequest): Promise<CreateSiteCategoryResponse>
  updateSiteCategory(request: UpdateSiteCategoryRequest): Promise<UpdateSiteCategoryResponse>
  unpublishSiteCategory(request: UnpublishSiteCategoryRequest): Promise<UnpublishSiteCategoryResponse>
  listSiteProducts(request: ListSiteProductsRequest): Promise<ListSiteProductsResponse>
  searchProductMasterForAdd(request: SearchProductMasterForAddRequest): Promise<SearchProductMasterForAddResponse>
  getSiteProductPublication(request: GetSiteProductPublicationRequest): Promise<GetSiteProductPublicationResponse>
  addProductsToSite(request: AddProductsToSiteRequest): Promise<AddProductsToSiteResponse>
  updateSiteProductPublication(request: UpdateSiteProductPublicationRequest): Promise<UpdateSiteProductPublicationResponse>
  unpublishSiteProduct(request: UnpublishSiteProductRequest): Promise<UnpublishSiteProductResponse>
  listSiteContents(request: ListSiteContentsRequest): Promise<ListSiteContentsResponse>
  getSiteContent(request: GetSiteContentRequest): Promise<GetSiteContentResponse>
  createSiteContent(request: CreateSiteContentRequest): Promise<CreateSiteContentResponse>
  updateSiteContentLocaleVersion(request: UpdateSiteContentLocaleVersionRequest): Promise<UpdateSiteContentLocaleVersionResponse>
  unpublishSiteContent(request: UnpublishSiteContentRequest): Promise<UnpublishSiteContentResponse>
  listContentCategories(request: ListContentCategoriesRequest): Promise<ListContentCategoriesResponse>
  getContentCategory(request: GetContentCategoryRequest): Promise<GetContentCategoryResponse>
  createContentCategory(request: CreateContentCategoryRequest): Promise<CreateContentCategoryResponse>
  updateContentCategoryLocaleVersion(request: UpdateContentCategoryLocaleVersionRequest): Promise<UpdateContentCategoryLocaleVersionResponse>
  publishContentCategoryLocale(request: PublishContentCategoryLocaleRequest): Promise<PublishContentCategoryLocaleResponse>
  reorderContentCategories(request: ReorderContentCategoriesRequest): Promise<ReorderContentCategoriesResponse>
  deleteContentCategory(request: DeleteContentCategoryRequest): Promise<DeleteContentCategoryResponse>
  listVisibleContentCategories(request: ListVisibleContentCategoriesRequest): Promise<ListVisibleContentCategoriesResponse>
  checkContentCategoryCompleteness(request: CheckContentCategoryCompletenessRequest): Promise<CheckContentCategoryCompletenessResponse>
  listContentCategoryUsage(request: ListContentCategoryUsageRequest): Promise<ListContentCategoryUsageResponse>
  getPendingSyncSummary(request: GetPendingSyncSummaryRequest): Promise<GetPendingSyncSummaryResponse>
  listPendingSyncResources(request: ListPendingSyncResourcesRequest): Promise<ListPendingSyncResourcesResponse>
  listSyncHistory(request: ListSyncHistoryRequest): Promise<ListSyncHistoryResponse>
  getSyncDetail(request: GetSyncDetailRequest): Promise<GetSyncDetailResponse>
  syncAllPendingChanges(request: SyncAllPendingChangesRequest): Promise<SyncAllPendingChangesResponse>
  retryLastSync(request: RetryLastSyncRequest): Promise<RetryLastSyncResponse>
  resendWebhook(request: ResendWebhookRequest): Promise<ResendWebhookResponse>
  listSiteCredentials(request: ListSiteCredentialsRequest): Promise<ListSiteCredentialsResponse>
  generateSiteCredential(request: GenerateSiteCredentialRequest): Promise<GenerateSiteCredentialResponse>
  rotateSiteCredential(request: RotateSiteCredentialRequest): Promise<RotateSiteCredentialResponse>
  revokeSiteCredential(request: RevokeSiteCredentialRequest): Promise<RevokeSiteCredentialResponse>
  listSiteAuditLogs(request: ListSiteAuditLogsRequest): Promise<ListSiteAuditLogsResponse>
  issuePreviewToken(request: IssuePreviewTokenRequest): Promise<IssuePreviewTokenResponse>
  listFaqCategories(request: ListFaqCategoriesRequest): Promise<ListFaqCategoriesResponse>
  getFaqCategory(request: GetFaqCategoryRequest): Promise<GetFaqCategoryResponse>
  createFaqCategory(request: CreateFaqCategoryRequest): Promise<CreateFaqCategoryResponse>
  updateFaqCategoryLocaleVersion(request: UpdateFaqCategoryLocaleVersionRequest): Promise<UpdateFaqCategoryLocaleVersionResponse>
  disableFaqCategory(request: DisableFaqCategoryRequest): Promise<DisableFaqCategoryResponse>
  listFaqEntries(request: ListFaqEntriesRequest): Promise<ListFaqEntriesResponse>
  getFaqEntry(request: GetFaqEntryRequest): Promise<GetFaqEntryResponse>
  createFaqEntry(request: CreateFaqEntryRequest): Promise<CreateFaqEntryResponse>
  updateFaqEntryLocaleVersion(request: UpdateFaqEntryLocaleVersionRequest): Promise<UpdateFaqEntryLocaleVersionResponse>
  unpublishFaqEntry(request: UnpublishFaqEntryRequest): Promise<UnpublishFaqEntryResponse>
  checkFaqCompleteness(request: CheckFaqCompletenessRequest): Promise<CheckFaqCompletenessResponse>
}

export const SITE_ADMIN_APPLICATION = Symbol('SITE_ADMIN_APPLICATION')

/** SiteAdminGrpcController exposes the internal Admin management gRPC contract as a thin protocol adapter. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@Controller()
@SiteAdminManagementServiceControllerMethods()
export class SiteAdminGrpcController implements SiteAdminManagementServiceController {
  private readonly application: SiteAdminApplicationPort

  constructor(
    @Inject(SITE_ADMIN_APPLICATION)
    application: SiteAdminApplicationPort,
    @Optional() @Inject(ASSET_SITE_MEDIA_PORT)
    private readonly assetScope?: SiteTrustedAssetGrpcAdapter
  ) {
    this.application = trustedAdminApplication(application)
  }

  /** listFaqCategories forwards FAQ administration reads to the owning application boundary. */
  listFaqCategories(request: ListFaqCategoriesRequest): Promise<ListFaqCategoriesResponse> { return this.application.listFaqCategories(request) }
  /** getFaqCategory forwards a scoped FAQ Category read. */
  getFaqCategory(request: GetFaqCategoryRequest): Promise<GetFaqCategoryResponse> { return this.application.getFaqCategory(request) }
  /** createFaqCategory forwards one FAQ Category command. */
  createFaqCategory(request: CreateFaqCategoryRequest): Promise<CreateFaqCategoryResponse> { return this.application.createFaqCategory(request) }
  /** updateFaqCategoryLocaleVersion forwards locale-scoped FAQ Category editing. */
  updateFaqCategoryLocaleVersion(request: UpdateFaqCategoryLocaleVersionRequest): Promise<UpdateFaqCategoryLocaleVersionResponse> { return this.application.updateFaqCategoryLocaleVersion(request) }
  /** disableFaqCategory forwards the protected Category lifecycle command. */
  disableFaqCategory(request: DisableFaqCategoryRequest): Promise<DisableFaqCategoryResponse> { return this.application.disableFaqCategory(request) }
  /** listFaqEntries forwards FAQ Entry reads. */
  listFaqEntries(request: ListFaqEntriesRequest): Promise<ListFaqEntriesResponse> { return this.application.listFaqEntries(request) }
  /** getFaqEntry forwards one scoped FAQ Entry read. */
  getFaqEntry(request: GetFaqEntryRequest): Promise<GetFaqEntryResponse> { return this.application.getFaqEntry(request) }
  /** createFaqEntry forwards one Entry creation command. */
  createFaqEntry(request: CreateFaqEntryRequest): Promise<CreateFaqEntryResponse> { return this.application.createFaqEntry(request) }
  /** updateFaqEntryLocaleVersion forwards locale-scoped FAQ Entry editing. */
  updateFaqEntryLocaleVersion(request: UpdateFaqEntryLocaleVersionRequest): Promise<UpdateFaqEntryLocaleVersionResponse> { return this.application.updateFaqEntryLocaleVersion(request) }
  /** unpublishFaqEntry forwards FAQ Entry publication withdrawal. */
  unpublishFaqEntry(request: UnpublishFaqEntryRequest): Promise<UnpublishFaqEntryResponse> { return this.application.unpublishFaqEntry(request) }
  /** checkFaqCompleteness forwards per-locale FAQ preflight validation. */
  checkFaqCompleteness(request: CheckFaqCompletenessRequest): Promise<CheckFaqCompletenessResponse> { return this.application.checkFaqCompleteness(request) }

  listSiteCards(request: ListSiteCardsRequest): Promise<ListSiteCardsResponse> {
    return this.application.listSiteCards(request)
  }

  createSite(request: CreateSiteRequest): Promise<CreateSiteResponse> {
    return this.application.createSite(request)
  }

  updateSiteSettings(request: UpdateSiteSettingsRequest): Promise<UpdateSiteSettingsResponse> {
    return this.application.updateSiteSettings(request)
  }

  disableSite(request: DisableSiteRequest): Promise<DisableSiteResponse> {
    return this.application.disableSite(request)
  }

  addPreparingLocale(request: AddPreparingLocaleRequest): Promise<AddPreparingLocaleResponse> {
    return this.application.addPreparingLocale(request)
  }

  checkLocaleCompleteness(request: CheckLocaleCompletenessRequest): Promise<CheckLocaleCompletenessResponse> {
    return this.application.checkLocaleCompleteness(request)
  }

  activateLocale(request: ActivateLocaleRequest): Promise<ActivateLocaleResponse> {
    return this.application.activateLocale(request)
  }

  disableLocale(request: DisableLocaleRequest): Promise<DisableLocaleResponse> {
    return this.application.disableLocale(request)
  }

  listSitePages(request: ListSitePagesRequest): Promise<ListSitePagesResponse> {
    return this.application.listSitePages(request)
  }

  updateSitePageGovernance(request: UpdateSitePageGovernanceRequest): Promise<UpdateSitePageGovernanceResponse> {
    return this.application.updateSitePageGovernance(request)
  }

  listSiteCategories(request: ListSiteCategoriesRequest): Promise<ListSiteCategoriesResponse> {
    return this.application.listSiteCategories(request)
  }

  createSiteCategory(request: CreateSiteCategoryRequest): Promise<CreateSiteCategoryResponse> {
    return this.application.createSiteCategory(request)
  }

  updateSiteCategory(request: UpdateSiteCategoryRequest): Promise<UpdateSiteCategoryResponse> {
    return this.application.updateSiteCategory(request)
  }

  unpublishSiteCategory(request: UnpublishSiteCategoryRequest): Promise<UnpublishSiteCategoryResponse> {
    return this.application.unpublishSiteCategory(request)
  }

  listSiteProducts(request: ListSiteProductsRequest): Promise<ListSiteProductsResponse> {
    return this.application.listSiteProducts(request)
  }

  searchProductMasterForAdd(request: SearchProductMasterForAddRequest): Promise<SearchProductMasterForAddResponse> {
    return this.application.searchProductMasterForAdd(request)
  }

  getSiteProductPublication(request: GetSiteProductPublicationRequest): Promise<GetSiteProductPublicationResponse> {
    return this.application.getSiteProductPublication(request)
  }

  addProductsToSite(request: AddProductsToSiteRequest): Promise<AddProductsToSiteResponse> {
    return this.application.addProductsToSite(request)
  }

  updateSiteProductPublication(request: UpdateSiteProductPublicationRequest): Promise<UpdateSiteProductPublicationResponse> {
    return this.application.updateSiteProductPublication(request)
  }

  unpublishSiteProduct(request: UnpublishSiteProductRequest): Promise<UnpublishSiteProductResponse> {
    return this.application.unpublishSiteProduct(request)
  }

  listSiteContents(request: ListSiteContentsRequest): Promise<ListSiteContentsResponse> {
    return this.application.listSiteContents(request)
  }

  getSiteContent(request: GetSiteContentRequest): Promise<GetSiteContentResponse> {
    return this.application.getSiteContent(request)
  }

  createSiteContent(request: CreateSiteContentRequest): Promise<CreateSiteContentResponse> {
    return this.application.createSiteContent(request)
  }

  updateSiteContentLocaleVersion(request: UpdateSiteContentLocaleVersionRequest): Promise<UpdateSiteContentLocaleVersionResponse> {
    return this.application.updateSiteContentLocaleVersion(request)
  }

  unpublishSiteContent(request: UnpublishSiteContentRequest): Promise<UnpublishSiteContentResponse> {
    return this.application.unpublishSiteContent(request)
  }

  listContentCategories(request: ListContentCategoriesRequest): Promise<ListContentCategoriesResponse> {
    return this.application.listContentCategories(request)
  }

  getContentCategory(request: GetContentCategoryRequest): Promise<GetContentCategoryResponse> {
    return this.application.getContentCategory(request)
  }

  createContentCategory(request: CreateContentCategoryRequest): Promise<CreateContentCategoryResponse> {
    return this.application.createContentCategory(request)
  }

  updateContentCategoryLocaleVersion(
    request: UpdateContentCategoryLocaleVersionRequest
  ): Promise<UpdateContentCategoryLocaleVersionResponse> {
    return this.application.updateContentCategoryLocaleVersion(request)
  }

  /** publishContentCategoryLocale forwards explicit locale publication approval. */
  publishContentCategoryLocale(request: PublishContentCategoryLocaleRequest): Promise<PublishContentCategoryLocaleResponse> { return this.application.publishContentCategoryLocale(request) }
  /** reorderContentCategories forwards the complete global Category ordering command. */
  reorderContentCategories(request: ReorderContentCategoriesRequest): Promise<ReorderContentCategoriesResponse> { return this.application.reorderContentCategories(request) }
  /** deleteContentCategory forwards protected delete and tombstone semantics. */
  deleteContentCategory(request: DeleteContentCategoryRequest): Promise<DeleteContentCategoryResponse> { return this.application.deleteContentCategory(request) }
  /** listVisibleContentCategories forwards usage-derived public eligibility reads. */
  listVisibleContentCategories(request: ListVisibleContentCategoriesRequest): Promise<ListVisibleContentCategoriesResponse> { return this.application.listVisibleContentCategories(request) }
  /** checkContentCategoryCompleteness forwards locale publication readiness diagnostics. */
  checkContentCategoryCompleteness(request: CheckContentCategoryCompletenessRequest): Promise<CheckContentCategoryCompletenessResponse> { return this.application.checkContentCategoryCompleteness(request) }
  /** listContentCategoryUsage forwards published and draft Article reference projections. */
  listContentCategoryUsage(request: ListContentCategoryUsageRequest): Promise<ListContentCategoryUsageResponse> { return this.application.listContentCategoryUsage(request) }

  getPendingSyncSummary(request: GetPendingSyncSummaryRequest): Promise<GetPendingSyncSummaryResponse> {
    return this.application.getPendingSyncSummary(request)
  }

  listPendingSyncResources(request: ListPendingSyncResourcesRequest): Promise<ListPendingSyncResourcesResponse> {
    return this.application.listPendingSyncResources(request)
  }

  listSyncHistory(request: ListSyncHistoryRequest): Promise<ListSyncHistoryResponse> {
    return this.application.listSyncHistory(request)
  }

  getSyncDetail(request: GetSyncDetailRequest): Promise<GetSyncDetailResponse> {
    return this.application.getSyncDetail(request)
  }

  syncAllPendingChanges(request: SyncAllPendingChangesRequest, metadata?: Metadata): Promise<SyncAllPendingChangesResponse> {
    if (!this.assetScope || !metadata) return this.application.syncAllPendingChanges(request)
    return this.assetScope.runWithInboundScope(request, metadata, () => this.application.syncAllPendingChanges(request))
  }

  retryLastSync(request: RetryLastSyncRequest): Promise<RetryLastSyncResponse> {
    return this.application.retryLastSync(request)
  }

  resendWebhook(request: ResendWebhookRequest): Promise<ResendWebhookResponse> {
    return this.application.resendWebhook(request)
  }

  listSiteCredentials(request: ListSiteCredentialsRequest): Promise<ListSiteCredentialsResponse> {
    return this.application.listSiteCredentials(request)
  }

  generateSiteCredential(request: GenerateSiteCredentialRequest): Promise<GenerateSiteCredentialResponse> {
    return this.application.generateSiteCredential(request)
  }

  rotateSiteCredential(request: RotateSiteCredentialRequest): Promise<RotateSiteCredentialResponse> {
    return this.application.rotateSiteCredential(request)
  }

  revokeSiteCredential(request: RevokeSiteCredentialRequest): Promise<RevokeSiteCredentialResponse> {
    return this.application.revokeSiteCredential(request)
  }

  listSiteAuditLogs(request: ListSiteAuditLogsRequest): Promise<ListSiteAuditLogsResponse> {
    return this.application.listSiteAuditLogs(request)
  }

  issuePreviewToken(request: IssuePreviewTokenRequest): Promise<IssuePreviewTokenResponse> {
    return this.application.issuePreviewToken(request)
  }
}

/** Wraps every Admin application call with guard-derived context and discards any request-body identity copy. */
function trustedAdminApplication(application: SiteAdminApplicationPort): SiteAdminApplicationPort {
  return new Proxy(application, {
    get(target, property, receiver) {
      const method = Reflect.get(target, property, receiver)
      if (typeof method !== 'function') return method
      return (request: object, ...rest: unknown[]) => method.call(target, withTrustedAdminContext(request), ...rest)
    }
  })
}

/** Creates the internal-only context used by legacy application signatures from verified ExecutionToken claims. */
function withTrustedAdminContext<T extends object>(request: T): T {
  const verified = getAuthenticatedGrpcRequestContext(request)?.verifiedExecutionToken
  if (!verified?.tenantId || !verified.subject) throw new Error('Trusted Admin execution context is required')
  return Object.freeze({ ...request, context: Object.freeze({ tenantId: verified.tenantId, orgId: verified.orgId, operatorId: verified.subject }) }) as T
}

/** Installs the frozen one-code BUSINESS declaration for every Site Admin RPC. */
const ADMIN_PERMISSION_GROUPS: Readonly<Record<string, string>> = Object.freeze({
  listSiteCards: SITE_MANAGEMENT_PERMISSION_CODES.READ,
  listSitePages: SITE_MANAGEMENT_PERMISSION_CODES.READ,
  getPendingSyncSummary: SITE_MANAGEMENT_PERMISSION_CODES.READ,
  listPendingSyncResources: SITE_MANAGEMENT_PERMISSION_CODES.READ,
  listSyncHistory: SITE_MANAGEMENT_PERMISSION_CODES.READ,
  getSyncDetail: SITE_MANAGEMENT_PERMISSION_CODES.READ,
  createSite: SITE_MANAGEMENT_PERMISSION_CODES.MANAGE,
  updateSiteSettings: SITE_MANAGEMENT_PERMISSION_CODES.MANAGE,
  disableSite: SITE_MANAGEMENT_PERMISSION_CODES.MANAGE,
  updateSitePageGovernance: SITE_MANAGEMENT_PERMISSION_CODES.MANAGE,
  addPreparingLocale: SITE_MANAGEMENT_PERMISSION_CODES.LOCALE_MANAGE,
  checkLocaleCompleteness: SITE_MANAGEMENT_PERMISSION_CODES.LOCALE_MANAGE,
  activateLocale: SITE_MANAGEMENT_PERMISSION_CODES.LOCALE_MANAGE,
  disableLocale: SITE_MANAGEMENT_PERMISSION_CODES.LOCALE_MANAGE,
  listSiteCategories: SITE_MANAGEMENT_PERMISSION_CODES.PRODUCT_MANAGE,
  createSiteCategory: SITE_MANAGEMENT_PERMISSION_CODES.PRODUCT_MANAGE,
  updateSiteCategory: SITE_MANAGEMENT_PERMISSION_CODES.PRODUCT_MANAGE,
  unpublishSiteCategory: SITE_MANAGEMENT_PERMISSION_CODES.PRODUCT_MANAGE,
  listSiteProducts: SITE_MANAGEMENT_PERMISSION_CODES.PRODUCT_MANAGE,
  searchProductMasterForAdd: SITE_MANAGEMENT_PERMISSION_CODES.PRODUCT_MANAGE,
  getSiteProductPublication: SITE_MANAGEMENT_PERMISSION_CODES.PRODUCT_MANAGE,
  addProductsToSite: SITE_MANAGEMENT_PERMISSION_CODES.PRODUCT_MANAGE,
  updateSiteProductPublication: SITE_MANAGEMENT_PERMISSION_CODES.PRODUCT_MANAGE,
  unpublishSiteProduct: SITE_MANAGEMENT_PERMISSION_CODES.PRODUCT_MANAGE,
  listSiteContents: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  getSiteContent: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  createSiteContent: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  updateSiteContentLocaleVersion: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  unpublishSiteContent: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  listContentCategories: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  getContentCategory: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  createContentCategory: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  updateContentCategoryLocaleVersion: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  publishContentCategoryLocale: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  reorderContentCategories: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  deleteContentCategory: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  listVisibleContentCategories: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  checkContentCategoryCompleteness: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  listContentCategoryUsage: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  listFaqCategories: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  getFaqCategory: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  createFaqCategory: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  updateFaqCategoryLocaleVersion: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  disableFaqCategory: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  listFaqEntries: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  getFaqEntry: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  createFaqEntry: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  updateFaqEntryLocaleVersion: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  unpublishFaqEntry: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  checkFaqCompleteness: SITE_MANAGEMENT_PERMISSION_CODES.CONTENT_MANAGE,
  syncAllPendingChanges: SITE_MANAGEMENT_PERMISSION_CODES.SYNC,
  retryLastSync: SITE_MANAGEMENT_PERMISSION_CODES.SYNC,
  resendWebhook: SITE_MANAGEMENT_PERMISSION_CODES.SYNC,
  listSiteCredentials: SITE_MANAGEMENT_PERMISSION_CODES.CREDENTIAL_MANAGE,
  generateSiteCredential: SITE_MANAGEMENT_PERMISSION_CODES.CREDENTIAL_MANAGE,
  rotateSiteCredential: SITE_MANAGEMENT_PERMISSION_CODES.CREDENTIAL_MANAGE,
  revokeSiteCredential: SITE_MANAGEMENT_PERMISSION_CODES.CREDENTIAL_MANAGE,
  listSiteAuditLogs: SITE_MANAGEMENT_PERMISSION_CODES.AUDIT_READ,
  issuePreviewToken: SITE_MANAGEMENT_PERMISSION_CODES.PREVIEW
})

for (const [methodName, permission] of Object.entries(ADMIN_PERMISSION_GROUPS)) {
  const descriptor = Object.getOwnPropertyDescriptor(SiteAdminGrpcController.prototype, methodName)
  if (!descriptor) throw new Error(`Missing Site Admin RPC method: ${methodName}`)
  AuthorizeBusinessRpc({ all: [permission] })(SiteAdminGrpcController.prototype, methodName, descriptor)
}
