import { Injectable, OnModuleInit } from '@nestjs/common'
import { ITEM_MASTER_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import {
  ChangeBomStatusRequest,
  ChangeBomStatusResponse,
  ChangeItemCategoryStatusRequest,
  ChangeItemCategoryStatusResponse,
  ChangeItemModelStatusRequest,
  ChangeItemModelStatusResponse,
  ChangeItemStatusRequest,
  ChangeItemStatusResponse,
  ChangePackagingMethodStatusRequest,
  ChangePackagingMethodStatusResponse,
  ChangePackagingSpecStatusRequest,
  ChangePackagingSpecStatusResponse,
  CreateAttributeDefinitionRequest,
  CreateAttributeDefinitionResponse,
  CreateAttributeOptionRequest,
  CreateAttributeOptionResponse,
  CreateBomRequest,
  CreateBomResponse,
  CreateItemCategoryRequest,
  CreateItemCategoryResponse,
  CreateItemModelRequest,
  CreateItemModelResponse,
  CreateItemRequest,
  CreateItemResponse,
  CreatePackagingMethodRequest,
  CreatePackagingMethodResponse,
  CreatePackagingSpecRequest,
  CreatePackagingSpecResponse,
  DeleteItemCategoryRequest,
  DeleteItemCategoryResponse,
  DeletePackagingMethodRequest,
  DeletePackagingMethodResponse,
  ItemMasterManagementServiceClient,
  MoveItemCategoryRequest,
  MoveItemCategoryResponse,
  ReplaceBomLinesRequest,
  ReplaceBomLinesResponse,
  SetItemModelAttributeRulesRequest,
  SetItemModelAttributeRulesResponse,
  SetItemCapabilitiesRequest,
  SetItemCapabilitiesResponse,
  SetItemModelCapabilitiesRequest,
  SetItemModelCapabilitiesResponse,
  SetItemModelPrimaryCategoryRequest,
  SetItemModelPrimaryCategoryResponse,
  UpdateAttributeDefinitionRequest,
  UpdateAttributeDefinitionResponse,
  UpdateAttributeOptionRequest,
  UpdateAttributeOptionResponse,
  UpdateBomBasicsRequest,
  UpdateBomBasicsResponse,
  UpdateItemBasicsRequest,
  UpdateItemBasicsResponse,
  UpdateItemCategoryBasicsRequest,
  UpdateItemCategoryBasicsResponse,
  UpdateItemModelBasicsRequest,
  UpdateItemModelBasicsResponse,
  UpdatePackagingMethodRequest,
  UpdatePackagingMethodResponse,
  UpdatePackagingSpecRequest,
  UpdatePackagingSpecResponse,
  UpsertSupplierItemMappingRequest,
  UpsertSupplierItemMappingResponse
} from '@oes/common/generated/item_master_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { GatewayItemMasterGrpcClient } from '../../../common/grpc/gateway-item-master-grpc.client'
import { GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc/gateway-trusted-grpc-execution-producer'

const CALLER = 'api-gateway'
const ITEM_MASTER_AUDIENCE = 'urn:oes:service:item-master-service'

@Injectable()
// Proxies item-master V2 write RPCs from api-gateway into item-master-service.
export class ItemMasterManagementGrpcAdapter implements OnModuleInit {
  private svc!: ItemMasterManagementServiceClient

  constructor(
    private readonly client: GatewayItemMasterGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.management()
  }

  createItemModel(
    input: CreateItemModelRequest,
    source: DownstreamRequestSource
  ): Promise<CreateItemModelResponse> {
    return this.invoke(
      'createItemModel',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM_MODEL,
      input,
      source
    )
  }

  updateItemModelBasics(
    input: UpdateItemModelBasicsRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateItemModelBasicsResponse> {
    return this.invoke(
      'updateItemModelBasics',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
      input,
      source
    )
  }

  setItemModelCapabilities(
    input: SetItemModelCapabilitiesRequest,
    source: DownstreamRequestSource
  ): Promise<SetItemModelCapabilitiesResponse> {
    return this.invoke(
      'setItemModelCapabilities',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
      input,
      source
    )
  }

  changeItemModelStatus(
    input: ChangeItemModelStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangeItemModelStatusResponse> {
    return this.invoke(
      'changeItemModelStatus',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ITEM_MODEL,
      input,
      source
    )
  }

  setItemModelPrimaryCategory(
    input: SetItemModelPrimaryCategoryRequest,
    source: DownstreamRequestSource
  ): Promise<SetItemModelPrimaryCategoryResponse> {
    return this.invoke(
      'setItemModelPrimaryCategory',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_PRIMARY_CATEGORY,
      input,
      source
    )
  }

  createItem(
    input: CreateItemRequest,
    source: DownstreamRequestSource
  ): Promise<CreateItemResponse> {
    return this.invoke(
      'createItem',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM,
      input,
      source
    )
  }

  updateItemBasics(
    input: UpdateItemBasicsRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateItemBasicsResponse> {
    return this.invoke(
      'updateItemBasics',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_BASICS,
      input,
      source
    )
  }

  setItemCapabilities(
    input: SetItemCapabilitiesRequest,
    source: DownstreamRequestSource
  ): Promise<SetItemCapabilitiesResponse> {
    return this.invoke(
      'setItemCapabilities',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.SET_ITEM_CAPABILITIES,
      input,
      source
    )
  }

  changeItemStatus(
    input: ChangeItemStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangeItemStatusResponse> {
    return this.invoke(
      'changeItemStatus',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_STATUS,
      input,
      source
    )
  }

  createAttributeDefinition(
    input: CreateAttributeDefinitionRequest,
    source: DownstreamRequestSource
  ): Promise<CreateAttributeDefinitionResponse> {
    return this.invoke(
      'createAttributeDefinition',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ATTRIBUTE,
      input,
      source
    )
  }

  updateAttributeDefinition(
    input: UpdateAttributeDefinitionRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateAttributeDefinitionResponse> {
    return this.invoke(
      'updateAttributeDefinition',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
      input,
      source
    )
  }

  createAttributeOption(
    input: CreateAttributeOptionRequest,
    source: DownstreamRequestSource
  ): Promise<CreateAttributeOptionResponse> {
    return this.invoke(
      'createAttributeOption',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ATTRIBUTE,
      input,
      source
    )
  }

  updateAttributeOption(
    input: UpdateAttributeOptionRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateAttributeOptionResponse> {
    return this.invoke(
      'updateAttributeOption',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
      input,
      source
    )
  }

  setItemModelAttributeRules(
    input: SetItemModelAttributeRulesRequest,
    source: DownstreamRequestSource
  ): Promise<SetItemModelAttributeRulesResponse> {
    return this.invoke(
      'setItemModelAttributeRules',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_ATTRIBUTE,
      input,
      source
    )
  }

  createItemCategory(
    input: CreateItemCategoryRequest,
    source: DownstreamRequestSource
  ): Promise<CreateItemCategoryResponse> {
    return this.invoke(
      'createItemCategory',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_ITEM_CATEGORY,
      input,
      source
    )
  }

  updateItemCategoryBasics(
    input: UpdateItemCategoryBasicsRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateItemCategoryBasicsResponse> {
    return this.invoke(
      'updateItemCategoryBasics',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_CATEGORY_BASICS,
      input,
      source
    )
  }

  moveItemCategory(
    input: MoveItemCategoryRequest,
    source: DownstreamRequestSource
  ): Promise<MoveItemCategoryResponse> {
    return this.invoke(
      'moveItemCategory',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_CATEGORY_BASICS,
      input,
      source
    )
  }

  changeItemCategoryStatus(
    input: ChangeItemCategoryStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangeItemCategoryStatusResponse> {
    return this.invoke(
      'changeItemCategoryStatus',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPDATE_ITEM_CATEGORY_STATUS,
      input,
      source
    )
  }

  deleteItemCategory(
    input: DeleteItemCategoryRequest,
    source: DownstreamRequestSource
  ): Promise<DeleteItemCategoryResponse> {
    return this.invoke(
      'deleteItemCategory',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.DELETE_ITEM_CATEGORY,
      input,
      source
    )
  }

  createPackagingMethod(
    input: CreatePackagingMethodRequest,
    source: DownstreamRequestSource
  ): Promise<CreatePackagingMethodResponse> {
    return this.invoke(
      'createPackagingMethod',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_PACKAGING,
      input,
      source
    )
  }

  updatePackagingMethod(
    input: UpdatePackagingMethodRequest,
    source: DownstreamRequestSource
  ): Promise<UpdatePackagingMethodResponse> {
    return this.invoke(
      'updatePackagingMethod',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
      input,
      source
    )
  }

  changePackagingMethodStatus(
    input: ChangePackagingMethodStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangePackagingMethodStatusResponse> {
    return this.invoke(
      'changePackagingMethodStatus',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
      input,
      source
    )
  }

  deletePackagingMethod(
    input: DeletePackagingMethodRequest,
    source: DownstreamRequestSource
  ): Promise<DeletePackagingMethodResponse> {
    return this.invoke(
      'deletePackagingMethod',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
      input,
      source
    )
  }

  createPackagingSpec(
    input: CreatePackagingSpecRequest,
    source: DownstreamRequestSource
  ): Promise<CreatePackagingSpecResponse> {
    return this.invoke(
      'createPackagingSpec',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_PACKAGING,
      input,
      source
    )
  }

  updatePackagingSpec(
    input: UpdatePackagingSpecRequest,
    source: DownstreamRequestSource
  ): Promise<UpdatePackagingSpecResponse> {
    return this.invoke(
      'updatePackagingSpec',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
      input,
      source
    )
  }

  changePackagingSpecStatus(
    input: ChangePackagingSpecStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangePackagingSpecStatusResponse> {
    return this.invoke(
      'changePackagingSpecStatus',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_PACKAGING,
      input,
      source
    )
  }

  createBom(input: CreateBomRequest, source: DownstreamRequestSource): Promise<CreateBomResponse> {
    return this.invoke(
      'createBom',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.CREATE_BOM,
      input,
      source
    )
  }

  updateBomBasics(
    input: UpdateBomBasicsRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateBomBasicsResponse> {
    return this.invoke(
      'updateBomBasics',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_BOM,
      input,
      source
    )
  }

  replaceBomLines(
    input: ReplaceBomLinesRequest,
    source: DownstreamRequestSource
  ): Promise<ReplaceBomLinesResponse> {
    return this.invoke(
      'replaceBomLines',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_BOM,
      input,
      source
    )
  }

  changeBomStatus(
    input: ChangeBomStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangeBomStatusResponse> {
    return this.invoke(
      'changeBomStatus',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.MANAGE_BOM,
      input,
      source
    )
  }

  upsertSupplierItemMapping(
    input: UpsertSupplierItemMappingRequest,
    source: DownstreamRequestSource
  ): Promise<UpsertSupplierItemMappingResponse> {
    return this.invoke(
      'upsertSupplierItemMapping',
      ITEM_MASTER_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_ITEM_MAPPING,
      input,
      source
    )
  }

  /** Exchanges one HUMAN/WEB Item Master token and removes the retired body tenant before dispatch. */
  private async invoke<TResponse>(
    method: keyof ItemMasterManagementServiceClient,
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

  /** opts builds the shared gateway caller metadata for one proxied item-master mutation. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
