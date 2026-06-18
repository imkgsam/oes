import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  ITEM_MASTER_QUERY_SERVICE_NAME,
  ItemMasterQueryServiceClient
} from '@oes/common/generated/item_master_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { StockableItemLookupPort, StockableItemLookupResult } from '../../application/ports/stockable-item-lookup.port'

/** ItemMasterStockableQueryGrpcAdapter validates WMS receipt items through item-master-service query truth. */
@Injectable()
export class ItemMasterStockableQueryGrpcAdapter implements StockableItemLookupPort, OnModuleInit {
  private itemMasterQueryService!: ItemMasterQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.ITEM_MASTER)
    private readonly itemMasterClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.itemMasterQueryService = this.itemMasterClient.getService<ItemMasterQueryServiceClient>(
      ITEM_MASTER_QUERY_SERVICE_NAME
    )
  }

  async getItemById(tenantId: string, itemId: string): Promise<StockableItemLookupResult | null> {
    const response = await safeGrpcCall(
      this.itemMasterQueryService.getItem(
        {
          tenantId,
          itemId
        },
        this.buildMetadata()
      ),
      {
        caller: SERVICE_NAMES.WMS,
        method: 'ItemMasterQueryService.getItem'
      }
    )

    const item = response.item
    if (!item?.itemId?.trim()) {
      return null
    }

    return {
      itemId: item.itemId,
      itemCode: item.itemCode ?? '',
      itemName: item.itemName ?? '',
      active: item.active ?? false,
      stockable: item.capabilities?.stockable ?? false
    }
  }

  /** buildMetadata forwards trace/request context while keeping item lookup on the internal-service boundary. */
  private buildMetadata() {
    const current = this.requestContextStore.getContext()
    if (current?.operatorContext) {
      return this.metadataFactory.createOperatorScopedMetadata({
        callerServiceName: SERVICE_NAMES.WMS,
        operatorContext: {
          operatorId: current.operatorContext.operator_id,
          operatorType: current.operatorContext.operator_type,
          tenantId: current.operatorContext.tenant_id,
          orgId: current.operatorContext.org_id,
          operatorRoles: current.operatorContext.operator_roles
        },
        requestId: current.requestId,
        traceId: current.traceId
      })
    }

    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.WMS,
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }
}
