import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  ITEM_MASTER_INTERNAL_QUERY_SERVICE_NAME,
  ItemMasterInternalQueryServiceClient
} from '@oes/common/generated/item_master_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns MES's mTLS channel for the narrow Item Master eligibility surface. */
export class MesItemMasterTrustedGrpcClient {
  private client?: ClientGrpc

  internalQuery(): ItemMasterInternalQueryServiceClient {
    return this.get().getService<ItemMasterInternalQueryServiceClient>(
      ITEM_MASTER_INTERNAL_QUERY_SERVICE_NAME
    )
  }

  private get(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'item_master_service',
        protoPath: resolveCommonProtoPath('item_master_service/item_master.proto'),
        url: process.env.GRPC_SERVICE_ITEM_MASTER_URL?.trim() || '127.0.0.1:50058',
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}
