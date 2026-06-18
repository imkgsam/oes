import { Controller, Inject, UseFilters } from '@nestjs/common'
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
  SiteRuntimeSyncServiceController,
  SiteRuntimeSyncServiceControllerMethods
} from '@oes/common/generated/site_service'

export interface SiteRuntimeApplicationPort {
  getLatestPublishState(request: GetLatestPublishStateRequest): Promise<GetLatestPublishStateResponse>
  listChangedResources(request: ListChangedResourcesRequest): Promise<ListChangedResourcesResponse>
  batchGetPublicViews(request: BatchGetPublicViewsRequest): Promise<BatchGetPublicViewsResponse>
  getSnapshot(request: GetSnapshotRequest): Promise<GetSnapshotResponse>
  reportSyncResult(request: ReportSyncResultRequest): Promise<ReportSyncResultResponse>
  getPreviewView(request: GetPreviewViewRequest): Promise<GetPreviewViewResponse>
}

export const SITE_RUNTIME_APPLICATION = Symbol('SITE_RUNTIME_APPLICATION')

/** SiteRuntimeGrpcController exposes signed Site Runtime sync APIs as a thin protocol adapter. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@SiteRuntimeSyncServiceControllerMethods()
export class SiteRuntimeGrpcController implements SiteRuntimeSyncServiceController {
  constructor(
    @Inject(SITE_RUNTIME_APPLICATION)
    private readonly application: SiteRuntimeApplicationPort
  ) {}

  getLatestPublishState(request: GetLatestPublishStateRequest): Promise<GetLatestPublishStateResponse> {
    return this.application.getLatestPublishState(request)
  }

  listChangedResources(request: ListChangedResourcesRequest): Promise<ListChangedResourcesResponse> {
    return this.application.listChangedResources(request)
  }

  batchGetPublicViews(request: BatchGetPublicViewsRequest): Promise<BatchGetPublicViewsResponse> {
    return this.application.batchGetPublicViews(request)
  }

  getSnapshot(request: GetSnapshotRequest): Promise<GetSnapshotResponse> {
    return this.application.getSnapshot(request)
  }

  reportSyncResult(request: ReportSyncResultRequest): Promise<ReportSyncResultResponse> {
    return this.application.reportSyncResult(request)
  }

  getPreviewView(request: GetPreviewViewRequest): Promise<GetPreviewViewResponse> {
    return this.application.getPreviewView(request)
  }
}
