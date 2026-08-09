import { Controller, Inject, UseFilters, UseGuards } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { AuthorizeBusinessRpc, AuthorizeInternalCall, TrustedExecutionGuard, ASSET_SITE_MEDIA_PERMISSION_CODES, getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { GrpcExceptionFilter } from '@oes/common/filters'
import { Observable } from 'rxjs'
import { SiteMediaApplicationService } from '../../application/services/site-media-application.service'
import {
  SiteMediaAssetServiceController, SiteMediaAssetServiceControllerMethods,
  UploadSiteMediaRequest, UploadSiteMediaResponse, ListAuthorizedSiteMediaRequest, ListAuthorizedSiteMediaResponse,
  ResolveSiteMediaForPublicationRequest, ResolveSiteMediaForPublicationResponse,
  PrepareSiteMediaRemoteDeliveryRequest, PrepareSiteMediaRemoteDeliveryResponse,
  ActivateSiteMediaRemoteDeliveryRequest, ActivateSiteMediaRemoteDeliveryResponse,
  ProtectSitePublicationReferencesRequest, ProtectSitePublicationReferencesResponse,
  ReleaseSitePublicationReferencesRequest, ReleaseSitePublicationReferencesResponse,
  ArchiveSiteMediaRequest, ArchiveSiteMediaResponse, TakeDownSiteMediaRequest, TakeDownSiteMediaResponse,
  GetSiteMediaDeliveryStatusRequest, GetSiteMediaDeliveryStatusResponse, DeleteSiteMediaRequest, DeleteSiteMediaResponse
} from '@oes/common/generated/asset_service'

export interface SiteMediaApplicationPort {
  uploadSiteMedia(request: Observable<UploadSiteMediaRequest>, authority: SiteMediaExecutionAuthority): Promise<UploadSiteMediaResponse>
  listAuthorizedSiteMedia(request: ListAuthorizedSiteMediaRequest, authority: SiteMediaExecutionAuthority): Promise<ListAuthorizedSiteMediaResponse>
  resolveSiteMediaForPublication(request: ResolveSiteMediaForPublicationRequest, authority: SiteMediaExecutionAuthority): Promise<ResolveSiteMediaForPublicationResponse>
  prepareSiteMediaRemoteDelivery(request: PrepareSiteMediaRemoteDeliveryRequest, authority: SiteMediaExecutionAuthority): Promise<PrepareSiteMediaRemoteDeliveryResponse>
  activateSiteMediaRemoteDelivery(request: ActivateSiteMediaRemoteDeliveryRequest, authority: SiteMediaExecutionAuthority): Promise<ActivateSiteMediaRemoteDeliveryResponse>
  protectSitePublicationReferences(request: ProtectSitePublicationReferencesRequest, authority: SiteMediaExecutionAuthority): Promise<ProtectSitePublicationReferencesResponse>
  releaseSitePublicationReferences(request: ReleaseSitePublicationReferencesRequest, authority: SiteMediaExecutionAuthority): Promise<ReleaseSitePublicationReferencesResponse>
  archiveSiteMedia(request: ArchiveSiteMediaRequest, authority: SiteMediaExecutionAuthority): Promise<ArchiveSiteMediaResponse>
  takeDownSiteMedia(request: TakeDownSiteMediaRequest, authority: SiteMediaExecutionAuthority): Promise<TakeDownSiteMediaResponse>
  getSiteMediaDeliveryStatus(request: GetSiteMediaDeliveryStatusRequest, authority: SiteMediaExecutionAuthority): Promise<GetSiteMediaDeliveryStatusResponse>
  deleteSiteMedia(request: DeleteSiteMediaRequest, authority: SiteMediaExecutionAuthority): Promise<DeleteSiteMediaResponse>
}

export type SiteMediaExecutionAuthority = Readonly<{ subject: string; principalType: string; tenantId?: string; orgId?: string; actor?: string; delegationId?: string; workload: string }>

/** Exposes the frozen Site Media wire surface and fails closed until its application use cases are wired. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@Controller()
@SiteMediaAssetServiceControllerMethods()
export class SiteMediaGrpcController implements SiteMediaAssetServiceController {
  constructor(@Inject(SiteMediaApplicationService) private readonly application: SiteMediaApplicationPort) {}

  @AuthorizeBusinessRpc({ all: [ASSET_SITE_MEDIA_PERMISSION_CODES.UPLOAD] })
  uploadSiteMedia(request: Observable<UploadSiteMediaRequest>, _metadata: Metadata): Promise<UploadSiteMediaResponse> { return this.application.uploadSiteMedia(request, authorityOf(request)) }
  @AuthorizeBusinessRpc({ all: [ASSET_SITE_MEDIA_PERMISSION_CODES.READ] })
  listAuthorizedSiteMedia(request: ListAuthorizedSiteMediaRequest, _metadata: Metadata): Promise<ListAuthorizedSiteMediaResponse> { return this.application.listAuthorizedSiteMedia(request, authorityOf(request)) }
  @AuthorizeInternalCall({ all: [ASSET_SITE_MEDIA_PERMISSION_CODES.RESOLVE] })
  resolveSiteMediaForPublication(request: ResolveSiteMediaForPublicationRequest, _metadata: Metadata): Promise<ResolveSiteMediaForPublicationResponse> { return this.application.resolveSiteMediaForPublication(request, authorityOf(request)) }
  @AuthorizeBusinessRpc({ all: [ASSET_SITE_MEDIA_PERMISSION_CODES.DELIVERY_MANAGE] })
  prepareSiteMediaRemoteDelivery(request: PrepareSiteMediaRemoteDeliveryRequest, _metadata: Metadata): Promise<PrepareSiteMediaRemoteDeliveryResponse> { return this.application.prepareSiteMediaRemoteDelivery(request, authorityOf(request)) }
  @AuthorizeBusinessRpc({ all: [ASSET_SITE_MEDIA_PERMISSION_CODES.DELIVERY_MANAGE] })
  activateSiteMediaRemoteDelivery(request: ActivateSiteMediaRemoteDeliveryRequest, _metadata: Metadata): Promise<ActivateSiteMediaRemoteDeliveryResponse> { return this.application.activateSiteMediaRemoteDelivery(request, authorityOf(request)) }
  @AuthorizeInternalCall({ all: [ASSET_SITE_MEDIA_PERMISSION_CODES.PUBLICATION_PROTECT] })
  protectSitePublicationReferences(request: ProtectSitePublicationReferencesRequest, _metadata: Metadata): Promise<ProtectSitePublicationReferencesResponse> { return this.application.protectSitePublicationReferences(request, authorityOf(request)) }
  @AuthorizeInternalCall({ all: [ASSET_SITE_MEDIA_PERMISSION_CODES.PUBLICATION_RELEASE] })
  releaseSitePublicationReferences(request: ReleaseSitePublicationReferencesRequest, _metadata: Metadata): Promise<ReleaseSitePublicationReferencesResponse> { return this.application.releaseSitePublicationReferences(request, authorityOf(request)) }
  @AuthorizeBusinessRpc({ all: [ASSET_SITE_MEDIA_PERMISSION_CODES.ARCHIVE] })
  archiveSiteMedia(request: ArchiveSiteMediaRequest, _metadata: Metadata): Promise<ArchiveSiteMediaResponse> { return this.application.archiveSiteMedia(request, authorityOf(request)) }
  @AuthorizeBusinessRpc({ all: [ASSET_SITE_MEDIA_PERMISSION_CODES.TAKEDOWN] })
  takeDownSiteMedia(request: TakeDownSiteMediaRequest, _metadata: Metadata): Promise<TakeDownSiteMediaResponse> { return this.application.takeDownSiteMedia(request, authorityOf(request)) }
  @AuthorizeBusinessRpc({ all: [ASSET_SITE_MEDIA_PERMISSION_CODES.READ] })
  getSiteMediaDeliveryStatus(request: GetSiteMediaDeliveryStatusRequest, _metadata: Metadata): Promise<GetSiteMediaDeliveryStatusResponse> { return this.application.getSiteMediaDeliveryStatus(request, authorityOf(request)) }
  @AuthorizeBusinessRpc({ all: [ASSET_SITE_MEDIA_PERMISSION_CODES.DELETE] })
  deleteSiteMedia(request: DeleteSiteMediaRequest, _metadata: Metadata): Promise<DeleteSiteMediaResponse> { return this.application.deleteSiteMedia(request, authorityOf(request)) }
}

/** Derives immutable Site Media execution authority exclusively from guard-attached verified claims. */
function authorityOf(data: object): SiteMediaExecutionAuthority {
  const context = getAuthenticatedGrpcRequestContext(data)
  const token = context?.verifiedExecutionToken
  const workload = context?.verifiedWorkloadIdentity?.spiffeId
  if (!token?.subject || !workload) throw new Error('TRUSTED_SITE_MEDIA_AUTHORITY_REQUIRED')
  if (token.tenantId === undefined) throw new Error('SITE_MEDIA_TENANT_SCOPE_REQUIRED')
  return Object.freeze({ subject: token.subject, principalType: token.principalType, tenantId: token.tenantId, orgId: token.orgId, actor: typeof token.actor === 'string' ? token.actor : undefined, delegationId: token.delegationId, workload })
}
