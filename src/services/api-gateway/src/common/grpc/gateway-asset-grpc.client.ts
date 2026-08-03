import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { ASSET_SERVICE_NAME, AssetServiceClient } from '@oes/common/generated/asset_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Gateway's single lazy mTLS channel to the cut-over Asset service. */
export class GatewayAssetGrpcClient {
  private client?: ClientGrpc
  private service?: AssetServiceClient

  constructor(private readonly clientFactory: () => ClientGrpc = createAssetGrpcClient) {}

  /** Resolves and reuses the generated Asset service proxy on the credentialed channel. */
  getService(): AssetServiceClient {
    if (this.service === undefined) {
      this.client ??= this.clientFactory()
      this.service = this.client.getService<AssetServiceClient>(ASSET_SERVICE_NAME)
    }
    return this.service
  }
}

/** Creates the dedicated Asset channel from deployment-owned certificate files. */
function createAssetGrpcClient(): ClientGrpc {
  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      url: resolveAssetGrpcUrl(),
      package: 'asset_service',
      protoPath: resolveCommonProtoPath('asset_service/asset.proto'),
      credentials: createGrpcClientCredentials()
    }
  }) as unknown as ClientGrpc
}

/** Resolves the exact Asset endpoint while preserving the repository's local default. */
function resolveAssetGrpcUrl(): string {
  const host = process.env.ASSET_SERVICE_HOST?.trim()
  const port = process.env.ASSET_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50056'
  throw new Error('trusted asset-service gRPC url is unavailable')
}
