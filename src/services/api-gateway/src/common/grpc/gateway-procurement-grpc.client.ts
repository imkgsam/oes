import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  PURCHASE_ORDER_MANAGEMENT_SERVICE_NAME,
  PURCHASE_ORDER_QUERY_SERVICE_NAME,
  PURCHASE_REQUEST_MANAGEMENT_SERVICE_NAME,
  PURCHASE_REQUEST_QUERY_SERVICE_NAME,
  RECEIVING_EXPECTATION_MANAGEMENT_SERVICE_NAME,
  RECEIVING_EXPECTATION_QUERY_SERVICE_NAME,
  PurchaseOrderManagementServiceClient,
  PurchaseOrderQueryServiceClient,
  PurchaseRequestManagementServiceClient,
  PurchaseRequestQueryServiceClient,
  ReceivingExpectationManagementServiceClient,
  ReceivingExpectationQueryServiceClient
} from '@oes/common/generated/procurement_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

export const PROCUREMENT_TARGET_AUDIENCE = 'urn:oes:service:procurement-service'

/** Owns Gateway's mTLS channel for Procurement's token-only HUMAN surface. */
export class GatewayProcurementGrpcClient {
  private client?: ClientGrpc

  purchaseRequestQuery(): PurchaseRequestQueryServiceClient {
    return this.get().getService<PurchaseRequestQueryServiceClient>(
      PURCHASE_REQUEST_QUERY_SERVICE_NAME
    )
  }

  purchaseRequestManagement(): PurchaseRequestManagementServiceClient {
    return this.get().getService<PurchaseRequestManagementServiceClient>(
      PURCHASE_REQUEST_MANAGEMENT_SERVICE_NAME
    )
  }

  purchaseOrderQuery(): PurchaseOrderQueryServiceClient {
    return this.get().getService<PurchaseOrderQueryServiceClient>(PURCHASE_ORDER_QUERY_SERVICE_NAME)
  }

  purchaseOrderManagement(): PurchaseOrderManagementServiceClient {
    return this.get().getService<PurchaseOrderManagementServiceClient>(
      PURCHASE_ORDER_MANAGEMENT_SERVICE_NAME
    )
  }

  receivingExpectationQuery(): ReceivingExpectationQueryServiceClient {
    return this.get().getService<ReceivingExpectationQueryServiceClient>(
      RECEIVING_EXPECTATION_QUERY_SERVICE_NAME
    )
  }

  receivingExpectationManagement(): ReceivingExpectationManagementServiceClient {
    return this.get().getService<ReceivingExpectationManagementServiceClient>(
      RECEIVING_EXPECTATION_MANAGEMENT_SERVICE_NAME
    )
  }

  /** Lazily creates the deployment-authenticated Procurement channel without generic fallback. */
  private get(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'procurement_service',
        protoPath: resolveCommonProtoPath('procurement_service/procurement.proto'),
        url: resolveProcurementGrpcUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}

/** Resolves the Procurement endpoint with an explicit production fail-closed policy. */
function resolveProcurementGrpcUrl(): string {
  const host = process.env.PROCUREMENT_SERVICE_HOST?.trim()
  const port = process.env.PROCUREMENT_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50062'
  throw new Error('PROCUREMENT_SERVICE_HOST and PROCUREMENT_SERVICE_PORT are required')
}
