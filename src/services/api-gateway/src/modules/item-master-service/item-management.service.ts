import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import {
  BomLineInput,
  BomLineRole,
  BomRecord,
  BomType,
  AttributeDefinitionRecord,
  AttributeOptionRecord,
  ChangeBomStatusRequest,
  ChangeItemCategoryStatusRequest,
  ChangeItemModelStatusRequest,
  ChangeItemStatusRequest,
  ChangePackagingMethodStatusRequest,
  ChangePackagingSpecStatusRequest,
  CreateAttributeDefinitionRequest,
  CreateAttributeOptionRequest,
  CreateBomRequest,
  CreateItemCategoryRequest,
  CreateItemModelRequest,
  CreateItemRequest,
  CreatePackagingMethodRequest,
  CreatePackagingSpecRequest,
  DeleteItemCategoryRequest,
  DeletePackagingMethodRequest,
  GetItemModelAttributeRulesResponse,
  GetItemModelResponse,
  GetItemResponse,
  GetPackagingSpecResponse,
  ItemCapabilities,
  ItemCapabilityFilters,
  ItemCategorySummary,
  ItemCategoryTreeNode,
  ItemModelAttributeRuleRecord,
  ItemModelKind,
  ItemModelRecord,
  ItemModelType,
  ItemSummary,
  ItemType,
  ListAttributeDefinitionsResponse,
  ListAttributeOptionsResponse,
  ListPackagingMethodsResponse,
  MoveItemCategoryRequest,
  SearchPackagingSpecsRequest,
  SearchPackagingSpecsResponse,
  ListSupplierItemMappingsByItemResponse,
  ReplaceBomLinesRequest,
  SearchBomsRequest,
  SearchItemModelsRequest,
  SearchItemsRequest,
  SetItemCapabilitiesRequest,
  SetItemModelAttributeRulesRequest,
  SetItemModelCapabilitiesRequest,
  SetItemModelPrimaryCategoryRequest,
  UpdateAttributeDefinitionRequest,
  UpdateAttributeOptionRequest,
  UpdateBomBasicsRequest,
  UpdateItemBasicsRequest,
  UpdateItemCategoryBasicsRequest,
  UpdateItemModelBasicsRequest,
  UpdatePackagingMethodRequest,
  UpdatePackagingSpecRequest,
  UpsertSupplierItemMappingRequest
} from '@oes/common/generated/item_master_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { ItemMasterManagementGrpcAdapter } from './adapters/item-master-management-grpc.adapter'
import { ItemMasterQueryGrpcAdapter } from './adapters/item-master-query-grpc.adapter'

type CapabilityKey =
  | 'sellable'
  | 'purchasable'
  | 'stockable'
  | 'manufacturable'
  | 'assemblable'
  | 'transformable'
  | 'packable'
  | 'packaged'
type StatusValue = 'ACTIVE' | 'INACTIVE'
type BffBomLineInput = {
  componentItemId?: string
  lineRole?: string
  lineNote?: string
  quantity?: string
  uomCode?: string
}
type BffAttributeRuleInput = {
  attributeDefinitionId?: string
  allowedOptionIds?: string[]
  required?: boolean
}
type BffPackagingSpecInput = {
  customerId?: string
  effectiveFrom?: string
  effectiveTo?: string
  grossWeight?: string
  itemModelId?: string
  outerHeight?: string
  outerLength?: string
  outerWidth?: string
  packagingMethodId?: string
  specCode?: string
  specName?: string
  version?: string
  volume?: string
  workInstruction?: string
}

@Injectable()
// Builds the tenant-scoped item-management BFF model on top of item-master Contract V2.
export class ItemManagementService {
  constructor(
    private readonly itemQueryAdapter: ItemMasterQueryGrpcAdapter,
    private readonly itemManagementAdapter: ItemMasterManagementGrpcAdapter
  ) {}

  async listItemModels(
    tenantId: string,
    query: {
      capabilities?: string[]
      categoryId?: string
      includeDescendants?: boolean
      keyword?: string
      modelKind?: string
      modelType?: string
      page?: number
      pageSize?: number
      status?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemQueryAdapter.searchItemModels(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        keyword: normalize(query.keyword),
        modelKind: toGrpcItemModelKind(query.modelKind),
        modelType: toGrpcItemModelType(query.modelType),
        capabilityFilters: toCapabilityFilters(query.capabilities),
        active: toActiveFilter(query.status),
        categoryId: normalize(query.categoryId),
        includeDescendants: normalize(query.categoryId) ? Boolean(query.includeDescendants) : undefined,
        page: page(query.page),
        pageSize: pageSize(query.pageSize)
      } satisfies SearchItemModelsRequest,
      source
    )

    return {
      itemModels: (result.itemModels ?? []).map((itemModel) => mapItemModel(itemModel)),
      total: result.total ?? 0,
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 20
    }
  }

  async getItemModel(tenantId: string, itemModelId: string, source: DownstreamRequestSource) {
    const result = await this.itemQueryAdapter.getItemModel(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemModelId: requireNonBlank(itemModelId, 'itemModelId')
      },
      source
    )

