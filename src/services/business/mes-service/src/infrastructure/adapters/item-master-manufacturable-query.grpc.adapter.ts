import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc, RpcException } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  ITEM_MASTER_QUERY_SERVICE_NAME,
  ItemMasterQueryServiceClient,
  ItemNatureType,
  ItemStatus
} from '@oes/common/generated/item_master_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  ManufacturableItemLookupPort,
  ManufacturableItemLookupResult
} from '../../application/ports/manufacturable-item-lookup.port'

const MES_SERVICE_NAME = 'mes-service'

/** ItemMasterManufacturableQueryGrpcAdapter validates ManufacturingSpec items through item-master-service query truth. */
@Injectable()
export class ItemMasterManufacturableQueryGrpcAdapter implements ManufacturableItemLookupPort, OnModuleInit {
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

  async getManufacturableItem(tenantId: string, itemId: string): Promise<ManufacturableItemLookupResult | null> {
    try {
      const response = await safeGrpcCall(
        this.itemMasterQueryService.getItem(
          {
            tenantId,
            itemId
          },
          this.buildMetadata()
        ),
        {
          caller: MES_SERVICE_NAME,
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
        manufacturable: item.capabilities?.manufacturable ?? false,
        physical: item.natureType === ItemNatureType.ITEM_NATURE_TYPE_PHYSICAL &&
          item.status === ItemStatus.ITEM_STATUS_ACTIVE
      }
    } catch (error) {
      if (isNotFoundRpc(error)) {
        return null
      }
      throw error
    }
  }

  /** buildMetadata forwards trace and operator context while staying on the internal-service boundary. */
  private buildMetadata() {
    const current = this.requestContextStore.getContext()
    if (current?.operatorContext) {
      return this.metadataFactory.createOperatorScopedMetadata({
        callerServiceName: MES_SERVICE_NAME,
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
      callerServiceName: MES_SERVICE_NAME,
      requestId: current?.requestId,
      traceId: current?.traceId
    })
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
