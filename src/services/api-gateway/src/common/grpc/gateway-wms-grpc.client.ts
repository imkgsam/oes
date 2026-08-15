import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  INVENTORY_QUERY_SERVICE_NAME,
  InventoryQueryServiceClient,
  RECEIPT_MANAGEMENT_SERVICE_NAME,
  RECEIPT_QUERY_SERVICE_NAME,
  ReceiptManagementServiceClient,
  ReceiptQueryServiceClient,
  WAREHOUSE_QUERY_SERVICE_NAME,
  WarehouseQueryServiceClient
} from '@oes/common/generated/wms_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

export const WMS_TARGET_AUDIENCE = 'urn:oes:service:wms-service'

/** Owns Gateway's mTLS channel for WMS's token-only HUMAN surface. */
export class GatewayWmsGrpcClient {
  private client?: ClientGrpc

  warehouseQuery(): WarehouseQueryServiceClient {
    return this.get().getService<WarehouseQueryServiceClient>(WAREHOUSE_QUERY_SERVICE_NAME)
  }

  receiptQuery(): ReceiptQueryServiceClient {
    return this.get().getService<ReceiptQueryServiceClient>(RECEIPT_QUERY_SERVICE_NAME)
  }

  receiptManagement(): ReceiptManagementServiceClient {
    return this.get().getService<ReceiptManagementServiceClient>(RECEIPT_MANAGEMENT_SERVICE_NAME)
  }

  inventoryQuery(): InventoryQueryServiceClient {
    return this.get().getService<InventoryQueryServiceClient>(INVENTORY_QUERY_SERVICE_NAME)
  }

  /** Lazily creates the deployment-authenticated WMS channel without generic fallback. */
  private get(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'wms_service',
        protoPath: resolveCommonProtoPath('wms_service/wms.proto'),
        url: resolveWmsGrpcUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}

/** Resolves the WMS endpoint with an explicit production fail-closed policy. */
function resolveWmsGrpcUrl(): string {
  const host = process.env.WMS_SERVICE_HOST?.trim()
  const port = process.env.WMS_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50064'
  throw new Error('WMS_SERVICE_HOST and WMS_SERVICE_PORT are required')
}