    return mapGetItemModel(result)
  }

  async createItemModel(
    tenantId: string,
    input: {
      capabilities?: ItemCapabilities
      modelCode: string
      modelKind: string
      modelName: string
      modelType: string
      primaryCategoryId?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.createItemModel(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        modelCode: requireNonBlank(input.modelCode, 'modelCode'),
        modelName: requireNonBlank(input.modelName, 'modelName'),
        modelKind: requireGrpcItemModelKind(input.modelKind),
        modelType: requireGrpcItemModelType(input.modelType),
        capabilities: normalizeCapabilities(input.capabilities),
        primaryCategoryId: normalize(input.primaryCategoryId)
      } satisfies CreateItemModelRequest,
      source
    )

    return {
      itemModelId: result.itemModelId ?? '',
      itemModel: mapItemModel(result.itemModel)
    }
  }

  async updateItemModelBasics(
    tenantId: string,
    itemModelId: string,
    input: { modelCode: string; modelName: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.updateItemModelBasics(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemModelId: requireNonBlank(itemModelId, 'itemModelId'),
        modelCode: requireNonBlank(input.modelCode, 'modelCode'),
        modelName: requireNonBlank(input.modelName, 'modelName')
      } satisfies UpdateItemModelBasicsRequest,
      source
    )

    return mapItemModel(result.itemModel)
  }

  async setItemModelCapabilities(
    tenantId: string,
    itemModelId: string,
    input: { capabilities: ItemCapabilities },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.setItemModelCapabilities(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemModelId: requireNonBlank(itemModelId, 'itemModelId'),
        capabilities: normalizeCapabilities(input.capabilities)
      } satisfies SetItemModelCapabilitiesRequest,
      source
    )

    return mapItemModel(result.itemModel)
  }

  async changeItemModelStatus(
    tenantId: string,
    itemModelId: string,
    input: { status: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.changeItemModelStatus(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemModelId: requireNonBlank(itemModelId, 'itemModelId'),
        active: requireActive(input.status)
      } satisfies ChangeItemModelStatusRequest,
      source
    )

    return mapItemModel(result.itemModel)
  }

  async setItemModelPrimaryCategory(
    tenantId: string,
    itemModelId: string,
    input: { primaryCategoryId?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.setItemModelPrimaryCategory(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemModelId: requireNonBlank(itemModelId, 'itemModelId'),
        primaryCategoryId: normalize(input.primaryCategoryId)
      } satisfies SetItemModelPrimaryCategoryRequest,
      source
    )

    return mapItemModel(result.itemModel)
  }

  async listItems(
    tenantId: string,
    query: {
      capabilities?: string[]
      categoryId?: string
      includeDescendants?: boolean
      itemModelId?: string
      itemType?: string
      keyword?: string
      packagingSpecId?: string
      page?: number
      pageSize?: number
      status?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemQueryAdapter.searchItems(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        keyword: normalize(query.keyword),
        itemModelId: normalize(query.itemModelId),
        itemType: toGrpcItemType(query.itemType),
        packagingSpecId: normalize(query.packagingSpecId),
        capabilityFilters: toCapabilityFilters(query.capabilities),
        active: toActiveFilter(query.status),
        categoryId: normalize(query.categoryId),
        includeDescendants: normalize(query.categoryId) ? Boolean(query.includeDescendants) : undefined,
        page: page(query.page),
        pageSize: pageSize(query.pageSize)
      } satisfies SearchItemsRequest,
      source
    )

    return {
      items: (result.items ?? []).map((item) => mapItem(item)),
      total: result.total ?? 0,
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 20
    }
  }

  async getItem(tenantId: string, itemId: string, source: DownstreamRequestSource) {
    const result = await this.itemQueryAdapter.getItem(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemId: requireNonBlank(itemId, 'itemId')
      },
      source
    )

    return mapGetItem(result)
  }

  async createItem(
    tenantId: string,
    input: {
      capabilities?: ItemCapabilities
      itemCode: string
      itemModelId: string
      itemName: string
      itemType: string
      lockedAttributeOptionIds?: string[]
      packagingSpecId?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.createItem(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemModelId: requireNonBlank(input.itemModelId, 'itemModelId'),
        itemCode: requireNonBlank(input.itemCode, 'itemCode'),
        itemName: requireNonBlank(input.itemName, 'itemName'),
        itemType: requireGrpcItemType(input.itemType),
        lockedAttributeOptionIds: input.lockedAttributeOptionIds ?? [],
        packagingSpecId: normalize(input.packagingSpecId),
        capabilities: normalizeCapabilities(input.capabilities)
      } satisfies CreateItemRequest,
      source
    )

    return {
      itemId: result.itemId ?? '',
      item: mapItem(result.item)
    }
  }

  async updateItemBasics(
    tenantId: string,
    itemId: string,
    input: { itemCode: string; itemName: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.updateItemBasics(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemId: requireNonBlank(itemId, 'itemId'),
        itemCode: requireNonBlank(input.itemCode, 'itemCode'),
        itemName: requireNonBlank(input.itemName, 'itemName')
      } satisfies UpdateItemBasicsRequest,
      source
    )

    return mapGetItem(result as GetItemResponse)
  }

  async setItemCapabilities(
    tenantId: string,
    itemId: string,
    input: { capabilities: ItemCapabilities },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.setItemCapabilities(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemId: requireNonBlank(itemId, 'itemId'),
        capabilities: normalizeCapabilities(input.capabilities)
      } satisfies SetItemCapabilitiesRequest,
      source
    )

    return mapGetItem(result as GetItemResponse)
  }

  async changeItemStatus(
    tenantId: string,
    itemId: string,
    input: { status: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.changeItemStatus(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemId: requireNonBlank(itemId, 'itemId'),
        active: requireActive(input.status)
      } satisfies ChangeItemStatusRequest,
      source
    )

    return mapGetItem(result as GetItemResponse)
  }

  async listAttributeDefinitions(
    tenantId: string,
    query: { keyword?: string; page?: number; pageSize?: number; status?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemQueryAdapter.listAttributeDefinitions(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        keyword: normalize(query.keyword),
        active: toActiveFilter(query.status),
        page: page(query.page),
        pageSize: pageSize(query.pageSize)
      },
      source
    )

    return mapAttributeDefinitions(result)
  }

  async listAttributeOptions(
    tenantId: string,
    attributeDefinitionId: string,
    query: { status?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemQueryAdapter.listAttributeOptions(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        attributeDefinitionId: requireNonBlank(attributeDefinitionId, 'attributeDefinitionId'),
        active: toActiveFilter(query.status)
      },
      source
    )

    return mapAttributeOptions(result)
  }

  async getItemModelAttributeRules(tenantId: string, itemModelId: string, source: DownstreamRequestSource) {
    const result = await this.itemQueryAdapter.getItemModelAttributeRules(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemModelId: requireNonBlank(itemModelId, 'itemModelId')
      },
      source
    )

    return mapItemModelAttributeRules(result)
  }

  async createAttributeDefinition(
    tenantId: string,
    input: { attributeCode: string; attributeName: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.createAttributeDefinition(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        attributeCode: requireNonBlank(input.attributeCode, 'attributeCode'),
        attributeName: requireNonBlank(input.attributeName, 'attributeName')
      } satisfies CreateAttributeDefinitionRequest,
      source
    )

    return mapAttributeDefinition(result.attributeDefinition)
  }

  async updateAttributeDefinition(
    tenantId: string,
    attributeDefinitionId: string,
    input: { attributeCode: string; attributeName: string; status: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.updateAttributeDefinition(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        attributeDefinitionId: requireNonBlank(attributeDefinitionId, 'attributeDefinitionId'),
        attributeCode: requireNonBlank(input.attributeCode, 'attributeCode'),
        attributeName: requireNonBlank(input.attributeName, 'attributeName'),
        active: requireActive(input.status)
      } satisfies UpdateAttributeDefinitionRequest,
      source
    )

    return mapAttributeDefinition(result.attributeDefinition)
  }

  async createAttributeOption(
    tenantId: string,
    attributeDefinitionId: string,
    input: { optionCode: string; optionName: string; description?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.createAttributeOption(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        attributeDefinitionId: requireNonBlank(attributeDefinitionId, 'attributeDefinitionId'),
        optionCode: requireNonBlank(input.optionCode, 'optionCode'),
        optionName: requireNonBlank(input.optionName, 'optionName'),
        description: input.description?.trim() ?? ''
      } satisfies CreateAttributeOptionRequest,
      source
    )

    return mapAttributeOption(result.attributeOption)
  }

  async updateAttributeOption(
    tenantId: string,
    attributeOptionId: string,
    input: { optionCode: string; optionName: string; description?: string; status: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.updateAttributeOption(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        attributeOptionId: requireNonBlank(attributeOptionId, 'attributeOptionId'),
        optionCode: requireNonBlank(input.optionCode, 'optionCode'),
        optionName: requireNonBlank(input.optionName, 'optionName'),
        active: requireActive(input.status),
        description: input.description?.trim() ?? ''
      } satisfies UpdateAttributeOptionRequest,
      source
    )

    return mapAttributeOption(result.attributeOption)
  }

  async setItemModelAttributeRules(
    tenantId: string,
    itemModelId: string,
    input: { rules: BffAttributeRuleInput[] },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.setItemModelAttributeRules(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemModelId: requireNonBlank(itemModelId, 'itemModelId'),
        rules: (input.rules ?? []).map((rule) => ({
          itemModelId,
          attributeDefinitionId: requireNonBlank(rule.attributeDefinitionId ?? '', 'attributeDefinitionId'),
          required: Boolean(rule.required),
          allowedOptionIds: rule.allowedOptionIds ?? []
        }))
      } satisfies SetItemModelAttributeRulesRequest,
      source
    )

    return mapItemModelAttributeRules(result)
  }

  async listItemCategories(tenantId: string, query: { parentCategoryId?: string }, source: DownstreamRequestSource) {
    const result = await this.itemQueryAdapter.listItemCategories(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        parentCategoryId: normalize(query.parentCategoryId)
      },
      source
    )

    return {
      categories: (result.categories ?? []).map((category) => mapCategoryTreeNode(category))
    }
  }

  async createItemCategory(
    tenantId: string,
    input: { categoryCode: string; categoryName: string; parentCategoryId?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.createItemCategory(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        categoryCode: requireNonBlank(input.categoryCode, 'categoryCode'),
        categoryName: requireNonBlank(input.categoryName, 'categoryName'),
        parentCategoryId: normalize(input.parentCategoryId)
      } satisfies CreateItemCategoryRequest,
      source
    )

    return mapCategoryTreeNode(result.category)
  }

  async updateItemCategoryBasics(
    tenantId: string,
    categoryId: string,
    input: { categoryCode: string; categoryName: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.updateItemCategoryBasics(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        categoryId: requireNonBlank(categoryId, 'categoryId'),
        categoryCode: requireNonBlank(input.categoryCode, 'categoryCode'),
        categoryName: requireNonBlank(input.categoryName, 'categoryName')
      } satisfies UpdateItemCategoryBasicsRequest,
      source
    )

    return mapCategoryTreeNode(result.category)
  }

  async moveItemCategory(
    tenantId: string,
    categoryId: string,
    input: { parentCategoryId?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.moveItemCategory(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        categoryId: requireNonBlank(categoryId, 'categoryId'),
        parentCategoryId: normalize(input.parentCategoryId)
      } satisfies MoveItemCategoryRequest,
      source
    )

    return mapCategoryTreeNode(result.category)
  }

  async changeItemCategoryStatus(
    tenantId: string,
    categoryId: string,
    input: { status: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.changeItemCategoryStatus(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        categoryId: requireNonBlank(categoryId, 'categoryId'),
        active: requireActive(input.status)
      } satisfies ChangeItemCategoryStatusRequest,
      source
    )

    return mapCategoryTreeNode(result.category)
  }

  async deleteItemCategory(tenantId: string, categoryId: string, source: DownstreamRequestSource) {
    await this.itemManagementAdapter.deleteItemCategory(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        categoryId: requireNonBlank(categoryId, 'categoryId')
      } satisfies DeleteItemCategoryRequest,
      source
    )

    return {}
  }

  async listPackagingMethods(
    tenantId: string,
    query: { keyword?: string; status?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemQueryAdapter.listPackagingMethods(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        keyword: normalize(query.keyword),
        active: toActiveFilter(query.status)
      },
      source
    )

    return mapPackagingMethods(result)
  }

  async createPackagingMethod(
    tenantId: string,
    input: { description?: string; methodCode: string; methodName: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.createPackagingMethod(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        methodCode: requireNonBlank(input.methodCode, 'methodCode'),
        methodName: requireNonBlank(input.methodName, 'methodName'),
        description: normalize(input.description) ?? ''
      } satisfies CreatePackagingMethodRequest,
      source
    )

    return mapPackagingMethod(result.packagingMethod)
  }

  async updatePackagingMethod(
    tenantId: string,
    packagingMethodId: string,
    input: { description?: string; methodCode: string; methodName: string },
    source: DownstreamRequestSource
  ) {
    const command: UpdatePackagingMethodRequest = {
      tenantId: this.resolveTenantId(tenantId, source),
      packagingMethodId: requireNonBlank(packagingMethodId, 'packagingMethodId'),
      methodCode: requireNonBlank(input.methodCode, 'methodCode'),
      methodName: requireNonBlank(input.methodName, 'methodName')
    }
    if (Object.prototype.hasOwnProperty.call(input, 'description')) {
      command.description = normalize(input.description) ?? ''
    }
    const result = await this.itemManagementAdapter.updatePackagingMethod(command, source)

    return mapPackagingMethod(result.packagingMethod)
  }

  async changePackagingMethodStatus(
    tenantId: string,
    packagingMethodId: string,
    input: { status: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.changePackagingMethodStatus(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        packagingMethodId: requireNonBlank(packagingMethodId, 'packagingMethodId'),
        active: requireActive(input.status)
      } satisfies ChangePackagingMethodStatusRequest,
      source
    )

    return mapPackagingMethod(result.packagingMethod)
  }

  async deletePackagingMethod(tenantId: string, packagingMethodId: string, source: DownstreamRequestSource) {
    await this.itemManagementAdapter.deletePackagingMethod(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        packagingMethodId: requireNonBlank(packagingMethodId, 'packagingMethodId')
      } satisfies DeletePackagingMethodRequest,
      source
    )

    return {}
  }

  async getPackagingSpec(tenantId: string, packagingSpecId: string, source: DownstreamRequestSource) {
    const result = await this.itemQueryAdapter.getPackagingSpec(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        packagingSpecId: requireNonBlank(packagingSpecId, 'packagingSpecId')
      },
      source
    )

    return mapGetPackagingSpec(result)
  }

  async searchPackagingSpecs(
    tenantId: string,
    query: {
      customerId?: string
      itemModelId?: string
      keyword?: string
      packagingMethodId?: string
      page?: number
      pageSize?: number
      status?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemQueryAdapter.searchPackagingSpecs(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        keyword: normalize(query.keyword),
        itemModelId: normalize(query.itemModelId),
        packagingMethodId: normalize(query.packagingMethodId),
        customerId: normalize(query.customerId),
        active: toActiveFilter(query.status),
        page: page(query.page),
        pageSize: pageSize(query.pageSize)
      } satisfies SearchPackagingSpecsRequest,
      source
    )

    return mapPackagingSpecs(result)
  }

  async createPackagingSpec(tenantId: string, input: BffPackagingSpecInput, source: DownstreamRequestSource) {
    const result = await this.itemManagementAdapter.createPackagingSpec(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        ...mapPackagingSpecInput(input)
      } satisfies CreatePackagingSpecRequest,
      source
    )

    return mapPackagingSpec(result.packagingSpec)
  }

  async updatePackagingSpec(
    tenantId: string,
    packagingSpecId: string,
    input: BffPackagingSpecInput,
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.updatePackagingSpec(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        packagingSpecId: requireNonBlank(packagingSpecId, 'packagingSpecId'),
        ...mapPackagingSpecInput(input)
      } satisfies UpdatePackagingSpecRequest,
      source
    )

    return mapPackagingSpec(result.packagingSpec)
  }

  async changePackagingSpecStatus(
    tenantId: string,
    packagingSpecId: string,
    input: { status: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.changePackagingSpecStatus(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        packagingSpecId: requireNonBlank(packagingSpecId, 'packagingSpecId'),
        active: requireActive(input.status)
      } satisfies ChangePackagingSpecStatusRequest,
      source
    )

    return mapPackagingSpec(result.packagingSpec)
  }

  async listBoms(
    tenantId: string,
    query: {
      bomType?: string
      componentItemId?: string
      keyword?: string
      outputItemId?: string
      page?: number
      pageSize?: number
      status?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemQueryAdapter.searchBoms(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        keyword: normalize(query.keyword),
        bomType: toGrpcBomType(query.bomType),
        outputItemId: normalize(query.outputItemId),
        componentItemId: normalize(query.componentItemId),
        active: toActiveFilter(query.status),
        page: page(query.page),
        pageSize: pageSize(query.pageSize)
      } satisfies SearchBomsRequest,
      source
    )

    return {
      boms: (result.boms ?? []).map((bom) => mapBom(bom)),
      total: result.total ?? 0,
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 20
    }
  }

  async getBom(tenantId: string, bomId: string, source: DownstreamRequestSource) {
    const result = await this.itemQueryAdapter.getBom(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        bomId: requireNonBlank(bomId, 'bomId')
      },
      source
    )

    return mapBom(result.bom)
  }

  async getBomByOutputItem(
    tenantId: string,
    outputItemId: string,
    query: { bomType?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemQueryAdapter.getBomByOutputItem(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        outputItemId: requireNonBlank(outputItemId, 'outputItemId'),
        bomType: toGrpcBomType(query.bomType)
      },
      source
    )

    return {
      resolutionStatus: result.resolutionStatus ?? 0,
      bom: result.bom ? mapBom(result.bom) : undefined
    }
  }

  async createBom(
    tenantId: string,
    input: { bomCode: string; bomName: string; bomType: string; outputItemId: string; lines: BffBomLineInput[] },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.createBom(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        bomCode: requireNonBlank(input.bomCode, 'bomCode'),
        bomName: requireNonBlank(input.bomName, 'bomName'),
        bomType: requireGrpcBomType(input.bomType),
        outputItemId: requireNonBlank(input.outputItemId, 'outputItemId'),
        lines: mapBomLineInputs(input.lines)
      } satisfies CreateBomRequest,
      source
    )

    return {
      bomId: result.bomId ?? '',
      bom: mapBom(result.bom)
    }
  }

  async updateBomBasics(
    tenantId: string,
    bomId: string,
    input: { bomCode: string; bomName: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.updateBomBasics(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        bomId: requireNonBlank(bomId, 'bomId'),
        bomCode: requireNonBlank(input.bomCode, 'bomCode'),
        bomName: requireNonBlank(input.bomName, 'bomName')
      } satisfies UpdateBomBasicsRequest,
      source
    )

    return mapBom(result.bom)
  }

  async replaceBomLines(
    tenantId: string,
    bomId: string,
    input: { lines: BffBomLineInput[] },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.replaceBomLines(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        bomId: requireNonBlank(bomId, 'bomId'),
        lines: mapBomLineInputs(input.lines)
      } satisfies ReplaceBomLinesRequest,
      source
    )

    return mapBom(result.bom)
  }

  async changeBomStatus(
    tenantId: string,
    bomId: string,
    input: { status: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.changeBomStatus(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        bomId: requireNonBlank(bomId, 'bomId'),
        active: requireActive(input.status)
      } satisfies ChangeBomStatusRequest,
      source
    )

    return mapBom(result.bom)
  }

  async listSupplierMappings(
    tenantId: string,
    itemId: string,
    query: { page?: number; pageSize?: number },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemQueryAdapter.listSupplierItemMappingsByItem(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemId: requireNonBlank(itemId, 'itemId'),
        page: page(query.page),
        pageSize: pageSize(query.pageSize)
      },
      source
    )

    return mapSupplierMappings(result)
  }

  async upsertSupplierMapping(
    tenantId: string,
    itemId: string,
    input: { active?: boolean; supplierId: string; supplierItemCode?: string; supplierItemName?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.upsertSupplierItemMapping(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        supplierId: requireNonBlank(input.supplierId, 'supplierId'),
        supplierItemCode: normalize(input.supplierItemCode),
        supplierItemName: normalize(input.supplierItemName),
        itemId: requireNonBlank(itemId, 'itemId'),
        active: input.active
      } satisfies UpsertSupplierItemMappingRequest,
      source
    )

    const mapping = result.mapping
    return {
      supplierItemMappingId: mapping?.supplierItemMappingId ?? '',
      supplierId: mapping?.supplierId ?? '',
      supplierItemCode: mapping?.supplierItemCode ?? '',
      supplierItemName: mapping?.supplierItemName ?? '',
      itemId: mapping?.itemId ?? '',
      itemCode: mapping?.itemSummary?.itemCode ?? '',
      itemName: mapping?.itemSummary?.itemName ?? '',
      active: Boolean(mapping?.active)
    }
  }

  /** resolveTenantId keeps tenant-scoped item-management requests pinned to the operator tenant. */
  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

    if (source.user?.scopeLevel === 'SYSTEM') {
      return requestedTenantId
    }

    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException('Tenant administrators can only manage items in their current tenant')
    }

    return operatorTenantId
  }
}

