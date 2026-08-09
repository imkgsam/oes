import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { Metadata } from '@grpc/grpc-js'
import { SITE_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
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
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import {
  SiteManagementAdminContext,
  SiteManagementDownstream
} from '../../site-management.service'
import { CreateSiteDto } from '../../interface/http/dtos/site-management.dto'
import { GatewayTrustedGrpcExecutionProducer } from '../../../../common/grpc/gateway-trusted-grpc-execution-producer'
import { GatewayAssetGrpcClient } from '../../../../common/grpc/gateway-asset-grpc.client'
import { ASSET_SITE_MEDIA_PERMISSION_CODES } from '@oes/common/authorization'
import { Observable } from 'rxjs'
import { SiteMediaAssetServiceClient, UploadSiteMediaRequest, ListAuthorizedSiteMediaRequest, PrepareSiteMediaRemoteDeliveryRequest, ActivateSiteMediaRemoteDeliveryRequest, ArchiveSiteMediaRequest, TakeDownSiteMediaRequest, GetSiteMediaDeliveryStatusRequest, DeleteSiteMediaRequest } from '@oes/common/generated/asset_service'

const CALLER = 'api-gateway'
const SITE_AUDIENCE = 'urn:oes:service:site-service'
const ASSET_AUDIENCE = 'urn:oes:service:asset-service'
const ASSET_MEDIA_BY_METHOD: Readonly<Record<string, string>> = Object.freeze({ uploadSiteMedia: ASSET_SITE_MEDIA_PERMISSION_CODES.UPLOAD, listAuthorizedSiteMedia: ASSET_SITE_MEDIA_PERMISSION_CODES.READ, getSiteMediaDeliveryStatus: ASSET_SITE_MEDIA_PERMISSION_CODES.READ, prepareSiteMediaRemoteDelivery: ASSET_SITE_MEDIA_PERMISSION_CODES.DELIVERY_MANAGE, activateSiteMediaRemoteDelivery: ASSET_SITE_MEDIA_PERMISSION_CODES.DELIVERY_MANAGE, archiveSiteMedia: ASSET_SITE_MEDIA_PERMISSION_CODES.ARCHIVE, takeDownSiteMedia: ASSET_SITE_MEDIA_PERMISSION_CODES.TAKEDOWN, deleteSiteMedia: ASSET_SITE_MEDIA_PERMISSION_CODES.DELETE })

/** Maps every frozen Site Admin RPC to its single BUSINESS permission declaration. */
const ADMIN_PERMISSION_BY_METHOD: Readonly<Record<string, string>> = Object.freeze({
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

/** SiteAdminGrpcAdapter maps Admin Site Management BFF calls to the site-service gRPC contract. */
@Injectable()
export class SiteAdminGrpcAdapter implements SiteManagementDownstream, OnModuleInit {
  private siteAdmin!: SiteAdminManagementServiceClient
  private siteMedia!: SiteMediaAssetServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.SITE)
    private readonly client: ClientGrpc,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer,
    private readonly assetClient?: GatewayAssetGrpcClient
  ) {}

  /** onModuleInit resolves the generated site admin gRPC client from the transport registry. */
  onModuleInit(): void {
    this.siteAdmin = this.client.getService<SiteAdminManagementServiceClient>(SITE_ADMIN_MANAGEMENT_SERVICE_NAME)
    if (this.assetClient) this.siteMedia = this.assetClient.getSiteMediaService()
  }

  /** Forwards Site Media Admin calls with exact Asset audience and Permission code metadata. */
  uploadSiteMedia(stream: Observable<UploadSiteMediaRequest>, source: DownstreamRequestSource) { return this.businessAssetCall('uploadSiteMedia', source, (metadata) => this.siteMedia.uploadSiteMedia(stream, metadata)) }
  listAuthorizedSiteMedia(input: ListAuthorizedSiteMediaRequest, source: DownstreamRequestSource) { return this.businessAssetCall('listAuthorizedSiteMedia', source, (metadata) => this.siteMedia.listAuthorizedSiteMedia(input, metadata)) }
  prepareSiteMediaRemoteDelivery(input: PrepareSiteMediaRemoteDeliveryRequest, source: DownstreamRequestSource) { return this.businessAssetCall('prepareSiteMediaRemoteDelivery', source, (metadata) => this.siteMedia.prepareSiteMediaRemoteDelivery(input, metadata)) }
  activateSiteMediaRemoteDelivery(input: ActivateSiteMediaRemoteDeliveryRequest, source: DownstreamRequestSource) { return this.businessAssetCall('activateSiteMediaRemoteDelivery', source, (metadata) => this.siteMedia.activateSiteMediaRemoteDelivery(input, metadata)) }
  archiveSiteMedia(input: ArchiveSiteMediaRequest, source: DownstreamRequestSource) { return this.businessAssetCall('archiveSiteMedia', source, (metadata) => this.siteMedia.archiveSiteMedia(input, metadata)) }
  takeDownSiteMedia(input: TakeDownSiteMediaRequest, source: DownstreamRequestSource) { return this.businessAssetCall('takeDownSiteMedia', source, (metadata) => this.siteMedia.takeDownSiteMedia(input, metadata)) }
  getSiteMediaDeliveryStatus(input: GetSiteMediaDeliveryStatusRequest, source: DownstreamRequestSource) { return this.businessAssetCall('getSiteMediaDeliveryStatus', source, (metadata) => this.siteMedia.getSiteMediaDeliveryStatus(input, metadata)) }
  deleteSiteMedia(input: DeleteSiteMediaRequest, source: DownstreamRequestSource) { return this.businessAssetCall('deleteSiteMedia', source, (metadata) => this.siteMedia.deleteSiteMedia(input, metadata)) }

  /** listSiteCards forwards the card workspace query with tenant/operator context. */
  listSiteCards(context: SiteManagementAdminContext, source: DownstreamRequestSource) {
    const request: ListSiteCardsRequest = {}

    return this.businessCall('listSiteCards', source, (metadata) => this.siteAdmin.listSiteCards(request, metadata))
  }

  /** createSite forwards draft site creation to the owning site-service. */
  createSite(input: SiteManagementAdminContext & CreateSiteDto, source: DownstreamRequestSource) {
    const request: CreateSiteRequest = {
      siteName: input.siteName,
      siteType: input.siteType,
      brandId: input.brandId,
      regionCode: input.regionCode,
      channelCode: input.channelCode,
      defaultLocale: input.defaultLocale,
      primaryDomain: input.primaryDomain,
      previewBaseUrl: input.previewBaseUrl
    }

    return this.businessCall('createSite', source, (metadata) => this.siteAdmin.createSite(request, metadata))
  }

  /** updateSiteSettings forwards settings edits to site-service. */
  updateSiteSettings(input: any, source: DownstreamRequestSource) {
    return this.businessCall('updateSiteSettings', source, (metadata) => this.siteAdmin.updateSiteSettings(this.businessRequest(input), metadata))
  }

  /** disableSite forwards site disable commands to site-service. */
  disableSite(input: any, source: DownstreamRequestSource) {
    return this.businessCall('disableSite', source, (metadata) => this.siteAdmin.disableSite(this.businessRequest(input), metadata))
  }

  /** addPreparingLocale forwards locale creation commands to site-service. */
  addPreparingLocale(input: any, source: DownstreamRequestSource) {
    return this.businessCall('addPreparingLocale', source, (metadata) => this.siteAdmin.addPreparingLocale(this.businessRequest(input), metadata))
  }

  /** checkLocaleCompleteness forwards locale completeness queries to site-service. */
  checkLocaleCompleteness(input: any, source: DownstreamRequestSource) {
    return this.businessCall('checkLocaleCompleteness', source, (metadata) => this.siteAdmin.checkLocaleCompleteness(this.businessRequest(input), metadata))
  }

  /** activateLocale forwards locale activation commands to site-service. */
  activateLocale(input: any, source: DownstreamRequestSource) {
    return this.businessCall('activateLocale', source, (metadata) => this.siteAdmin.activateLocale(this.businessRequest(input), metadata))
  }

  /** disableLocale forwards locale disable commands to site-service. */
  disableLocale(input: any, source: DownstreamRequestSource) {
    return this.businessCall('disableLocale', source, (metadata) => this.siteAdmin.disableLocale(this.businessRequest(input), metadata))
  }

  /** listSitePages forwards discovery/governance reads to site-service. */
  listSitePages(input: any, source: DownstreamRequestSource) {
    const request: ListSitePagesRequest = {
      siteId: input.siteId
    }
    return this.businessCall('listSitePages', source, (metadata) => this.siteAdmin.listSitePages(request, metadata))
  }

  /** updateSitePageGovernance forwards page-wide governance intent to site-service. */
  updateSitePageGovernance(input: any, source: DownstreamRequestSource) {
    const request: UpdateSitePageGovernanceRequest = {
      siteId: input.siteId,
      pageKey: input.pageKey,
      enabled: input.enabled === true,
      indexable: input.indexable === true
    }
    return this.businessCall('updateSitePageGovernance', source, (metadata) => this.siteAdmin.updateSitePageGovernance(request, metadata))
  }

  /** listSiteCategories forwards category projection reads to site-service. */
  listSiteCategories(input: any, source: DownstreamRequestSource) {
    return this.businessCall('listSiteCategories', source, (metadata) => this.siteAdmin.listSiteCategories(this.businessRequest(input), metadata))
  }

  /** createSiteCategory forwards category projection creation to site-service. */
  createSiteCategory(input: any, source: DownstreamRequestSource) {
    return this.businessCall('createSiteCategory', source, (metadata) => this.siteAdmin.createSiteCategory(this.businessRequest(input), metadata))
  }

  /** updateSiteCategory forwards category projection edits to site-service. */
  updateSiteCategory(input: any, source: DownstreamRequestSource) {
    return this.businessCall('updateSiteCategory', source, (metadata) => this.siteAdmin.updateSiteCategory(this.businessRequest(input), metadata))
  }

  /** unpublishSiteCategory forwards category unpublish commands to site-service. */
  unpublishSiteCategory(input: any, source: DownstreamRequestSource) {
    return this.businessCall('unpublishSiteCategory', source, (metadata) => this.siteAdmin.unpublishSiteCategory(this.businessRequest(input), metadata))
  }

  /** listSiteProducts forwards product publication reads to site-service. */
  listSiteProducts(input: any, source: DownstreamRequestSource) {
    return this.businessCall('listSiteProducts', source, (metadata) => this.siteAdmin.listSiteProducts(this.businessRequest(input), metadata))
  }

  /** searchProductMasterForAdd forwards candidate lookup through site-service anti-corruption boundary. */
  searchProductMasterForAdd(input: any, source: DownstreamRequestSource) {
    return this.businessCall('searchProductMasterForAdd', source, (metadata) => this.siteAdmin.searchProductMasterForAdd(this.businessRequest(input), metadata))
  }

  /** getSiteProductPublication forwards product publication detail reads to site-service. */
  getSiteProductPublication(input: any, source: DownstreamRequestSource) {
    return this.businessCall('getSiteProductPublication', source, (metadata) => this.siteAdmin.getSiteProductPublication(this.businessRequest(input), metadata))
  }

  /** addProductsToSite forwards product publication create commands to site-service. */
  addProductsToSite(input: any, source: DownstreamRequestSource) {
    return this.businessCall('addProductsToSite', source, (metadata) => this.siteAdmin.addProductsToSite(this.businessRequest(input), metadata))
  }

  /** updateSiteProductPublication forwards product display edits to site-service. */
  updateSiteProductPublication(input: any, source: DownstreamRequestSource) {
    return this.businessCall('updateSiteProductPublication', source, (metadata) => this.siteAdmin.updateSiteProductPublication(this.businessRequest(input), metadata))
  }

  /** unpublishSiteProduct forwards product unpublish commands to site-service. */
  unpublishSiteProduct(input: any, source: DownstreamRequestSource) {
    return this.businessCall('unpublishSiteProduct', source, (metadata) => this.siteAdmin.unpublishSiteProduct(this.businessRequest(input), metadata))
  }

  /** syncAllPendingChanges forwards the explicit publish action without owning sync rules in the gateway. */
  syncAllPendingChanges(input: SyncAllPendingChangesRequest, source: DownstreamRequestSource) {
    return this.businessCall('syncAllPendingChanges', source, (metadata) => this.siteAdmin.syncAllPendingChanges(this.businessRequest(input), metadata))
  }

  /** getPendingSyncSummary forwards pending sync summary reads to site-service. */
  getPendingSyncSummary(input: any, source: DownstreamRequestSource) {
    return this.businessCall('getPendingSyncSummary', source, (metadata) => this.siteAdmin.getPendingSyncSummary(this.businessRequest(input), metadata))
  }

  /** listPendingSyncResources forwards pending resource reads to site-service. */
  listPendingSyncResources(input: any, source: DownstreamRequestSource) {
    return this.businessCall('listPendingSyncResources', source, (metadata) => this.siteAdmin.listPendingSyncResources(this.businessRequest(input), metadata))
  }

  /** listSyncHistory forwards sync history reads to site-service. */
  listSyncHistory(input: any, source: DownstreamRequestSource) {
    return this.businessCall('listSyncHistory', source, (metadata) => this.siteAdmin.listSyncHistory(this.businessRequest(input), metadata))
  }

  /** getSyncDetail forwards sync detail reads to site-service. */
  getSyncDetail(input: any, source: DownstreamRequestSource) {
    return this.businessCall('getSyncDetail', source, (metadata) => this.siteAdmin.getSyncDetail(this.businessRequest(input), metadata))
  }

  /** retryLastSync forwards sync retry commands to site-service. */
  retryLastSync(input: any, source: DownstreamRequestSource) {
    return this.businessCall('retryLastSync', source, (metadata) => this.siteAdmin.retryLastSync(this.businessRequest(input), metadata))
  }

  /** resendWebhook forwards webhook resend commands to site-service. */
  resendWebhook(input: any, source: DownstreamRequestSource) {
    return this.businessCall('resendWebhook', source, (metadata) => this.siteAdmin.resendWebhook(this.businessRequest(input), metadata))
  }

  /** issuePreviewToken forwards short-lived preview-token issuance to site-service. */
  issuePreviewToken(input: IssuePreviewTokenRequest, source: DownstreamRequestSource) {
    return this.businessCall('issuePreviewToken', source, (metadata) => this.siteAdmin.issuePreviewToken(this.businessRequest(input), metadata))
  }

  /** generateSiteCredential forwards one-time credential generation to site-service. */
  generateSiteCredential(input: GenerateSiteCredentialRequest, source: DownstreamRequestSource) {
    return this.businessCall('generateSiteCredential', source, (metadata) => this.siteAdmin.generateSiteCredential(this.businessRequest(input), metadata))
  }

  /** listSiteCredentials forwards metadata-only credential reads to site-service. */
  listSiteCredentials(input: any, source: DownstreamRequestSource) {
    return this.businessCall('listSiteCredentials', source, (metadata) => this.siteAdmin.listSiteCredentials(this.businessRequest(input), metadata))
  }

  /** rotateSiteCredential forwards credential rotation to site-service. */
  rotateSiteCredential(input: RotateSiteCredentialRequest, source: DownstreamRequestSource) {
    return this.businessCall('rotateSiteCredential', source, (metadata) => this.siteAdmin.rotateSiteCredential(this.businessRequest(input), metadata))
  }

  /** revokeSiteCredential forwards credential revocation to site-service. */
  revokeSiteCredential(input: RevokeSiteCredentialRequest, source: DownstreamRequestSource) {
    return this.businessCall('revokeSiteCredential', source, (metadata) => this.siteAdmin.revokeSiteCredential(this.businessRequest(input), metadata))
  }

  /** createSiteContent forwards Blog/News container creation to site-service. */
  createSiteContent(input: CreateSiteContentRequest, source: DownstreamRequestSource) {
    return this.businessCall('createSiteContent', source, (metadata) => this.siteAdmin.createSiteContent(this.businessRequest(input), metadata))
  }

  /** updateSiteContentLocaleVersion forwards Blog/News locale draft saves to site-service. */
  updateSiteContentLocaleVersion(input: UpdateSiteContentLocaleVersionRequest, source: DownstreamRequestSource) {
    return this.businessCall('updateSiteContentLocaleVersion', source, (metadata) => this.siteAdmin.updateSiteContentLocaleVersion(this.businessRequest(input), metadata))
  }

  /** listSiteContents forwards Blog/News list reads to site-service. */
  listSiteContents(input: any, source: DownstreamRequestSource) {
    return this.businessCall('listSiteContents', source, (metadata) => this.siteAdmin.listSiteContents(this.businessRequest(input), metadata))
  }

  /** getSiteContent forwards Blog/News detail reads to site-service. */
  getSiteContent(input: any, source: DownstreamRequestSource) {
    return this.businessCall('getSiteContent', source, (metadata) => this.siteAdmin.getSiteContent(this.businessRequest(input), metadata))
  }

  /** unpublishSiteContent forwards Blog/News unpublish commands to site-service. */
  unpublishSiteContent(input: any, source: DownstreamRequestSource) {
    return this.businessCall('unpublishSiteContent', source, (metadata) => this.siteAdmin.unpublishSiteContent(this.businessRequest(input), metadata))
  }

  /** listContentCategories forwards Blog/News Category reads to site-service. */
  listContentCategories(input: any, source: DownstreamRequestSource) {
    return this.businessCall('listContentCategories', source, (metadata) => this.siteAdmin.listContentCategories(this.businessRequest(input), metadata))
  }

  /** getContentCategory forwards one Blog/News Category read to site-service. */
  getContentCategory(input: any, source: DownstreamRequestSource) {
    return this.businessCall('getContentCategory', source, (metadata) => this.siteAdmin.getContentCategory(this.businessRequest(input), metadata))
  }

  /** createContentCategory forwards Category creation commands to site-service. */
  createContentCategory(input: any, source: DownstreamRequestSource) {
    return this.businessCall('createContentCategory', source, (metadata) => this.siteAdmin.createContentCategory(this.businessRequest(input), metadata))
  }

  /** updateContentCategoryLocaleVersion forwards Category locale draft saves to site-service. */
  updateContentCategoryLocaleVersion(input: any, source: DownstreamRequestSource) {
    return this.businessCall('updateContentCategoryLocaleVersion', source, (metadata) => this.siteAdmin.updateContentCategoryLocaleVersion(this.businessRequest(input), metadata))
  }

  /** publishContentCategoryLocale forwards explicit locale publication approval. */
  publishContentCategoryLocale(input: any, source: DownstreamRequestSource) { return this.businessCall('publishContentCategoryLocale', source, (metadata) => this.siteAdmin.publishContentCategoryLocale(this.businessRequest(input), metadata)) }
  /** reorderContentCategories forwards a complete global neutral rank sequence. */
  reorderContentCategories(input: any, source: DownstreamRequestSource) { return this.businessCall('reorderContentCategories', source, (metadata) => this.siteAdmin.reorderContentCategories(this.businessRequest(input), metadata)) }
  /** deleteContentCategory forwards protected deletion and tombstone semantics. */
  deleteContentCategory(input: any, source: DownstreamRequestSource) { return this.businessCall('deleteContentCategory', source, (metadata) => this.siteAdmin.deleteContentCategory(this.businessRequest(input), metadata)) }
  /** listVisibleContentCategories forwards usage-derived eligibility reads. */
  listVisibleContentCategories(input: any, source: DownstreamRequestSource) { return this.businessCall('listVisibleContentCategories', source, (metadata) => this.siteAdmin.listVisibleContentCategories(this.businessRequest(input), metadata)) }
  /** checkContentCategoryCompleteness forwards locale publication readiness. */
  checkContentCategoryCompleteness(input: any, source: DownstreamRequestSource) { return this.businessCall('checkContentCategoryCompleteness', source, (metadata) => this.siteAdmin.checkContentCategoryCompleteness(this.businessRequest(input), metadata)) }
  /** listContentCategoryUsage forwards Article usage projections. */
  listContentCategoryUsage(input: any, source: DownstreamRequestSource) { return this.businessCall('listContentCategoryUsage', source, (metadata) => this.siteAdmin.listContentCategoryUsage(this.businessRequest(input), metadata)) }

  /** listFaqCategories forwards a typed FAQ Category list request. */
  listFaqCategories(input: ListFaqCategoriesRequest, source: DownstreamRequestSource) { return this.businessCall('listFaqCategories', source, (metadata) => this.siteAdmin.listFaqCategories(this.businessRequest(input), metadata)) }
  /** getFaqCategory forwards a typed FAQ Category detail request. */
  getFaqCategory(input: GetFaqCategoryRequest, source: DownstreamRequestSource) { return this.businessCall('getFaqCategory', source, (metadata) => this.siteAdmin.getFaqCategory(this.businessRequest(input), metadata)) }
  /** createFaqCategory forwards flat FAQ Category creation. */
  createFaqCategory(input: CreateFaqCategoryRequest, source: DownstreamRequestSource) { return this.businessCall('createFaqCategory', source, (metadata) => this.siteAdmin.createFaqCategory(this.businessRequest(input), metadata)) }
  /** updateFaqCategoryLocaleVersion forwards typed Category locale content. */
  updateFaqCategoryLocaleVersion(input: UpdateFaqCategoryLocaleVersionRequest, source: DownstreamRequestSource) { return this.businessCall('updateFaqCategoryLocaleVersion', source, (metadata) => this.siteAdmin.updateFaqCategoryLocaleVersion(this.businessRequest(input), metadata)) }
  /** disableFaqCategory forwards lifecycle validation to Site Service. */
  disableFaqCategory(input: DisableFaqCategoryRequest, source: DownstreamRequestSource) { return this.businessCall('disableFaqCategory', source, (metadata) => this.siteAdmin.disableFaqCategory(this.businessRequest(input), metadata)) }
  /** listFaqEntries forwards an optional Category/locale filter. */
  listFaqEntries(input: ListFaqEntriesRequest, source: DownstreamRequestSource) { return this.businessCall('listFaqEntries', source, (metadata) => this.siteAdmin.listFaqEntries(this.businessRequest(input), metadata)) }
  /** getFaqEntry forwards a typed Entry detail request. */
  getFaqEntry(input: GetFaqEntryRequest, source: DownstreamRequestSource) { return this.businessCall('getFaqEntry', source, (metadata) => this.siteAdmin.getFaqEntry(this.businessRequest(input), metadata)) }
  /** createFaqEntry forwards one-Category Entry creation. */
  createFaqEntry(input: CreateFaqEntryRequest, source: DownstreamRequestSource) { return this.businessCall('createFaqEntry', source, (metadata) => this.siteAdmin.createFaqEntry(this.businessRequest(input), metadata)) }
  /** updateFaqEntryLocaleVersion forwards typed Entry locale content. */
  updateFaqEntryLocaleVersion(input: UpdateFaqEntryLocaleVersionRequest, source: DownstreamRequestSource) { return this.businessCall('updateFaqEntryLocaleVersion', source, (metadata) => this.siteAdmin.updateFaqEntryLocaleVersion(this.businessRequest(input), metadata)) }
  /** unpublishFaqEntry forwards one locale withdrawal. */
  unpublishFaqEntry(input: UnpublishFaqEntryRequest, source: DownstreamRequestSource) { return this.businessCall('unpublishFaqEntry', source, (metadata) => this.siteAdmin.unpublishFaqEntry(this.businessRequest(input), metadata)) }
  /** checkFaqCompleteness forwards per-locale publication preflight. */
  checkFaqCompleteness(input: CheckFaqCompletenessRequest, source: DownstreamRequestSource) { return this.businessCall('checkFaqCompleteness', source, (metadata) => this.siteAdmin.checkFaqCompleteness(this.businessRequest(input), metadata)) }

  /** listSiteAuditLogs forwards site audit queries to site-service. */
  listSiteAuditLogs(input: any, source: DownstreamRequestSource) {
    return this.businessCall('listSiteAuditLogs', source, (metadata) => this.siteAdmin.listSiteAuditLogs(this.businessRequest(input), metadata))
  }

  /** businessCall binds one Site Admin invocation to its frozen target audience and permission. */
  private async businessCall<TResponse>(
    method: string,
    source: DownstreamRequestSource,
    invoke: (metadata: Metadata) => unknown
  ): Promise<TResponse> {
    const permission = ADMIN_PERMISSION_BY_METHOD[method]
    if (!permission) {
      throw new Error(`Missing Site Admin permission declaration: ${method}`)
    }
    const metadata = await this.trustedExecution.forBusinessCall(source, SITE_AUDIENCE, [permission])
    return this.call<TResponse>(method, invoke(metadata))
  }

  /** Removes BFF-only identity wrappers before a Site Admin proto request crosses the trust boundary. */
  private businessRequest<T extends object>(input: T): Omit<T, 'context' | 'tenantId' | 'orgId' | 'operatorId' | 'traceId' | 'requestId'> {
    const { context: _context, tenantId: _tenantId, orgId: _orgId, operatorId: _operatorId, traceId: _traceId, requestId: _requestId, ...business } = input as T & Record<string, unknown>
    return business as Omit<T, 'context' | 'tenantId' | 'orgId' | 'operatorId' | 'traceId' | 'requestId'>
  }

  /** businessAssetCall binds Site Media Admin calls to Asset audience and exact code metadata. */
  private async businessAssetCall<TResponse>(method: string, source: DownstreamRequestSource, invoke: (metadata: Metadata) => unknown): Promise<TResponse> {
    const permission = ASSET_MEDIA_BY_METHOD[method]
    if (!permission) throw new Error(`Missing Site Media permission declaration: ${method}`)
    const metadata = await this.trustedExecution.forBusinessCall(source, ASSET_AUDIENCE, [permission])
    return this.call<TResponse>(`asset.${method}`, invoke(metadata))
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
