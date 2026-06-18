import { createHash } from 'node:crypto'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { GRPC_METADATA_PROPAGATION_FACTORY, GrpcMetadataPropagationFactory } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  BatchGetPublicViewsRequest,
  GetLatestPublishStateRequest,
  GetPreviewViewRequest,
  GetSnapshotRequest,
  ListChangedResourcesRequest,
  ReportSyncResultRequest,
  SITE_RUNTIME_SYNC_SERVICE_NAME,
  SignedSiteContext,
  SiteRuntimeSyncServiceClient
} from '@oes/common/generated/site_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { toInternalCallMetadataInput } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { SiteRuntimeDownstream, SiteRuntimeSignedHttpRequest } from '../../site-runtime.service'

const CALLER = 'api-gateway'

/** SiteRuntimeGrpcAdapter maps signed Site-facing HTTP requests to site-service runtime gRPC calls. */
@Injectable()
export class SiteRuntimeGrpcAdapter implements SiteRuntimeDownstream, OnModuleInit {
  private runtime!: SiteRuntimeSyncServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.SITE)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  /** onModuleInit resolves the generated site runtime gRPC client from the transport registry. */
  onModuleInit(): void {
    this.runtime = this.client.getService<SiteRuntimeSyncServiceClient>(SITE_RUNTIME_SYNC_SERVICE_NAME)
  }

  /** getLatestPublishState forwards latest-version checks with signed material preserved. */
  getLatestPublishState(request: SiteRuntimeSignedHttpRequest) {
    const input: GetLatestPublishStateRequest = {
      signedContext: this.signedContext(request),
      localPublishVersion: numberField(request.body.local_publish_version ?? request.body.localPublishVersion)
    }

    return this.call('getLatestPublishState', this.runtime.getLatestPublishState(input, this.metadata(request)))
  }

  /** listChangedResources forwards delta requests using only the signed site identity. */
  listChangedResources(request: SiteRuntimeSignedHttpRequest) {
    const input: ListChangedResourcesRequest = {
      signedContext: this.signedContext(request),
      fromPublishVersion: numberField(request.body.from_publish_version ?? request.body.fromPublishVersion),
      toPublishVersion: numberField(request.body.to_publish_version ?? request.body.toPublishVersion),
      resourceTypes: stringArrayField(request.body.resource_types ?? request.body.resourceTypes)
    }

    return this.call('listChangedResources', this.runtime.listChangedResources(input, this.metadata(request)))
  }

  /** batchGetPublicViews forwards public-view resource refs without accepting body site ownership. */
  batchGetPublicViews(request: SiteRuntimeSignedHttpRequest) {
    const input: BatchGetPublicViewsRequest = {
      signedContext: this.signedContext(request),
      resources: Array.isArray(request.body.resources)
        ? request.body.resources.map((resource) => ({
            resourceType: stringField((resource as Record<string, unknown>).resource_type ?? (resource as Record<string, unknown>).resourceType),
            resourceId: stringField((resource as Record<string, unknown>).resource_id ?? (resource as Record<string, unknown>).resourceId),
            locale: stringField((resource as Record<string, unknown>).locale)
          }))
        : []
    }

    return this.call('batchGetPublicViews', this.runtime.batchGetPublicViews(input, this.metadata(request)))
  }

  /** getSnapshot forwards consistent snapshot requests with signed material preserved. */
  getSnapshot(request: SiteRuntimeSignedHttpRequest) {
    const input: GetSnapshotRequest = {
      signedContext: this.signedContext(request),
      resourceTypes: stringArrayField(request.body.resource_types ?? request.body.resourceTypes),
      locales: stringArrayField(request.body.locales),
      pageToken: stringField(request.body.page_token ?? request.body.pageToken),
      pageSize: numberField(request.body.page_size ?? request.body.pageSize)
    }

    return this.call('getSnapshot', this.runtime.getSnapshot(input, this.metadata(request)))
  }

  /** reportSyncResult forwards runtime sync status reports to site-service. */
  reportSyncResult(request: SiteRuntimeSignedHttpRequest) {
    const input: ReportSyncResultRequest = {
      signedContext: this.signedContext(request),
      syncId: stringField(request.body.sync_id ?? request.body.syncId),
      localPublishVersion: numberField(request.body.local_publish_version ?? request.body.localPublishVersion),
      status: stringField(request.body.status),
      startedAt: stringField(request.body.started_at ?? request.body.startedAt),
      completedAt: stringField(request.body.completed_at ?? request.body.completedAt),
      errorCode: stringField(request.body.error_code ?? request.body.errorCode),
      errorMessage: stringField(request.body.error_message ?? request.body.errorMessage)
    }

    return this.call('reportSyncResult', this.runtime.reportSyncResult(input, this.metadata(request)))
  }

  /** getPreviewView forwards preview-token reads while preserving signed verification context. */
  getPreviewView(request: SiteRuntimeSignedHttpRequest) {
    const input: GetPreviewViewRequest = {
      signedContext: this.signedContext(request),
      previewToken: stringField(request.body.preview_token ?? request.body.previewToken),
      resourceType: stringField(request.body.resource_type ?? request.body.resourceType),
      resourceId: stringField(request.body.resource_id ?? request.body.resourceId),
      locale: stringField(request.body.locale)
    }

    return this.call('getPreviewView', this.runtime.getPreviewView(input, this.metadata(request)))
  }

  /** signedContext converts required OES signing headers and canonical request fields into gRPC input. */
  private signedContext(request: SiteRuntimeSignedHttpRequest): SignedSiteContext {
    return {
      siteId: header(request, 'x-oes-site-id'),
      clientId: header(request, 'x-oes-client-id'),
      credentialId: header(request, 'x-oes-credential-id'),
      requestId: header(request, 'x-oes-request-id'),
      traceId: header(request, 'x-oes-trace-id'),
      timestamp: header(request, 'x-oes-timestamp'),
      nonce: header(request, 'x-oes-nonce'),
      signature: header(request, 'x-oes-signature'),
      method: request.method,
      path: request.path,
      normalizedQuery: request.normalizedQuery,
      bodySha256: createHash('sha256').update(request.rawBody).digest('hex')
    }
  }

  /** metadata creates internal gRPC metadata for the site-service runtime verification boundary. */
  private metadata(request: SiteRuntimeSignedHttpRequest) {
    return this.metadataFactory.createInternalCallMetadata(
      toInternalCallMetadataInput({
        requestId: header(request, 'x-oes-request-id'),
        traceId: header(request, 'x-oes-trace-id')
      })
    )
  }

  /** call wraps one site runtime gRPC call with the shared gateway safety behavior. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts identifies the gateway caller and downstream method for transport error context. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

/** header reads one signed header case-insensitively from the incoming request. */
function header(request: SiteRuntimeSignedHttpRequest, name: string): string | undefined {
  return request.signedHeaders[name] ?? request.signedHeaders[name.toLowerCase()]
}

/** stringField normalizes BFF body values before sending them over gRPC. */
function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** numberField normalizes JSON numeric values before sending them over gRPC. */
function numberField(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** stringArrayField normalizes optional string arrays from Site Runtime requests. */
function stringArrayField(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
  return normalized.length ? normalized : undefined
}