/** mapGetItemModel flattens one item model get/update response into the BFF shape. */
function mapGetItemModel(result: GetItemModelResponse) {
  return mapItemModel(result.itemModel)
}

/** mapItemModel converts item-master model records into stable BFF strings. */
function mapItemModel(itemModel?: ItemModelRecord) {
  return {
    itemModelId: itemModel?.itemModelId ?? '',
    modelCode: itemModel?.modelCode ?? '',
    modelName: itemModel?.modelName ?? '',
    modelKind: fromGrpcItemModelKind(itemModel?.modelKind),
    modelType: fromGrpcItemModelType(itemModel?.modelType),
    status: fromActive(itemModel?.active),
    capabilities: normalizeCapabilities(itemModel?.capabilities),
    primaryCategorySummary: itemModel?.primaryCategorySummary
      ? mapCategorySummary(itemModel.primaryCategorySummary)
      : undefined,
    createdAt: itemModel?.createdAt ?? '',
    updatedAt: itemModel?.updatedAt ?? ''
  }
}

/** mapGetItem flattens one item-master get/update response into the BFF item shape. */
function mapGetItem(result: GetItemResponse) {
  return mapItem(result.item)
}

/** mapItem converts executable Item summaries into stable BFF strings. */
function mapItem(item?: ItemSummary) {
  return {
    itemId: item?.itemId ?? '',
    itemModelId: item?.itemModelId ?? '',
    itemCode: item?.itemCode ?? '',
    itemName: item?.itemName ?? '',
    itemType: fromGrpcItemType(item?.itemType),
    lockedAttributeOptionIds: item?.lockedAttributeOptionIds ?? [],
    packagingSpecId: item?.packagingSpecId ?? '',
    status: fromActive(item?.active),
    capabilities: normalizeCapabilities(item?.capabilities),
    itemModelSummary: item?.itemModelSummary
      ? {
          itemModelId: item.itemModelSummary.itemModelId ?? '',
          modelCode: item.itemModelSummary.modelCode ?? '',
          modelName: item.itemModelSummary.modelName ?? '',
          modelKind: fromGrpcItemModelKind(item.itemModelSummary.modelKind),
          modelType: fromGrpcItemModelType(item.itemModelSummary.modelType),
          status: fromActive(item.itemModelSummary.active)
        }
      : undefined,
    primaryCategorySummary: item?.primaryCategorySummary
      ? mapCategorySummary(item.primaryCategorySummary)
      : undefined,
    createdAt: item?.createdAt ?? '',
    updatedAt: item?.updatedAt ?? ''
  }
}

