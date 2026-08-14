import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  ItemMasterManagementServiceClient,
  ItemMasterQueryServiceClient,
  ITEM_MASTER_MANAGEMENT_SERVICE_NAME,
  ITEM_MASTER_QUERY_SERVICE_NAME
} from '@oes/common/generated/item_master_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Gateway's mTLS channel for the token-only Item Master HUMAN surface. */
export class GatewayItemMasterGrpcClient {
  private client?: ClientGrpc
  query(): ItemMasterQueryServiceClient {
    return this.get().getService<ItemMasterQueryServiceClient>(ITEM_MASTER_QUERY_SERVICE_NAME)
  }
  management(): ItemMasterManagementServiceClient {
    return this.get().getService<ItemMasterManagementServiceClient>(
      ITEM_MASTER_MANAGEMENT_SERVICE_NAME
    )
  }
  private get(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'item_master_service',
        protoPath: resolveCommonProtoPath('item_master_service/item_master.proto'),
        url:
          process.env.ITEM_MASTER_SERVICE_HOST?.trim() &&
          process.env.ITEM_MASTER_SERVICE_PORT?.trim()
            ? `${process.env.ITEM_MASTER_SERVICE_HOST.trim()}:${process.env.ITEM_MASTER_SERVICE_PORT.trim()}`
            : '127.0.0.1:50058',
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}
