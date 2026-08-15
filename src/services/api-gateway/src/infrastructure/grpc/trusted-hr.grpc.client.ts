import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

export const HR_TARGET_AUDIENCE = 'urn:oes:service:hr-service'

/** Owns Gateway's immutable mTLS channel to the Hr trusted gRPC boundary. */
export class TrustedHrGrpcClient {
  private client?: ClientGrpc

  /** Returns the lazily constructed target-bound client without accepting request transport overrides. */
  getClient(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: { package: 'hr_service', protoPath: resolveCommonProtoPath('hr_service/hr.proto'), url: resolveUrl(), credentials: createGrpcClientCredentials() }
    }) as unknown as ClientGrpc)
  }
}

/** Resolves only deployment-owned Hr endpoint configuration. */
function resolveUrl(): string {
  const configured = process.env.GRPC_SERVICE_HR_URL?.trim()
  if (configured) return configured
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50055'
  throw new Error('GRPC_SERVICE_HR_URL is required')
}