/** mapCategorySummary converts generated category summaries into the stable BFF summary shape. */
function mapCategorySummary(category?: ItemCategorySummary) {
  return {
    categoryId: category?.categoryId ?? '',
    categoryCode: category?.categoryCode ?? '',
    categoryName: category?.categoryName ?? '',
    status: fromActive(category?.active)
  }
}

/** mapCategoryTreeNode converts one generated category tree row into the BFF list shape. */
function mapCategoryTreeNode(category?: ItemCategoryTreeNode) {
  return {
    categoryId: category?.categoryId ?? '',
    categoryCode: category?.categoryCode ?? '',
    categoryName: category?.categoryName ?? '',
    parentCategoryId: category?.parentCategoryId ?? '',
    status: fromActive(category?.active),
    hasChildren: Boolean(category?.hasChildren)
  }
}

/** mapAttributeDefinitions converts generated attribute definition pages into BFF pages. */
function mapAttributeDefinitions(result: ListAttributeDefinitionsResponse) {
  return {
    attributeDefinitions: (result.attributeDefinitions ?? []).map(mapAttributeDefinition),
    total: result.total ?? 0,
    page: result.page ?? 1,
    pageSize: result.pageSize ?? 20
  }
}

/** mapAttributeDefinition converts one generated attribute definition into the BFF shape. */
function mapAttributeDefinition(record?: AttributeDefinitionRecord) {
  return {
    attributeDefinitionId: record?.attributeDefinitionId ?? '',
    attributeCode: record?.attributeCode ?? '',
    attributeName: record?.attributeName ?? '',
    optionCount: record?.optionCount ?? 0,
    status: fromActive(record?.active)
  }
}

