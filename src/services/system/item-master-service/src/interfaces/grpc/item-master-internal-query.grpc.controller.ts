import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthorizeInternalCall, GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ItemMasterInternalQueryServiceController,
  ItemMasterInternalQueryServiceControllerMethods,
  ResolveManufacturableItemRequest,
  ResolveManufacturableItemResponse,
  ResolvePurchasableItemRequest,
  ResolvePurchasableItemResponse,
  ResolveStockableItemRequest,
  ResolveStockableItemResponse
} from '@oes/common/generated/item_master_service'
import { ItemMasterQueryV2Service } from '../../application/item-master-v2.service'
import { ItemMasterRpcContextGuard } from './item-master-rpc-context.guard'
import { ItemMasterTrustedInternalExecutionGuard } from '../../modules/item-master-trusted-execution.module'

/** Exposes only the three frozen workload-only Item eligibility queries. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(ItemMasterTrustedInternalExecutionGuard, ItemMasterRpcContextGuard)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@ItemMasterInternalQueryServiceControllerMethods()
export class ItemMasterInternalQueryGrpcController implements ItemMasterInternalQueryServiceController {
  constructor(private readonly queries: ItemMasterQueryV2Service) {}
  resolveManufacturableItem(
    request: ResolveManufacturableItemRequest
  ): Promise<ResolveManufacturableItemResponse> {
    return this.queries.resolveManufacturableItem(request)
  }
  resolveStockableItem(
    request: ResolveStockableItemRequest
  ): Promise<ResolveStockableItemResponse> {
    return this.queries.resolveStockableItem(request)
  }
  resolvePurchasableItem(
    request: ResolvePurchasableItemRequest
  ): Promise<ResolvePurchasableItemResponse> {
    return this.queries.resolvePurchasableItem(request)
  }
}

AuthorizeInternalCall({ all: ['item_master.internal.manufacturable_item.resolve'] })(
  ItemMasterInternalQueryGrpcController.prototype,
  'resolveManufacturableItem',
  Object.getOwnPropertyDescriptor(
    ItemMasterInternalQueryGrpcController.prototype,
    'resolveManufacturableItem'
  )
)
AuthorizeInternalCall({ all: ['item_master.internal.stockable_item.resolve'] })(
  ItemMasterInternalQueryGrpcController.prototype,
  'resolveStockableItem',
  Object.getOwnPropertyDescriptor(
    ItemMasterInternalQueryGrpcController.prototype,
    'resolveStockableItem'
  )
)
AuthorizeInternalCall({ all: ['item_master.internal.purchasable_item.resolve'] })(
  ItemMasterInternalQueryGrpcController.prototype,
  'resolvePurchasableItem',
  Object.getOwnPropertyDescriptor(
    ItemMasterInternalQueryGrpcController.prototype,
    'resolvePurchasableItem'
  )
)
