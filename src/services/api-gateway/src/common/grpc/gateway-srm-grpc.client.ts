import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  SUPPLIER_MANAGEMENT_SERVICE_NAME,
  SUPPLIER_QUERY_SERVICE_NAME,
  SupplierManagementServiceClient,
  SupplierQueryServiceClient
} from '@oes/common/generated/srm_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

export const SRM_TARGET_AUDIENCE = 'urn:oes:service:srm-service'

/** Owns Gateway's mTLS channel for SRM's token-only HUMAN surface. */
export class GatewaySrmGrpcClient {
  private client?: ClientGrpc

  query(): SupplierQueryServiceClient {
    return this.get().getService<SupplierQueryServiceClient>(SUPPLIER_QUERY_SERVICE_NAME)
  }

  management(): SupplierManagementServiceClient {
    return this.get().getService<SupplierManagementServiceClient>(SUPPLIER_MANAGEMENT_SERVICE_NAME)
  }

  /** Lazily creates the deployment-authenticated SRM channel without generic transport fallback. */
  private get(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'srm_service',
        protoPath: resolveCommonProtoPath('srm_service/srm.proto'),
        url: resolveSrmGrpcUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}

/** Resolves the SRM endpoint from deployment configuration with a development-only loopback default. */
function resolveSrmGrpcUrl(): string {
  const host = process.env.SRM_SERVICE_HOST?.trim()
  const port = process.env.SRM_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50061'
  throw new Error('SRM_SERVICE_HOST and SRM_SERVICE_PORT are required')
}