/** mapAttributeOptions converts generated attribute options into the BFF list shape. */
function mapAttributeOptions(result: ListAttributeOptionsResponse) {
  return {
    attributeOptions: (result.attributeOptions ?? []).map(mapAttributeOption)
  }
}

/** mapAttributeOption converts one generated attribute option into the BFF shape. */
function mapAttributeOption(record?: AttributeOptionRecord) {
  return {
    attributeOptionId: record?.attributeOptionId ?? '',
    attributeDefinitionId: record?.attributeDefinitionId ?? '',
    optionCode: record?.optionCode ?? '',
    optionName: record?.optionName ?? '',
    description: record?.description ?? '',
    status: fromActive(record?.active)
  }
}

/** mapItemModelAttributeRules converts generated model attribute rules into the BFF shape. */
function mapItemModelAttributeRules(result: GetItemModelAttributeRulesResponse | { rules?: ItemModelAttributeRuleRecord[] }) {
  return {
    rules: (result.rules ?? []).map((rule) => ({
      itemModelId: rule.itemModelId ?? '',
      attributeDefinitionId: rule.attributeDefinitionId ?? '',
      required: Boolean(rule.required),
      allowedOptionIds: rule.allowedOptionIds ?? []
    }))
  }
}

/** mapPackagingMethods converts generated packaging method lists into the BFF shape. */
function mapPackagingMethods(result: ListPackagingMethodsResponse) {
  return {
    packagingMethods: (result.packagingMethods ?? []).map(mapPackagingMethod)
  }
}

