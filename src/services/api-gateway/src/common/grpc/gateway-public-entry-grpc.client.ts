import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Gateway's mTLS client channel for Public Entry trusted gRPC calls. */
export class GatewayPublicEntryGrpcClient {
  private client?: ClientGrpc
  getClient(): ClientGrpc {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'public_entry_service',
        protoPath: resolveCommonProtoPath('public_entry_service/public_entry.proto'),
        url: resolveGrpcUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    return this.client
  }
}

function resolveGrpcUrl(): string {
  const host = process.env.PUBLIC_ENTRY_SERVICE_HOST?.trim()
  const port = process.env.PUBLIC_ENTRY_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50067'
  throw new Error('PUBLIC_ENTRY_SERVICE_HOST and PUBLIC_ENTRY_SERVICE_PORT are required')
}
