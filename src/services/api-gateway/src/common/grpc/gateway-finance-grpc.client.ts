import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Gateway's mTLS client channel for the token-only Finance server. */
export class GatewayFinanceGrpcClient {
  private client?: ClientGrpc

  /** Lazily creates the deployment-authenticated generated Finance channel. */
  getClient(): ClientGrpc {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'finance_service',
        protoPath: resolveCommonProtoPath('finance_service/finance.proto'),
        url: resolveGrpcUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    return this.client
  }
}

/** Resolves Finance's deployment destination without accepting caller transport settings. */
function resolveGrpcUrl(): string {
  const host = process.env.FINANCE_SERVICE_HOST?.trim()
  const port = process.env.FINANCE_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50063'
  throw new Error('FINANCE_SERVICE_HOST and FINANCE_SERVICE_PORT are required')
}
