import { Injectable, OnModuleInit } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import {
  GrpcRequestContextStore,
  ITEM_MASTER_INTERNAL_PERMISSION_CODES
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { ItemMasterInternalQueryServiceClient } from '@oes/common/generated/item_master_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  ManufacturableItemLookupPort,
  ManufacturableItemLookupResult
} from '../../application/ports/manufacturable-item-lookup.port'
import { MesItemMasterTrustedGrpcClient } from './item-master-trusted-grpc.client'
import { MesItemMasterTrustedGrpcExecutionProducer } from './mes-item-master-trusted-grpc-execution.producer'

const MES_SERVICE_NAME = 'mes-service'

/** ItemMasterManufacturableQueryGrpcAdapter validates ProductionSpec items through item-master-service query truth. */
@Injectable()
export class ItemMasterManufacturableQueryGrpcAdapter
  implements ManufacturableItemLookupPort, OnModuleInit
{
  private itemMasterQueryService!: ItemMasterInternalQueryServiceClient

  constructor(
    private readonly itemMasterClient: MesItemMasterTrustedGrpcClient,
    private readonly producer: MesItemMasterTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.itemMasterQueryService = this.itemMasterClient.internalQuery()
  }

  async getManufacturableItem(
    tenantId: string,
    itemId: string
  ): Promise<ManufacturableItemLookupResult | null> {
    try {
      const response = await safeGrpcCall(
        this.itemMasterQueryService.resolveManufacturableItem(
          { itemId },
          await this.buildMetadata(tenantId)
        ),
        {
          caller: MES_SERVICE_NAME,
          method: 'ItemMasterInternalQueryService.resolveManufacturableItem'
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
        manufacturable: true,
        physical: true
      }
    } catch (error) {
      if (isNotFoundRpc(error)) {
        return null
      }
      throw error
    }
  }

  /** buildMetadata forwards trace and operator context while staying on the internal-service boundary. */
  private buildMetadata(tenantId: string) {
    const current = this.requestContextStore.getContext()
    return this.producer.createMetadata(
      ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_MANUFACTURABLE_ITEM,
      tenantId,
      current?.requestId,
      current?.traceId
    )
  }
}

/** isNotFoundRpc recognizes downstream business NOT_FOUND payloads so MES can classify missing items locally. */
function isNotFoundRpc(error: unknown): boolean {
  if (!(error instanceof RpcException)) {
    return false
  }
  const payload = error.getError()
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'grpcStatus' in payload &&
    (payload as { grpcStatus?: number }).grpcStatus === 5
  )
}
