import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

export const TENANTORG_TARGET_AUDIENCE = 'urn:oes:service:tenant-org-service'

/** Owns Gateway's immutable mTLS channel to the TenantOrg trusted gRPC boundary. */
export class TrustedTenantOrgGrpcClient {
  private client?: ClientGrpc

  /** Returns the lazily constructed target-bound client without accepting request transport overrides. */
  getClient(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: { package: 'tenant_org_service', protoPath: resolveCommonProtoPath('tenant_org_service/tenant_org.proto'), url: resolveUrl(), credentials: createGrpcClientCredentials() }
    }) as unknown as ClientGrpc)
  }
}

/** Resolves only deployment-owned TenantOrg endpoint configuration. */
function resolveUrl(): string {
  const configured = process.env.GRPC_SERVICE_TENANT_ORG_URL?.trim()
  if (configured) return configured
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50054'
  throw new Error('GRPC_SERVICE_TENANT_ORG_URL is required')
}