/** mapPackagingMethod converts one generated packaging method into the BFF shape. */
function mapPackagingMethod(record?: {
  active?: boolean
  description?: string
  methodCode?: string
  methodName?: string
  packagingMethodId?: string
}) {
  return {
    packagingMethodId: record?.packagingMethodId ?? '',
    methodCode: record?.methodCode ?? '',
    methodName: record?.methodName ?? '',
    description: record?.description ?? '',
    status: fromActive(record?.active)
  }
}

/** mapGetPackagingSpec flattens one packaging spec get response into the BFF shape. */
function mapGetPackagingSpec(result: GetPackagingSpecResponse) {
  return mapPackagingSpec(result.packagingSpec)
}

/** mapPackagingSpecs converts generated packaging spec pages into BFF pages. */
function mapPackagingSpecs(result: SearchPackagingSpecsResponse) {
  return {
    packagingSpecs: (result.packagingSpecs ?? []).map(mapPackagingSpec),
    total: result.total ?? 0,
    page: result.page ?? 1,
    pageSize: result.pageSize ?? 20
  }
}

/** mapPackagingSpec converts one generated packaging spec into the BFF shape. */
function mapPackagingSpec(record?: {
  active?: boolean
  customerId?: string
  effectiveFrom?: string
  effectiveTo?: string
  grossWeight?: string
  itemModelId?: string
  outerHeight?: string
  outerLength?: string
  outerWidth?: string
  packagingMethodId?: string
  packagingSpecId?: string
  specCode?: string
  specName?: string
  version?: string
  volume?: string
  workInstruction?: string
}) {
  return {
    packagingSpecId: record?.packagingSpecId ?? '',
    itemModelId: record?.itemModelId ?? '',
    packagingMethodId: record?.packagingMethodId ?? '',
    customerId: record?.customerId ?? '',
    specCode: record?.specCode ?? '',
    specName: record?.specName ?? '',
    grossWeight: record?.grossWeight ?? '',
    volume: record?.volume ?? '',
    outerLength: record?.outerLength ?? '',
    outerWidth: record?.outerWidth ?? '',
    outerHeight: record?.outerHeight ?? '',
    workInstruction: record?.workInstruction ?? '',
    version: record?.version ?? '',
    effectiveFrom: record?.effectiveFrom ?? '',
    effectiveTo: record?.effectiveTo ?? '',
    status: fromActive(record?.active)
  }
}

/** mapBom converts generated BOM records into the BFF BOM shape. */
function mapBom(bom?: BomRecord) {
  return {
    bomId: bom?.bomId ?? '',
    bomCode: bom?.bomCode ?? '',
    bomName: bom?.bomName ?? '',
    bomType: fromGrpcBomType(bom?.bomType),
    outputItemId: bom?.outputItemId ?? '',
    status: fromActive(bom?.active),
    lines: (bom?.lines ?? []).map((line) => ({
      bomLineId: line.bomLineId ?? '',
      componentItemId: line.componentItemId ?? '',
      lineRole: fromGrpcBomLineRole(line.lineRole),
      quantity: line.quantity ?? '',
      uomCode: line.uomCode ?? '',
      lineNote: line.lineNote ?? '',
      componentItem: line.componentItem ? mapItem(line.componentItem) : undefined
    })),
    createdAt: bom?.createdAt ?? '',
    updatedAt: bom?.updatedAt ?? ''
  }
}

