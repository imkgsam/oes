import { Controller, Inject, UseFilters } from '@nestjs/common'
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
@Controller()
@SiteAdminManagementServiceControllerMethods()
export class SiteAdminGrpcController implements SiteAdminManagementServiceController {
  constructor(
    @Inject(SITE_ADMIN_APPLICATION)
    private readonly application: SiteAdminApplicationPort
  ) {}

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

  syncAllPendingChanges(request: SyncAllPendingChangesRequest): Promise<SyncAllPendingChangesResponse> {
    return this.application.syncAllPendingChanges(request)
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
