import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  GrpcRequestContextStore,
  ITEM_MASTER_INTERNAL_PERMISSION_CODES
} from '@oes/common/authorization'
import { ItemMasterInternalQueryServiceClient } from '@oes/common/generated/item_master_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  ItemReferenceLookupPort,
  ItemReferenceLookupResult
} from '../../application/ports/item-reference-lookup.port'
import { ProcurementItemMasterTrustedGrpcClient } from './item-master-trusted-grpc.client'
import { ProcurementItemMasterTrustedGrpcExecutionProducer } from './procurement-item-master-trusted-grpc-execution.producer'

const CALLER = 'procurement-service'

/** ItemMasterQueryGrpcAdapter validates standard-item identity and purchasable capability through item-master-service query truth. */
@Injectable()
export class ItemMasterQueryGrpcAdapter implements ItemReferenceLookupPort, OnModuleInit {
  private itemMasterQueryService!: ItemMasterInternalQueryServiceClient

  constructor(
    private readonly itemMasterClient: ProcurementItemMasterTrustedGrpcClient,
    private readonly producer: ProcurementItemMasterTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.itemMasterQueryService = this.itemMasterClient.internalQuery()
  }

  async getItemById(tenantId: string, itemId: string): Promise<ItemReferenceLookupResult | null> {
    const response = await safeGrpcCall(
      this.itemMasterQueryService.resolvePurchasableItem(
        { itemId },
        await this.buildMetadata(tenantId)
      ),
      {
        caller: CALLER,
        method: 'ItemMasterInternalQueryService.resolvePurchasableItem'
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
      purchasable: true
    }
  }

  /** buildMetadata forwards trace/request context while keeping item lookup on the internal-service boundary. */
  private buildMetadata(tenantId: string) {
    const current = this.requestContextStore.getContext()
    return this.producer.createMetadata(
      ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_PURCHASABLE_ITEM,
      tenantId,
      current?.requestId,
      current?.traceId
    )
  }
}