/** mapPackagingSpecInput validates and converts BFF packaging spec payloads into generated request fields. */
function mapPackagingSpecInput(input: BffPackagingSpecInput) {
  return {
    itemModelId: requireNonBlank(input.itemModelId ?? '', 'itemModelId'),
    packagingMethodId: requireNonBlank(input.packagingMethodId ?? '', 'packagingMethodId'),
    customerId: normalize(input.customerId),
    specCode: requireNonBlank(input.specCode ?? '', 'specCode'),
    specName: requireNonBlank(input.specName ?? '', 'specName'),
    grossWeight: normalize(input.grossWeight),
    volume: normalize(input.volume),
    outerLength: normalize(input.outerLength),
    outerWidth: normalize(input.outerWidth),
    outerHeight: normalize(input.outerHeight),
    workInstruction: normalize(input.workInstruction),
    version: normalize(input.version),
    effectiveFrom: normalize(input.effectiveFrom),
    effectiveTo: normalize(input.effectiveTo)
  }
}

/** mapSupplierMappings converts supplier mapping list responses into the detail section paging shape. */
function mapSupplierMappings(result: ListSupplierItemMappingsByItemResponse) {
  return {
    mappings: (result.mappings ?? []).map((mapping) => ({
      supplierItemMappingId: mapping.supplierItemMappingId ?? '',
      supplierId: mapping.supplierId ?? '',
      supplierItemCode: mapping.supplierItemCode ?? '',
      supplierItemName: mapping.supplierItemName ?? '',
      itemId: mapping.itemId ?? '',
      itemCode: mapping.itemSummary?.itemCode ?? '',
      itemName: mapping.itemSummary?.itemName ?? '',
      active: Boolean(mapping.active)
    })),
    total: result.total ?? 0,
    page: result.page ?? 1,
    pageSize: result.pageSize ?? 20
  }
}

/** toCapabilityFilters maps UI capability selections into the generated full filter message. */
function toCapabilityFilters(capabilities?: string[]): ItemCapabilityFilters | undefined {
  const selected = new Set((capabilities ?? []).map((capability) => capability.trim()).filter(Boolean))
  if (selected.size === 0) {
    return undefined
  }

  return {
    sellable: selected.has('sellable') ? true : undefined,
    purchasable: selected.has('purchasable') ? true : undefined,
    stockable: selected.has('stockable') ? true : undefined,
    manufacturable: selected.has('manufacturable') ? true : undefined,
    assemblable: selected.has('assemblable') ? true : undefined,
    transformable: selected.has('transformable') ? true : undefined,
    packable: selected.has('packable') ? true : undefined,
    packaged: selected.has('packaged') ? true : undefined
  }
}

/** normalizeCapabilities guarantees all eight V2 capabilities are present in BFF output and commands. */
function normalizeCapabilities(capabilities?: ItemCapabilities): Required<ItemCapabilities> {
  return {
    sellable: Boolean(capabilities?.sellable),
    purchasable: Boolean(capabilities?.purchasable),
    stockable: Boolean(capabilities?.stockable),
    manufacturable: Boolean(capabilities?.manufacturable),
    assemblable: Boolean(capabilities?.assemblable),
    transformable: Boolean(capabilities?.transformable),
    packable: Boolean(capabilities?.packable),
    packaged: Boolean(capabilities?.packaged)
  }
}

/** mapBomLineInputs validates and converts BOM line payloads into generated gRPC input messages. */
function mapBomLineInputs(lines?: BffBomLineInput[]): BomLineInput[] {
  return (lines ?? []).map((line) => ({
    componentItemId: requireNonBlank(line.componentItemId ?? '', 'componentItemId'),
    lineRole: requireGrpcBomLineRole(`${line.lineRole ?? ''}`),
    quantity: requireNonBlank(line.quantity ?? '', 'quantity'),
    uomCode: requireNonBlank(line.uomCode ?? '', 'uomCode'),
    lineNote: normalize(line.lineNote)
  }))
}

/** toGrpcItemModelKind converts optional model kind filters into generated enums. */
function toGrpcItemModelKind(value?: string): ItemModelKind | undefined {
  return value ? requireGrpcItemModelKind(value) : undefined
}

/** requireGrpcItemModelKind converts required model kind values into generated enums. */
function requireGrpcItemModelKind(value?: string): ItemModelKind {
  switch (value) {
    case 'PHYSICAL':
      return ItemModelKind.ITEM_MODEL_KIND_PHYSICAL
    case 'SERVICE':
      return ItemModelKind.ITEM_MODEL_KIND_SERVICE
    case 'DIGITAL':
      return ItemModelKind.ITEM_MODEL_KIND_DIGITAL
    case 'VIRTUAL':
      return ItemModelKind.ITEM_MODEL_KIND_VIRTUAL
    default:
      throw new NotFoundException('modelKind is required')
  }
}

/** fromGrpcItemModelKind converts generated model kind enums back into stable BFF strings. */
function fromGrpcItemModelKind(value?: ItemModelKind) {
  switch (value) {
    case ItemModelKind.ITEM_MODEL_KIND_SERVICE:
      return 'SERVICE'
    case ItemModelKind.ITEM_MODEL_KIND_DIGITAL:
      return 'DIGITAL'
    case ItemModelKind.ITEM_MODEL_KIND_VIRTUAL:
      return 'VIRTUAL'
    default:
      return 'PHYSICAL'
  }
}

/** toGrpcItemModelType converts optional model type filters into generated enums. */
function toGrpcItemModelType(value?: string): ItemModelType | undefined {
  return value ? requireGrpcItemModelType(value) : undefined
}

/** requireGrpcItemModelType converts required model type values into generated enums. */
function requireGrpcItemModelType(value?: string): ItemModelType {
  switch (value) {
    case 'FINISHED_PRODUCT':
      return ItemModelType.ITEM_MODEL_TYPE_FINISHED_PRODUCT
    case 'SEMI_FINISHED_PRODUCT':
      return ItemModelType.ITEM_MODEL_TYPE_SEMI_FINISHED_PRODUCT
    case 'ACCESSORY':
      return ItemModelType.ITEM_MODEL_TYPE_ACCESSORY
    case 'PART':
      return ItemModelType.ITEM_MODEL_TYPE_PART
    case 'SUB_ASSEMBLY':
      return ItemModelType.ITEM_MODEL_TYPE_SUB_ASSEMBLY
    case 'RAW_MATERIAL':
      return ItemModelType.ITEM_MODEL_TYPE_RAW_MATERIAL
    case 'PACKAGING_MATERIAL':
      return ItemModelType.ITEM_MODEL_TYPE_PACKAGING_MATERIAL
    case 'SERVICE':
      return ItemModelType.ITEM_MODEL_TYPE_SERVICE
    case 'VIRTUAL_KIT':
      return ItemModelType.ITEM_MODEL_TYPE_VIRTUAL_KIT
    default:
      throw new NotFoundException('modelType is required')
  }
}

