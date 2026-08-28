import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { ASSET_SERVICE_NAME, AssetServiceClient, SITE_MEDIA_ASSET_SERVICE_NAME, SiteMediaAssetServiceClient } from '@oes/common/generated/asset_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Gateway's mTLS client channel for the token-only Asset server. */
export class GatewayAssetGrpcClient {
  private assetClient?: ClientGrpc
  private siteMediaClient?: ClientGrpc
  private service?: AssetServiceClient
  private siteMediaService?: SiteMediaAssetServiceClient

  /** Resolves a lazy generated Asset stub on the deployment-authenticated transport. */
  getService(): AssetServiceClient {
    this.assetClient ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'asset_service',
        protoPath: resolveCommonProtoPath('asset_service/asset.proto'),
        url: resolveGrpcUrl('ASSET_SERVICE_HOST', 'ASSET_SERVICE_PORT', '50056'),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    this.service ??= this.assetClient.getService<AssetServiceClient>(ASSET_SERVICE_NAME)
    return this.service
  }

  /** Resolves the generated Site Media client on the same mTLS Asset channel without altering legacy Asset RPCs. */
  getSiteMediaService(): SiteMediaAssetServiceClient {
    this.siteMediaClient ??= ClientProxyFactory.create({ transport: Transport.GRPC, options: { package: 'asset_service', protoPath: resolveCommonProtoPath('asset_service/site_media.proto'), url: resolveGrpcUrl('ASSET_SERVICE_HOST', 'ASSET_SERVICE_PORT', '50056'), credentials: createGrpcClientCredentials() } }) as unknown as ClientGrpc
    this.siteMediaService ??= this.siteMediaClient.getService<SiteMediaAssetServiceClient>(SITE_MEDIA_ASSET_SERVICE_NAME)
    return this.siteMediaService
  }
}

/** Resolves an exact deployment destination without accepting caller-supplied transport settings. */
function resolveGrpcUrl(hostName: string, portName: string, fallbackPort: string): string {
  const host = process.env[hostName]?.trim()
  const port = process.env[portName]?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return `127.0.0.1:${fallbackPort}`
  throw new Error(`${hostName} and ${portName} are required`)
}
