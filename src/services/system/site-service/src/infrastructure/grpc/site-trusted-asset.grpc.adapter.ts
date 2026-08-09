import { ClientGrpc } from '@nestjs/microservices'
import { Metadata } from '@grpc/grpc-js'
import { AssetSiteMediaPort } from '../../application/ports/asset-site-media.port'
import { AsyncLocalTransportPrivateSourceCredentialAccessor, AsyncLocalTrustedExecutionContextAccessor, TrustedGrpcMetadataProvider, TransportPrivateSourceCredentialIssuer } from '@oes/common/authorization'
import { SiteMediaAssetServiceClient, SITE_MEDIA_ASSET_SERVICE_NAME } from '@oes/common/generated/asset_service'
import { safeGrpcCall } from '@oes/common/transport'

const ASSET_AUDIENCE = 'urn:oes:service:asset-service'
const RESOLVE = 'asset.internal.site_media.resolve'
const PROTECT = 'asset.internal.site_media.publication.protect'
const RELEASE = 'asset.internal.site_media.publication.release'

/** SiteTrustedAssetGrpcAdapter exchanges the verified inbound execution for exact Asset INTERNAL calls. */
export class SiteTrustedAssetGrpcAdapter implements AssetSiteMediaPort {
  private readonly client: SiteMediaAssetServiceClient
  constructor(private readonly grpc: ClientGrpc, private readonly provider: TrustedGrpcMetadataProvider, private readonly context: AsyncLocalTrustedExecutionContextAccessor, private readonly source: AsyncLocalTransportPrivateSourceCredentialAccessor, private readonly issuer = new TransportPrivateSourceCredentialIssuer()) { this.client = grpc.getService<SiteMediaAssetServiceClient>(SITE_MEDIA_ASSET_SERVICE_NAME) }
  async resolve(input: { siteId: string; assetId: string; requiredMediaKind: string }) { return this.call(RESOLVE, (metadata) => this.client.resolveSiteMediaForPublication(input, metadata)) }
  async protect(input: { idempotencyKey: string; siteId: string; publishVersion: string; assetIds: string[] }) { return this.call(PROTECT, (metadata) => this.client.protectSitePublicationReferences(input, metadata)) }
  async release(input: { idempotencyKey: string; siteId: string; publishVersion: string }) { return this.call(RELEASE, (metadata) => this.client.releaseSitePublicationReferences(input, metadata)) }
  /** Runs one outbound exchange with the inbound verified token held only in a private transport scope. */
  runWithInboundBearer<T>(bearer: string, callback: () => Promise<T>): Promise<T> { const handle = this.issuer.issueVerifiedExecutionTokenSubjectCredential(bearer); return this.source.run(handle, callback) }
  private async call<T>(code: string, invoke: (metadata: Metadata) => any): Promise<T> { const metadata = await this.provider.forInternalCall(ASSET_AUDIENCE, [code]); return safeGrpcCall<T>(invoke(metadata), { caller: 'site-service', method: `asset.${code}` }) }
}
