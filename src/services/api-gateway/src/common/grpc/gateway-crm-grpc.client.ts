import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  CUSTOMER_MANAGEMENT_SERVICE_NAME,
  CUSTOMER_QUERY_SERVICE_NAME,
  CustomerManagementServiceClient,
  CustomerQueryServiceClient
} from '@oes/common/generated/crm_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

export const CRM_TARGET_AUDIENCE = 'urn:oes:service:crm-service'

/** Owns Gateway's dedicated mTLS channel for CRM's token-only HUMAN surface. */
export class GatewayCrmGrpcClient {
  private client?: ClientGrpc

  /** Returns CRM's query stub from the sole dedicated channel. */
  customerQuery(): CustomerQueryServiceClient {
    return this.get().getService<CustomerQueryServiceClient>(CUSTOMER_QUERY_SERVICE_NAME)
  }

  /** Returns CRM's management stub from the sole dedicated channel. */
  customerManagement(): CustomerManagementServiceClient {
    return this.get().getService<CustomerManagementServiceClient>(CUSTOMER_MANAGEMENT_SERVICE_NAME)
  }

  /** Lazily creates the deployment-authenticated CRM channel without generic fallback. */
  private get(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'crm_service',
        protoPath: resolveCommonProtoPath('crm_service/crm.proto'),
        url: resolveCrmGrpcUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}

/** Resolves the CRM endpoint with an explicit production fail-closed policy. */
function resolveCrmGrpcUrl(): string {
  const host = process.env.CRM_SERVICE_HOST?.trim()
  const port = process.env.CRM_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50060'
  throw new Error('CRM_SERVICE_HOST and CRM_SERVICE_PORT are required')
}
