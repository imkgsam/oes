import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { ASSET_SERVICE_NAME, AssetServiceClient } from '@oes/common/generated/asset_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Gateway's mTLS client channel for the token-only Asset server. */
export class GatewayAssetGrpcClient {
  private client?: ClientGrpc
  private service?: AssetServiceClient

  /** Resolves a lazy generated Asset stub on the deployment-authenticated transport. */
  getService(): AssetServiceClient {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'asset_service',
        protoPath: resolveCommonProtoPath('asset_service/asset.proto'),
        url: resolveGrpcUrl('ASSET_SERVICE_HOST', 'ASSET_SERVICE_PORT', '50056'),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    this.service ??= this.client.getService<AssetServiceClient>(ASSET_SERVICE_NAME)
    return this.service
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
