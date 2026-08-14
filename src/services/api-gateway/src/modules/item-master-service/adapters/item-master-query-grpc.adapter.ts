import { Injectable, OnModuleInit } from '@nestjs/common'
import { ITEM_MASTER_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import {
  GetBomByOutputItemRequest,
  GetBomByOutputItemResponse,
  GetBomRequest,
  GetBomResponse,
  GetItemModelRequest,
  GetItemModelResponse,
  GetItemRequest,
  GetItemResponse,
  GetItemModelAttributeRulesRequest,
  GetItemModelAttributeRulesResponse,
  GetPackagingSpecRequest,
  GetPackagingSpecResponse,
  ItemMasterQueryServiceClient,
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
  SearchBomsRequest,
  SearchBomsResponse,
  SearchItemModelsRequest,
  SearchItemModelsResponse,
  SearchItemsRequest,
  SearchItemsResponse,
  SearchPackagingSpecsRequest,
  SearchPackagingSpecsResponse
} from '@oes/common/generated/item_master_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { GatewayItemMasterGrpcClient } from '../../../common/grpc/gateway-item-master-grpc.client'
import { GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc/gateway-trusted-grpc-execution-producer'

const CALLER = 'api-gateway'
const ITEM_MASTER_AUDIENCE = 'urn:oes:service:item-master-service'

@Injectable()
// Proxies item-master V2 read RPCs from api-gateway into item-master-service.
export class ItemMasterQueryGrpcAdapter implements OnModuleInit {
  private svc!: ItemMasterQueryServiceClient

  constructor(
    private readonly client: GatewayItemMasterGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.query()
  }

  searchItemModels(
    input: SearchItemModelsRequest,
    source: DownstreamRequestSource
  ): Promise<SearchItemModelsResponse> {
    return this.invoke(
      'searchItemModels',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_MODEL,
      input,
      source
    )
  }

  getItemModel(
    input: GetItemModelRequest,
    source: DownstreamRequestSource
  ): Promise<GetItemModelResponse> {
    return this.invoke(
      'getItemModel',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_MODEL_DETAIL,
      input,
      source
    )
  }

  searchItems(
    input: SearchItemsRequest,
    source: DownstreamRequestSource
  ): Promise<SearchItemsResponse> {
    return this.invoke(
      'searchItems',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM,
      input,
      source
    )
  }

  getItem(input: GetItemRequest, source: DownstreamRequestSource): Promise<GetItemResponse> {
    return this.invoke(
      'getItem',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.VIEW_ITEM_DETAIL,
      input,
      source
    )
  }

  listAttributeDefinitions(
    input: ListAttributeDefinitionsRequest,
    source: DownstreamRequestSource
  ): Promise<ListAttributeDefinitionsResponse> {
    return this.invoke(
      'listAttributeDefinitions',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
      input,
      source
    )
  }

  listAttributeOptions(
    input: ListAttributeOptionsRequest,
    source: DownstreamRequestSource
  ): Promise<ListAttributeOptionsResponse> {
    return this.invoke(
      'listAttributeOptions',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
      input,
      source
    )
  }

  getItemModelAttributeRules(
    input: GetItemModelAttributeRulesRequest,
    source: DownstreamRequestSource
  ): Promise<GetItemModelAttributeRulesResponse> {
    return this.invoke(
      'getItemModelAttributeRules',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ATTRIBUTE,
      input,
      source
    )
  }

  listItemCategories(
    input: ListItemCategoriesRequest,
    source: DownstreamRequestSource
  ): Promise<ListItemCategoriesResponse> {
    return this.invoke(
      'listItemCategories',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_ITEM_CATEGORIES,
      input,
      source
    )
  }

  listPackagingMethods(
    input: ListPackagingMethodsRequest,
    source: DownstreamRequestSource
  ): Promise<ListPackagingMethodsResponse> {
    return this.invoke(
      'listPackagingMethods',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
      input,
      source
    )
  }

  getPackagingSpec(
    input: GetPackagingSpecRequest,
    source: DownstreamRequestSource
  ): Promise<GetPackagingSpecResponse> {
    return this.invoke(
      'getPackagingSpec',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
      input,
      source
    )
  }

  searchPackagingSpecs(
    input: SearchPackagingSpecsRequest,
    source: DownstreamRequestSource
  ): Promise<SearchPackagingSpecsResponse> {
    return this.invoke(
      'searchPackagingSpecs',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_PACKAGING,
      input,
      source
    )
  }

  searchBoms(
    input: SearchBomsRequest,
    source: DownstreamRequestSource
  ): Promise<SearchBomsResponse> {
    return this.invoke(
      'searchBoms',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
      input,
      source
    )
  }

  getBom(input: GetBomRequest, source: DownstreamRequestSource): Promise<GetBomResponse> {
    return this.invoke('getBom', ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM, input, source)
  }

  getBomByOutputItem(
    input: GetBomByOutputItemRequest,
    source: DownstreamRequestSource
  ): Promise<GetBomByOutputItemResponse> {
    return this.invoke(
      'getBomByOutputItem',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_BOM,
      input,
      source
    )
  }

  listSupplierItemMappingsByItem(
    input: ListSupplierItemMappingsByItemRequest,
    source: DownstreamRequestSource
  ): Promise<ListSupplierItemMappingsByItemResponse> {
    return this.invoke(
      'listSupplierItemMappingsByItem',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_ITEM_MAPPINGS,
      input,
      source
    )
  }

  /** Exchanges one HUMAN/WEB Item Master token and removes the retired body tenant before dispatch. */
  private async invoke<TResponse>(
    method: keyof ItemMasterQueryServiceClient,
    code: string,
    input: object,
    source: DownstreamRequestSource
  ): Promise<TResponse> {
    const metadata = await this.trustedExecution.forBusinessCall(source, ITEM_MASTER_AUDIENCE, [
      code
    ])
    const request = { ...input } as Record<string, unknown>
    delete request.tenantId
    return safeGrpcCall<TResponse>(
      (this.svc[method] as any)(request, metadata),
      this.opts(String(method))
    )
  }

  /** opts builds the shared gateway caller metadata for one proxied item-master query. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
