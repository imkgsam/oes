import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  BatchGetItemsRequest,
  BatchGetItemsResponse,
  GetItemCompositionRequest,
  GetItemCompositionResponse,
  GetItemRequest,
  GetItemResponse,
  ItemMasterQueryServiceController,
  ItemMasterQueryServiceControllerMethods,
  ListSupplierItemMappingsByItemRequest,
  ListSupplierItemMappingsByItemResponse,
  ResolveSupplierItemMappingRequest,
  ResolveSupplierItemMappingResponse,
  SearchItemsRequest,
  SearchItemsResponse
} from '@oes/common/generated/item_master_service'
import { ItemMasterGrpcPresenter } from './item-master-grpc.presenter'
import { ItemMasterRpcContextGuard } from './item-master-rpc-context.guard'
import { GetItemQuery } from '../../application/queries/get-item.query'
import { BatchGetItemsQuery } from '../../application/queries/batch-get-items.query'
import { BatchGetItemsResult } from '../../application/queries/batch-get-items.handler'
import { SearchItemsQuery } from '../../application/queries/search-items.query'
import { GetItemCompositionQuery } from '../../application/queries/get-item-composition.query'
import {
  ListSupplierItemMappingsByItemQuery
} from '../../application/queries/list-supplier-item-mappings-by-item.query'
import {
  ResolveSupplierItemMappingResult
} from '../../application/queries/supplier-item-resolution.view'
import { ResolveSupplierItemMappingQuery } from '../../application/queries/resolve-supplier-item-mapping.query'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ListSupplierItemMappingsByItemResult } from '../../domain/repositories/supplier-item-mapping.repository'

/** ItemMasterQueryGrpcController exposes the phase 1 read-only item-master gRPC contract. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(ItemMasterRpcContextGuard)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@ItemMasterQueryServiceControllerMethods()
export class ItemMasterQueryGrpcController implements ItemMasterQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async getItem(request: GetItemRequest): Promise<GetItemResponse> {
    const item = await this.queryBus.execute<GetItemQuery, Item>(
      new GetItemQuery(request.tenantId ?? '', request.itemId ?? '')
    )

    return ItemMasterGrpcPresenter.toGetItemResponse(item)
  }

  async batchGetItems(request: BatchGetItemsRequest): Promise<BatchGetItemsResponse> {
    const result = await this.queryBus.execute<BatchGetItemsQuery, BatchGetItemsResult>(
      new BatchGetItemsQuery(request.tenantId ?? '', request.itemIds ?? [])
    )

    return {
      items: result.items.map((item) => ItemMasterGrpcPresenter.toItemSummary(item)),
      missingItemIds: result.missingItemIds
    }
  }

  async searchItems(request: SearchItemsRequest): Promise<SearchItemsResponse> {
    const result = await this.queryBus.execute(
      new SearchItemsQuery({
        tenantId: request.tenantId ?? '',
        keyword: request.keyword ?? undefined,
        structureType: request.structureType ?? undefined,
        natureType: request.natureType ?? undefined,
        capabilityFilters: request.capabilityFilters
          ? {
              sellable: request.capabilityFilters.sellable,
              purchasable: request.capabilityFilters.purchasable,
              stockable: request.capabilityFilters.stockable,
              manufacturable: request.capabilityFilters.manufacturable
            }
          : undefined,
        status: request.status ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return {
      items: result.items.map((item: Item) => ItemMasterGrpcPresenter.toItemSummary(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  async getItemComposition(request: GetItemCompositionRequest): Promise<GetItemCompositionResponse> {
    const result = await this.queryBus.execute(
      new GetItemCompositionQuery(request.tenantId ?? '', request.itemId ?? '')
    )

    return ItemMasterGrpcPresenter.toGetItemCompositionResponse(result)
  }

  async listSupplierItemMappingsByItem(
    request: ListSupplierItemMappingsByItemRequest
  ): Promise<ListSupplierItemMappingsByItemResponse> {
    const result = await this.queryBus.execute<
      ListSupplierItemMappingsByItemQuery,
      ListSupplierItemMappingsByItemResult
    >(
      new ListSupplierItemMappingsByItemQuery({
        tenantId: request.tenantId ?? '',
        itemId: request.itemId ?? '',
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return ItemMasterGrpcPresenter.toListSupplierItemMappingsByItemResponse(result)
  }

  async resolveSupplierItemMapping(
    request: ResolveSupplierItemMappingRequest
  ): Promise<ResolveSupplierItemMappingResponse> {
    const result = await this.queryBus.execute<
      ResolveSupplierItemMappingQuery,
      ResolveSupplierItemMappingResult
    >(
      new ResolveSupplierItemMappingQuery({
        tenantId: request.tenantId ?? '',
        supplierId: request.supplierId ?? '',
        supplierItemCode: request.supplierItemCode ?? undefined,
        supplierItemName: request.supplierItemName ?? undefined
      })
    )

    return ItemMasterGrpcPresenter.toResolveSupplierItemMappingResponse(result)
  }
}
