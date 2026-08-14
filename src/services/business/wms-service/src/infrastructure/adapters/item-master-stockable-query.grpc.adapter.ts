import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  GrpcRequestContextStore,
  ITEM_MASTER_INTERNAL_PERMISSION_CODES
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { ItemMasterInternalQueryServiceClient } from '@oes/common/generated/item_master_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  StockableItemLookupPort,
  StockableItemLookupResult
} from '../../application/ports/stockable-item-lookup.port'
import { WmsItemMasterTrustedGrpcClient } from './item-master-trusted-grpc.client'
import { WmsItemMasterTrustedGrpcExecutionProducer } from './wms-item-master-trusted-grpc-execution.producer'

/** ItemMasterStockableQueryGrpcAdapter validates WMS receipt items through item-master-service query truth. */
@Injectable()
export class ItemMasterStockableQueryGrpcAdapter implements StockableItemLookupPort, OnModuleInit {
  private itemMasterQueryService!: ItemMasterInternalQueryServiceClient

  constructor(
    private readonly itemMasterClient: WmsItemMasterTrustedGrpcClient,
    private readonly producer: WmsItemMasterTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.itemMasterQueryService = this.itemMasterClient.internalQuery()
  }

  async getItemById(tenantId: string, itemId: string): Promise<StockableItemLookupResult | null> {
    const response = await safeGrpcCall(
      this.itemMasterQueryService.resolveStockableItem(
        { itemId },
        await this.buildMetadata(tenantId)
      ),
      {
        caller: SERVICE_NAMES.WMS,
        method: 'ItemMasterInternalQueryService.resolveStockableItem'
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
      stockable: true
    }
  }

  /** buildMetadata forwards trace/request context while keeping item lookup on the internal-service boundary. */
  private buildMetadata(tenantId: string) {
    const current = this.requestContextStore.getContext()
    return this.producer.createMetadata(
      ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_STOCKABLE_ITEM,
      tenantId,
      current?.requestId,
      current?.traceId
    )
  }
}
