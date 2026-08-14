import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  GrpcRequestContextStore,
  ITEM_MASTER_INTERNAL_PERMISSION_CODES
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { ItemMasterInternalQueryServiceClient } from '@oes/common/generated/item_master_service'
import { safeGrpcCall } from '@oes/common/transport'
import { ItemLookupPort, ItemLookupResult } from '../../application/ports/item-lookup.port'
import { SrmItemMasterTrustedGrpcClient } from './item-master-trusted-grpc.client'
import { SrmItemMasterTrustedGrpcExecutionProducer } from './srm-item-master-trusted-grpc-execution.producer'

/** ItemMasterQueryGrpcAdapter validates item identity and purchasable capability through item-master-service query truth. */
@Injectable()
export class ItemMasterQueryGrpcAdapter implements ItemLookupPort, OnModuleInit {
  private itemMasterQueryService!: ItemMasterInternalQueryServiceClient

  constructor(
    private readonly itemMasterClient: SrmItemMasterTrustedGrpcClient,
    private readonly producer: SrmItemMasterTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.itemMasterQueryService = this.itemMasterClient.internalQuery()
  }

  async getItemById(tenantId: string, itemId: string): Promise<ItemLookupResult | null> {
    const response = await safeGrpcCall(
      this.itemMasterQueryService.resolvePurchasableItem(
        { itemId },
        await this.buildMetadata(tenantId)
      ),
      {
        caller: SERVICE_NAMES.SRM,
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
