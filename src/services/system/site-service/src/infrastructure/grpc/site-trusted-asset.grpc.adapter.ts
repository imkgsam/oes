import { ClientGrpc } from '@nestjs/microservices'
import { Injectable } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { AssetSiteMediaPort } from '../../application/ports/asset-site-media.port'
import { AsyncLocalTransportPrivateSourceCredentialAccessor, AsyncLocalTrustedExecutionContextAccessor, createTrustedExecutionContext, getGrpcAuthorizationBearer, RPC_OPERATOR_CONTEXT_KEY, TrustedGrpcMetadataProvider, TransportPrivateSourceCredentialIssuer } from '@oes/common/authorization'
import { SiteMediaAssetServiceClient, SITE_MEDIA_ASSET_SERVICE_NAME } from '@oes/common/generated/asset_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { SERVICE_NAMES } from '@oes/common/constants'

const ASSET_AUDIENCE = 'urn:oes:service:asset-service'
const RESOLVE = 'asset.internal.site_media.resolve'
const PROTECT = 'asset.internal.site_media.publication.protect'
const RELEASE = 'asset.internal.site_media.publication.release'

/** SiteTrustedAssetGrpcAdapter exchanges the verified inbound execution for exact Asset INTERNAL calls. */
@Injectable()
export class SiteTrustedAssetGrpcAdapter implements AssetSiteMediaPort {
  private readonly client: SiteMediaAssetServiceClient
  private readonly issuer = new TransportPrivateSourceCredentialIssuer()
  constructor(@InjectGrpcClient(SERVICE_NAMES.ASSET) private readonly grpc: ClientGrpc, private readonly provider: TrustedGrpcMetadataProvider, private readonly context: AsyncLocalTrustedExecutionContextAccessor, private readonly source: AsyncLocalTransportPrivateSourceCredentialAccessor) { this.client = grpc.getService<SiteMediaAssetServiceClient>(SITE_MEDIA_ASSET_SERVICE_NAME) }
  async resolve(input: { siteId: string; assetId: string; requiredMediaKind: string }) { return this.call(RESOLVE, (metadata) => this.client.resolveSiteMediaForPublication(input, metadata)) }
  async protect(input: { idempotencyKey: string; siteId: string; publishVersion: string; assetIds: string[] }) { return this.call(PROTECT, (metadata) => this.client.protectSitePublicationReferences(input, metadata)) }
  async release(input: { idempotencyKey: string; siteId: string; publishVersion: string }) { return this.call(RELEASE, (metadata) => this.client.releaseSitePublicationReferences(input, metadata)) }
  /** Runs one outbound exchange with the guard-verified inbound bearer held only in private transport scope. */
  runWithInboundScope<T>(data: object, metadata: Metadata, callback: () => Promise<T>): Promise<T> {
    const verified = (data as Record<string, { verifiedExecutionToken?: { subject: string; principalType: 'HUMAN' | 'MACHINE' | 'DELEGATED'; tenantId?: string; orgId?: string; actor?: unknown; delegationId?: string; authzVersion?: string | number } }>)[RPC_OPERATOR_CONTEXT_KEY]?.verifiedExecutionToken
    const bearer = getGrpcAuthorizationBearer(metadata)
    if (!verified) throw new Error('SITE_INBOUND_EXECUTION_CONTEXT_REQUIRED')
    if (!bearer) throw new Error('SITE_INBOUND_EXECUTION_CREDENTIAL_REQUIRED')
    const requestId = getMetadata(metadata, 'x-request-id')
    const traceparent = getMetadata(metadata, 'traceparent')
    const tracestate = getMetadata(metadata, 'tracestate')
    if (!requestId || !traceparent || !isTraceparent(traceparent)) throw new Error('SITE_INBOUND_TRACE_CONTEXT_REQUIRED')
    const context = createTrustedExecutionContext({ subject: verified.subject, principalType: verified.principalType, tenantId: verified.tenantId, orgId: verified.orgId, actor: typeof verified.actor === 'string' ? verified.actor : undefined, delegationId: verified.delegationId, authzVersion: verified.authzVersion, requestId, traceparent, tracestate })
    const handle = this.issuer.issueVerifiedExecutionTokenSubjectCredential(bearer)
    return this.context.run(context, () => this.source.run(handle, callback))
  }
  private async call<T>(code: string, invoke: (metadata: Metadata) => any): Promise<T> { const metadata = await this.provider.forInternalCall(ASSET_AUDIENCE, [code]); return safeGrpcCall<T>(invoke(metadata), { caller: 'site-service', method: `asset.${code}` }) }
}

/** getMetadata reads only transport correlation metadata and never supplies authority claims. */
function getMetadata(metadata: Metadata, key: string): string | undefined {
  const value = metadata.get(key)[0]
  return typeof value === 'string' ? value : Buffer.isBuffer(value) ? value.toString('utf8') : undefined
}

/** isTraceparent accepts W3C version 00 including unsampled flags, while rejecting all-zero identifiers. */
function isTraceparent(value: string): boolean {
  const match = /^00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/u.exec(value.trim())
  return !!match && !/^0+$/u.test(match[1]) && !/^0+$/u.test(match[2])
}
