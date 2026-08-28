import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonContractPath, resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

export const IDENTITY_TARGET_AUDIENCE = 'urn:oes:service:identity-service'

/** Owns Gateway's immutable mTLS channel to the Identity trusted gRPC boundary. */
export class TrustedIdentityGrpcClient {
  private client?: ClientGrpc

  /** Returns the lazily constructed target-bound client without accepting request transport overrides. */
  getClient(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'identity_service',
        protoPath: [
          resolveCommonProtoPath('identity_service/identity_query.proto'),
          resolveCommonProtoPath('identity_service/identity_management.proto')
        ],
        loader: { includeDirs: [resolveCommonContractPath()] },
        url: resolveUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}

/** Resolves only deployment-owned Identity endpoint configuration. */
function resolveUrl(): string {
  const configured = process.env.GRPC_SERVICE_IDENTITY_URL?.trim()
  if (configured) return configured
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50052'
  throw new Error('GRPC_SERVICE_IDENTITY_URL is required')
}
