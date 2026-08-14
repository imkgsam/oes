import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  GrpcRequestContextInterceptor,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { ITEM_MASTER_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
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
import { ItemMasterVerifiedTenantContextGuard } from './item-master-rpc-context.guard'

/** ItemMasterQueryGrpcController exposes Contract V2 item-master read-only RPCs. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard, ItemMasterVerifiedTenantContextGuard)
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

  listAttributeDefinitions(
    request: ListAttributeDefinitionsRequest
  ): Promise<ListAttributeDefinitionsResponse> {
    return this.queries.listAttributeDefinitions(request)
  }

  listAttributeOptions(
    request: ListAttributeOptionsRequest
  ): Promise<ListAttributeOptionsResponse> {
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

  listPackagingMethods(
    request: ListPackagingMethodsRequest
  ): Promise<ListPackagingMethodsResponse> {
    return this.queries.listPackagingMethods(request)
  }

  getPackagingSpec(request: GetPackagingSpecRequest): Promise<GetPackagingSpecResponse> {
    return this.queries.getPackagingSpec(request)
  }

  searchPackagingSpecs(
    request: SearchPackagingSpecsRequest
  ): Promise<SearchPackagingSpecsResponse> {
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

/** Registers the frozen HUMAN/WEB declaration matrix without making authorization a business concern. */
for (const [method, code] of Object.entries({
  getItemModel: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_MODEL_DETAIL,
  batchGetItemModels: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_MODEL,
  searchItemModels: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_MODEL,
  listAttributeDefinitions: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  listAttributeOptions: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  getItemModelAttributeRules: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
  getItem: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_DETAIL,
  batchGetItems: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM,
  searchItems: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM,
  resolveItemVariant: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_DETAIL,
  listItemCategories: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_CATEGORIES,
  listPackagingMethods: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  getPackagingSpec: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  searchPackagingSpecs: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
  getBom: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  searchBoms: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  getBomByOutputItem: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
  listSupplierItemMappingsByItem:
    ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_ITEM_MAPPINGS,
  resolveSupplierItemMapping: ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_ITEM_MAPPINGS
})) {
  AuthorizeBusinessRpc({ all: [code] }, { principalType: 'HUMAN', sessionTerminal: 'WEB' })(
    ItemMasterQueryGrpcController.prototype,
    method,
    Object.getOwnPropertyDescriptor(ItemMasterQueryGrpcController.prototype, method)
  )
}
