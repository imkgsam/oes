import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

export const PERMISSION_TARGET_AUDIENCE = 'urn:oes:service:permission-service'

/** Owns Gateway's immutable mTLS channel to the Permission trusted gRPC boundary. */
export class TrustedPermissionGrpcClient {
  private client?: ClientGrpc

  /** Returns the lazily constructed target-bound client without accepting request transport overrides. */
  getClient(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'permission_service',
        protoPath: [
          resolveCommonProtoPath('permission_service/permission_check.proto'),
          resolveCommonProtoPath('permission_service/permission_management.proto'),
          resolveCommonProtoPath('permission_service/permission_access_summary.proto'),
          resolveCommonProtoPath('permission_service/permission_terminal_access.proto'),
          resolveCommonProtoPath('permission_service/resource_authorization.proto'),
          resolveCommonProtoPath('permission_service/policy_management.proto'),
          resolveCommonProtoPath('permission_service/policy_instance_management.proto'),
          resolveCommonProtoPath('permission_service/policy_instance_preview.proto')
        ],
        url: resolveUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}

/** Resolves only deployment-owned Permission endpoint configuration. */
function resolveUrl(): string {
  const configured = process.env.GRPC_SERVICE_PERMISSION_URL?.trim()
  if (configured) return configured
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50051'
  throw new Error('GRPC_SERVICE_PERMISSION_URL is required')
}
