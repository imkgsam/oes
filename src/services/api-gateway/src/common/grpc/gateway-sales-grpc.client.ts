import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Gateway's mTLS client channel for the token-only Sales server. */
export class GatewaySalesGrpcClient {
  private client?: ClientGrpc

  /** Lazily creates the deployment-authenticated generated Sales channel. */
  getClient(): ClientGrpc {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'sales_service',
        protoPath: resolveCommonProtoPath('sales_service/sales.proto'),
        url: resolveGrpcUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    return this.client
  }
}

/** Resolves Sales's deployment destination without accepting caller transport settings. */
function resolveGrpcUrl(): string {
  const host = process.env.SALES_SERVICE_HOST?.trim()
  const port = process.env.SALES_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50059'
  throw new Error('SALES_SERVICE_HOST and SALES_SERVICE_PORT are required')
}
