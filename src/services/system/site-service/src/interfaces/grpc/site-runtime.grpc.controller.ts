import { Controller, Inject, UseFilters, UseGuards } from '@nestjs/common'
import { AuthorizeInternalCall, SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES, TrustedInternalExecutionGuard } from '@oes/common/authorization'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  BatchGetPublicViewsRequest,
  BatchGetPublicViewsResponse,
  GetLatestPublishStateRequest,
  GetLatestPublishStateResponse,
  GetPreviewViewRequest,
  GetPreviewViewResponse,
  GetSnapshotRequest,
  GetSnapshotResponse,
  ListChangedResourcesRequest,
  ListChangedResourcesResponse,
  ReportSyncResultRequest,
  ReportSyncResultResponse,
  RegisterPageCapabilitiesRequest,
  RegisterPageCapabilitiesResponse,
  SiteRuntimeSyncServiceController,
  SiteRuntimeSyncServiceControllerMethods
} from '@oes/common/generated/site_service'
import { mapSiteCapabilityRegistrationError } from './site-capability-registration-error.mapper'

export interface SiteRuntimeApplicationPort {
  registerPageCapabilities(
    request: RegisterPageCapabilitiesRequest
  ): Promise<RegisterPageCapabilitiesResponse>
  getLatestPublishState(
    request: GetLatestPublishStateRequest
  ): Promise<GetLatestPublishStateResponse>
  listChangedResources(request: ListChangedResourcesRequest): Promise<ListChangedResourcesResponse>
  batchGetPublicViews(request: BatchGetPublicViewsRequest): Promise<BatchGetPublicViewsResponse>
  getSnapshot(request: GetSnapshotRequest): Promise<GetSnapshotResponse>
  reportSyncResult(request: ReportSyncResultRequest): Promise<ReportSyncResultResponse>
  getPreviewView(request: GetPreviewViewRequest): Promise<GetPreviewViewResponse>
}

export const SITE_RUNTIME_APPLICATION = Symbol('SITE_RUNTIME_APPLICATION')

/** SiteRuntimeGrpcController exposes signed Site Runtime sync APIs as a thin protocol adapter. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedInternalExecutionGuard)
@Controller()
@SiteRuntimeSyncServiceControllerMethods()
export class SiteRuntimeGrpcController implements SiteRuntimeSyncServiceController {
  constructor(
    @Inject(SITE_RUNTIME_APPLICATION)
    private readonly application: SiteRuntimeApplicationPort
  ) {}

  @AuthorizeInternalCall({ all: [SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_PUBLICATION_READ] })
  getLatestPublishState(
    request: GetLatestPublishStateRequest
  ): Promise<GetLatestPublishStateResponse> {
    return this.application.getLatestPublishState(request)
  }

  /** registerPageCapabilities preserves stable domain errors as typed OES gRPC payloads. */
  @AuthorizeInternalCall({ all: [SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_CAPABILITY_REGISTER] })
  async registerPageCapabilities(
    request: RegisterPageCapabilitiesRequest
  ): Promise<RegisterPageCapabilitiesResponse> {
    try {
      return await this.application.registerPageCapabilities(request)
    } catch (error) {
      return mapSiteCapabilityRegistrationError(error)
    }
  }

  @AuthorizeInternalCall({ all: [SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_PUBLICATION_READ] })
  listChangedResources(
    request: ListChangedResourcesRequest
  ): Promise<ListChangedResourcesResponse> {
    return this.application.listChangedResources(request)
  }

  @AuthorizeInternalCall({ all: [SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_PUBLICATION_READ] })
  batchGetPublicViews(request: BatchGetPublicViewsRequest): Promise<BatchGetPublicViewsResponse> {
    return this.application.batchGetPublicViews(request)
  }

  @AuthorizeInternalCall({ all: [SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_PUBLICATION_READ] })
  getSnapshot(request: GetSnapshotRequest): Promise<GetSnapshotResponse> {
    return this.application.getSnapshot(request)
  }

  @AuthorizeInternalCall({ all: [SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_SYNC_REPORT] })
  reportSyncResult(request: ReportSyncResultRequest): Promise<ReportSyncResultResponse> {
    return this.application.reportSyncResult(request)
  }

  @AuthorizeInternalCall({ all: [SITE_MANAGEMENT_INTERNAL_PERMISSION_CODES.RUNTIME_PREVIEW_READ] })
  getPreviewView(request: GetPreviewViewRequest): Promise<GetPreviewViewResponse> {
    return this.application.getPreviewView(request)
  }
}