/** fromGrpcItemModelType converts generated model type enums back into stable BFF strings. */
function fromGrpcItemModelType(value?: ItemModelType) {
  switch (value) {
    case ItemModelType.ITEM_MODEL_TYPE_SEMI_FINISHED_PRODUCT:
      return 'SEMI_FINISHED_PRODUCT'
    case ItemModelType.ITEM_MODEL_TYPE_ACCESSORY:
      return 'ACCESSORY'
    case ItemModelType.ITEM_MODEL_TYPE_PART:
      return 'PART'
    case ItemModelType.ITEM_MODEL_TYPE_SUB_ASSEMBLY:
      return 'SUB_ASSEMBLY'
    case ItemModelType.ITEM_MODEL_TYPE_RAW_MATERIAL:
      return 'RAW_MATERIAL'
    case ItemModelType.ITEM_MODEL_TYPE_PACKAGING_MATERIAL:
      return 'PACKAGING_MATERIAL'
    case ItemModelType.ITEM_MODEL_TYPE_SERVICE:
      return 'SERVICE'
    case ItemModelType.ITEM_MODEL_TYPE_VIRTUAL_KIT:
      return 'VIRTUAL_KIT'
    default:
      return 'FINISHED_PRODUCT'
  }
}

/** toGrpcItemType converts optional item type filters into generated enums. */
function toGrpcItemType(value?: string): ItemType | undefined {
  return value ? requireGrpcItemType(value) : undefined
}

/** requireGrpcItemType converts required item type values into generated enums. */
function requireGrpcItemType(value?: string): ItemType {
  switch (value) {
    case 'STANDARD':
      return ItemType.ITEM_TYPE_STANDARD
    case 'PACKAGED_FINISHED_GOOD':
      return ItemType.ITEM_TYPE_PACKAGED_FINISHED_GOOD
    default:
      throw new NotFoundException('itemType is required')
  }
}

/** fromGrpcItemType converts generated item type enums back into stable BFF strings. */
function fromGrpcItemType(value?: ItemType) {
  return value === ItemType.ITEM_TYPE_PACKAGED_FINISHED_GOOD ? 'PACKAGED_FINISHED_GOOD' : 'STANDARD'
}

/** toGrpcBomType converts optional BOM type filters into generated enums. */
function toGrpcBomType(value?: string): BomType | undefined {
  return value ? requireGrpcBomType(value) : undefined
}

/** requireGrpcBomType converts required BOM type values into generated enums. */
function requireGrpcBomType(value?: string): BomType {
  switch (value) {
    case 'COMPOSITION':
      return BomType.BOM_TYPE_COMPOSITION
    case 'TRANSFORMATION':
      return BomType.BOM_TYPE_TRANSFORMATION
    case 'PACKAGING':
      return BomType.BOM_TYPE_PACKAGING
    default:
      throw new NotFoundException('bomType is required')
  }
}

/** fromGrpcBomType converts generated BOM type enums back into stable BFF strings. */
function fromGrpcBomType(value?: BomType) {
  switch (value) {
    case BomType.BOM_TYPE_TRANSFORMATION:
      return 'TRANSFORMATION'
    case BomType.BOM_TYPE_PACKAGING:
      return 'PACKAGING'
    default:
      return 'COMPOSITION'
  }
}

/** requireGrpcBomLineRole converts required BOM line role values into generated enums. */
function requireGrpcBomLineRole(value?: string): BomLineRole {
  switch (value) {
    case 'PRIMARY_INPUT':
      return BomLineRole.BOM_LINE_ROLE_PRIMARY_INPUT
    case 'COMPONENT':
      return BomLineRole.BOM_LINE_ROLE_COMPONENT
    case 'PACKAGING_MATERIAL':
      return BomLineRole.BOM_LINE_ROLE_PACKAGING_MATERIAL
    default:
      throw new NotFoundException('lineRole is required')
  }
}

/** fromGrpcBomLineRole converts generated BOM line role enums back into stable BFF strings. */
function fromGrpcBomLineRole(value?: BomLineRole) {
  switch (value) {
    case BomLineRole.BOM_LINE_ROLE_PRIMARY_INPUT:
      return 'PRIMARY_INPUT'
    case BomLineRole.BOM_LINE_ROLE_PACKAGING_MATERIAL:
      return 'PACKAGING_MATERIAL'
    default:
      return 'COMPONENT'
  }
}

/** requireActive converts required BFF lifecycle values into Contract V2 active booleans. */
function requireActive(value?: string): boolean {
  switch (value) {
    case 'ACTIVE':
      return true
    case 'INACTIVE':
      return false
    default:
      throw new NotFoundException('status is required')
  }
}

/** toActiveFilter converts optional BFF lifecycle filters into Contract V2 active filters. */
function toActiveFilter(value?: string): boolean | undefined {
  return value ? requireActive(value) : undefined
}

/** fromActive converts Contract V2 active booleans into BFF lifecycle strings. */
function fromActive(active?: boolean): StatusValue {
  return active === false ? 'INACTIVE' : 'ACTIVE'
}

/** page normalizes 1-based page inputs. */
function page(value?: number): number {
  return Math.max(value ?? 1, 1)
}

/** pageSize clamps page size inputs to the API Gateway limit. */
function pageSize(value?: number): number {
  return Math.min(Math.max(value ?? 20, 1), 100)
}

/** normalize trims optional strings and collapses blanks to undefined. */
function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

/** requireNonBlank trims one required string input and rejects blank values. */
function requireNonBlank(value: string, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new NotFoundException(`${fieldName} is required`)
  }
  return normalized
}
