import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  BatchGetItemModelsRequest,
  BatchGetItemModelsResponse,
  BatchGetItemsRequest,
  BatchGetItemsResponse,
  GetBomByOutputItemRequest,
  GetBomByOutputItemResponse,
  GetBomRequest,
  GetBomResponse,
  GetItemModelAttributeRulesRequest,
  GetItemModelAttributeRulesResponse,
  GetItemModelRequest,
  GetItemModelResponse,
  GetItemRequest,
  GetItemResponse,
  GetPackagingSpecRequest,
  GetPackagingSpecResponse,
  ItemMasterQueryServiceController,
  ItemMasterQueryServiceControllerMethods,
  ListAttributeDefinitionsRequest,
  ListAttributeDefinitionsResponse,
  ListAttributeOptionsRequest,
  ListAttributeOptionsResponse,
  ListItemCategoriesRequest,
  ListItemCategoriesResponse,
  ListPackagingMethodsRequest,
  ListPackagingMethodsResponse,
  ListSupplierItemMappingsByItemRequest,
  ListSupplierItemMappingsByItemResponse,
  ResolveItemVariantRequest,
  ResolveItemVariantResponse,
  ResolveSupplierItemMappingRequest,
  ResolveSupplierItemMappingResponse,
  SearchBomsRequest,
  SearchBomsResponse,
  SearchItemModelsRequest,
  SearchItemModelsResponse,
  SearchItemsRequest,
  SearchItemsResponse,
  SearchPackagingSpecsRequest,
  SearchPackagingSpecsResponse
} from '@oes/common/generated/item_master_service'
import { ItemMasterQueryV2Service } from '../../application/item-master-v2.service'
import { ItemMasterRpcContextGuard } from './item-master-rpc-context.guard'

/** ItemMasterQueryGrpcController exposes Contract V2 item-master read-only RPCs. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(ItemMasterRpcContextGuard)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@ItemMasterQueryServiceControllerMethods()
export class ItemMasterQueryGrpcController implements ItemMasterQueryServiceController {
  constructor(private readonly queries: ItemMasterQueryV2Service) {}

  getItemModel(request: GetItemModelRequest): Promise<GetItemModelResponse> {
    return this.queries.getItemModel(request)
  }

  batchGetItemModels(request: BatchGetItemModelsRequest): Promise<BatchGetItemModelsResponse> {
    return this.queries.batchGetItemModels(request)
  }

  searchItemModels(request: SearchItemModelsRequest): Promise<SearchItemModelsResponse> {
    return this.queries.searchItemModels(request)
  }

  listAttributeDefinitions(request: ListAttributeDefinitionsRequest): Promise<ListAttributeDefinitionsResponse> {
    return this.queries.listAttributeDefinitions(request)
  }

  listAttributeOptions(request: ListAttributeOptionsRequest): Promise<ListAttributeOptionsResponse> {
    return this.queries.listAttributeOptions(request)
  }

  getItemModelAttributeRules(
    request: GetItemModelAttributeRulesRequest
  ): Promise<GetItemModelAttributeRulesResponse> {
    return this.queries.getItemModelAttributeRules(request)
  }

  getItem(request: GetItemRequest): Promise<GetItemResponse> {
    return this.queries.getItem(request)
  }

  batchGetItems(request: BatchGetItemsRequest): Promise<BatchGetItemsResponse> {
    return this.queries.batchGetItems(request)
  }

  searchItems(request: SearchItemsRequest): Promise<SearchItemsResponse> {
    return this.queries.searchItems(request)
  }

  resolveItemVariant(request: ResolveItemVariantRequest): Promise<ResolveItemVariantResponse> {
    return this.queries.resolveItemVariant(request)
  }

  listItemCategories(request: ListItemCategoriesRequest): Promise<ListItemCategoriesResponse> {
    return this.queries.listItemCategories(request)
  }

  listPackagingMethods(request: ListPackagingMethodsRequest): Promise<ListPackagingMethodsResponse> {
    return this.queries.listPackagingMethods(request)
  }

  getPackagingSpec(request: GetPackagingSpecRequest): Promise<GetPackagingSpecResponse> {
    return this.queries.getPackagingSpec(request)
  }

  searchPackagingSpecs(request: SearchPackagingSpecsRequest): Promise<SearchPackagingSpecsResponse> {
    return this.queries.searchPackagingSpecs(request)
  }

  getBom(request: GetBomRequest): Promise<GetBomResponse> {
    return this.queries.getBom(request)
  }

  searchBoms(request: SearchBomsRequest): Promise<SearchBomsResponse> {
    return this.queries.searchBoms(request)
  }

  getBomByOutputItem(request: GetBomByOutputItemRequest): Promise<GetBomByOutputItemResponse> {
    return this.queries.getBomByOutputItem(request)
  }

  listSupplierItemMappingsByItem(
    request: ListSupplierItemMappingsByItemRequest
  ): Promise<ListSupplierItemMappingsByItemResponse> {
    return this.queries.listSupplierItemMappingsByItem(request)
  }

  resolveSupplierItemMapping(
    request: ResolveSupplierItemMappingRequest
  ): Promise<ResolveSupplierItemMappingResponse> {
    return this.queries.resolveSupplierItemMapping(request)
  }
}
