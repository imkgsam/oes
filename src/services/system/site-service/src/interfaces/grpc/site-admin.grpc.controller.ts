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
  CreateSiteCategoryRequest,
  CreateSiteCategoryResponse,
  CreateSiteRequest,
  CreateSiteResponse,
  DisableLocaleRequest,
  DisableLocaleResponse,
  DisableSiteRequest,
  DisableSiteResponse,
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
  ListSiteCategoriesRequest,
  ListSiteCategoriesResponse,
  ListSiteCredentialsRequest,
  ListSiteCredentialsResponse,
  ListSiteContentsRequest,
  ListSiteContentsResponse,
  ListSiteProductsRequest,
  ListSiteProductsResponse,
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
  UpdateSiteCategoryRequest,
  UpdateSiteCategoryResponse,
  UpdateSiteProductPublicationRequest,
  UpdateSiteProductPublicationResponse,
  UpdateSiteSettingsRequest,
  UpdateSiteSettingsResponse
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
