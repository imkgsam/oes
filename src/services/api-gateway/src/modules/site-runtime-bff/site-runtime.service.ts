import { Inject, Injectable } from '@nestjs/common'

export const SITE_RUNTIME_DOWNSTREAM = Symbol('SITE_RUNTIME_DOWNSTREAM')

export interface SiteRuntimeSignedHttpRequest {
  method: string
  path: string
  normalizedQuery: string
  signedHeaders: Record<string, string>
  body: Record<string, unknown>
  rawBody: Buffer
}

export interface SiteRuntimeDownstream {
  getLatestPublishState(request: SiteRuntimeSignedHttpRequest): Promise<unknown>
  listChangedResources(request: SiteRuntimeSignedHttpRequest): Promise<unknown>
  batchGetPublicViews(request: SiteRuntimeSignedHttpRequest): Promise<unknown>
  getSnapshot(request: SiteRuntimeSignedHttpRequest): Promise<unknown>
  reportSyncResult(request: SiteRuntimeSignedHttpRequest): Promise<unknown>
  getPreviewView(request: SiteRuntimeSignedHttpRequest): Promise<unknown>
}

/** SiteRuntimeService forwards signed Site Runtime requests without trusting ordinary body site ids. */
@Injectable()
export class SiteRuntimeService {
  constructor(
    @Inject(SITE_RUNTIME_DOWNSTREAM)
    private readonly downstream: SiteRuntimeDownstream
  ) {}

  /** getLatestPublishState forwards the signed runtime request to site-service for verification. */
  getLatestPublishState(request: SiteRuntimeSignedHttpRequest): Promise<unknown> {
    return this.downstream.getLatestPublishState(request)
  }

  /** listChangedResources forwards delta requests without trusting ordinary site_id fields. */
  listChangedResources(request: SiteRuntimeSignedHttpRequest): Promise<unknown> {
    return this.downstream.listChangedResources(request)
  }

  /** batchGetPublicViews forwards public-view requests to the site-service verification boundary. */
  batchGetPublicViews(request: SiteRuntimeSignedHttpRequest): Promise<unknown> {
    return this.downstream.batchGetPublicViews(request)
  }

  /** getSnapshot forwards snapshot requests while preserving signed site identity material. */
  getSnapshot(request: SiteRuntimeSignedHttpRequest): Promise<unknown> {
    return this.downstream.getSnapshot(request)
  }

  /** reportSyncResult forwards runtime status reports after preserving signed identity material. */
  reportSyncResult(request: SiteRuntimeSignedHttpRequest): Promise<unknown> {
    return this.downstream.reportSyncResult(request)
  }

  /** getPreviewView forwards preview requests with the same signed verification material. */
  getPreviewView(request: SiteRuntimeSignedHttpRequest): Promise<unknown> {
    return this.downstream.getPreviewView(request)
  }
}
