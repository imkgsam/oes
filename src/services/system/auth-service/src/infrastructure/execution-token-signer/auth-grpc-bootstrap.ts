import type { ServerCredentials } from '@grpc/grpc-js'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'

/** Builds Auth's single gRPC listener configuration with mandatory credentials supplied by the verified TLS boundary. */
export function createAuthGrpcMicroserviceOptions(
  credentials: ServerCredentials,
  protoPath: readonly [string, ...string[]]
): MicroserviceOptions {
  return {
    transport: Transport.GRPC,
    options: {
      package: 'auth_service',
      protoPath: [...protoPath],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50050'}`,
      credentials
    }
  }
}
