import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import {
  ChangeItemStatusRequest,
  ChangeItemCategoryStatusRequest,
  CreateItemCategoryRequest,
  CreateItemRequest,
  GetItemCompositionResponse,
  GetItemResponse,
  ItemCategoryStatus,
  ItemCategorySummary,
  ItemCategoryTreeNode,
  ItemCapabilities,
  ItemCapabilityFilters,
  ItemNatureType,
  ItemStatus,
  ItemStructureType,
  ListItemCategoriesResponse,
  ListSupplierItemMappingsByItemResponse,
  SearchItemsRequest,
  SearchItemsResponse,
  SetItemPrimaryCategoryRequest,
  SetItemCapabilitiesRequest,
  SetItemCompositionRequest,
  UpdateItemCategoryBasicsRequest,
  UpdateItemBasicsRequest,
  UpsertSupplierItemMappingRequest
} from '@oes/common/generated/item_master_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { ItemMasterManagementGrpcAdapter } from './adapters/item-master-management-grpc.adapter'
import { ItemMasterQueryGrpcAdapter } from './adapters/item-master-query-grpc.adapter'

type ItemCapabilityKey = 'manufacturable' | 'purchasable' | 'sellable' | 'stockable'
type ItemNatureValue = 'PHYSICAL' | 'SERVICE' | 'VIRTUAL'
type ItemCategoryStatusValue = 'ACTIVE' | 'INACTIVE'
type ItemStatusValue = 'ACTIVE' | 'INACTIVE'
type ItemStructureValue = 'BUNDLE' | 'SINGLE'

type ItemManagementCategorySummary = {
  categoryId: string
  categoryCode: string
  categoryName: string
  status: ItemCategoryStatusValue
}

type ItemManagementCategoryNode = ItemManagementCategorySummary & {
  parentCategoryId: string
  hasChildren: boolean
}

type ItemManagementItem = {
  itemId: string
  itemCode: string
  itemName: string
  structureType: ItemStructureValue
  natureType: ItemNatureValue
  status: ItemStatusValue
  capabilities: Required<ItemCapabilities>
  primaryCategorySummary?: ItemManagementCategorySummary
}

@Injectable()
// Builds the tenant-scoped phase 1 item-management BFF model without widening item-master ownership boundaries.
export class ItemManagementService {
  constructor(
    private readonly itemQueryAdapter: ItemMasterQueryGrpcAdapter,
    private readonly itemManagementAdapter: ItemMasterManagementGrpcAdapter
  ) {}

  async listItems(
    tenantId: string,
    query: {
      capability?: string
      categoryId?: string
      includeDescendants?: boolean
      keyword?: string
      natureType?: string
      page?: number
      pageSize?: number
      status?: string
      structureType?: string
    },
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const result = await this.itemQueryAdapter.searchItems(
      {
        tenantId: resolvedTenantId,
        keyword: normalize(query.keyword),
        structureType: toGrpcStructureType(query.structureType),
        natureType: toGrpcNatureType(query.natureType),
        capabilityFilters: toCapabilityFilters(query.capability),
        status: toGrpcStatus(query.status),
        categoryId: normalize(query.categoryId),
        includeDescendants: normalize(query.categoryId) ? Boolean(query.includeDescendants) : undefined,
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100)
      } satisfies SearchItemsRequest,
      source
    )

    return {
      items: (result.items ?? []).map((item) => mapItemSummary(item)),
      total: result.total ?? 0,
      page: result.page ?? 1,
      pageSize: result.pageSize ?? 20
    }
  }

  async listItemCategories(
    tenantId: string,
    query: { parentCategoryId?: string },
    source: DownstreamRequestSource
  ) {
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
      itemCode: string
      itemName: string
      structureType: string
      natureType: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.createItem(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemCode: requireNonBlank(input.itemCode, 'itemCode'),
        itemName: requireNonBlank(input.itemName, 'itemName'),
        structureType: requireGrpcStructureType(input.structureType),
        natureType: requireGrpcNatureType(input.natureType)
      } satisfies CreateItemRequest,
      source
    )

    return {
      itemId: result.itemId ?? '',
      item: result.item ? mapItemSummary(result.item) : undefined
    }
  }

  async updateItemBasics(
    tenantId: string,
    itemId: string,
    input: {
      itemCode: string
      itemName: string
    },
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
    input: {
      capabilities: Required<ItemCapabilities>
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.setItemCapabilities(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemId: requireNonBlank(itemId, 'itemId'),
        capabilities: {
          sellable: Boolean(input.capabilities.sellable),
          purchasable: Boolean(input.capabilities.purchasable),
          stockable: Boolean(input.capabilities.stockable),
          manufacturable: Boolean(input.capabilities.manufacturable)
        }
      } satisfies SetItemCapabilitiesRequest,
      source
    )

    return mapGetItem(result as GetItemResponse)
  }

  async getItemComposition(
    tenantId: string,
    itemId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.itemQueryAdapter.getItemComposition(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemId: requireNonBlank(itemId, 'itemId')
      },
      source
    )

    return mapComposition(result)
  }

  async setItemComposition(
    tenantId: string,
    itemId: string,
    input: {
      components: Array<{ componentItemId: string }>
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.setItemComposition(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemId: requireNonBlank(itemId, 'itemId'),
        components: (input.components ?? []).map((component) => ({
          componentItemId: requireNonBlank(component.componentItemId, 'componentItemId')
        }))
      } satisfies SetItemCompositionRequest,
      source
    )

    return mapComposition(result)
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
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100)
      },
      source
    )

    return mapSupplierMappings(result)
  }

  async upsertSupplierMapping(
    tenantId: string,
    itemId: string,
    input: {
      supplierId: string
      supplierItemCode?: string
      supplierItemName?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.upsertSupplierItemMapping(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        supplierId: requireNonBlank(input.supplierId, 'supplierId'),
        supplierItemCode: normalize(input.supplierItemCode),
        supplierItemName: normalize(input.supplierItemName),
        itemId: requireNonBlank(itemId, 'itemId')
      } satisfies UpsertSupplierItemMappingRequest,
      source
    )

    return {
      supplierId: result.mapping?.supplierId ?? '',
      supplierItemCode: result.mapping?.supplierItemCode ?? '',
      supplierItemName: result.mapping?.supplierItemName ?? '',
      itemId: result.mapping?.itemId ?? '',
      itemCode: result.mapping?.itemCode ?? '',
      itemName: result.mapping?.itemName ?? ''
    }
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
        targetStatus: requireGrpcStatus(input.status)
      } satisfies ChangeItemStatusRequest,
      source
    )

    return mapGetItem(result as GetItemResponse)
  }

  async createItemCategory(
    tenantId: string,
    input: {
      categoryCode: string
      categoryName: string
      parentCategoryId?: string
    },
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

    return mapCategorySummary(result.category)
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

    return mapCategorySummary(result.category)
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
        targetStatus: requireGrpcCategoryStatus(input.status)
      } satisfies ChangeItemCategoryStatusRequest,
      source
    )

    return mapCategorySummary(result.category)
  }

  async setItemPrimaryCategory(
    tenantId: string,
    itemId: string,
    input: { primaryCategoryId?: string },
    source: DownstreamRequestSource
  ) {
    const result = await this.itemManagementAdapter.setItemPrimaryCategory(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        itemId: requireNonBlank(itemId, 'itemId'),
        categoryId: normalize(input.primaryCategoryId)
      } satisfies SetItemPrimaryCategoryRequest,
      source
    )

    return mapGetItem(result as GetItemResponse)
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

/** mapGetItem flattens one item-master get/update response into the tenant-web item detail shape. */
function mapGetItem(result: GetItemResponse): ItemManagementItem {
  return mapItemSummary(result.item)
}

/** mapItemSummary converts the generated item-master summary into stable string enums for the BFF. */
function mapItemSummary(item?: GetItemResponse['item']): ItemManagementItem {
  return {
    itemId: item?.itemId ?? '',
    itemCode: item?.itemCode ?? '',
    itemName: item?.itemName ?? '',
    structureType: fromGrpcStructureType(item?.structureType),
    natureType: fromGrpcNatureType(item?.natureType),
    status: fromGrpcStatus(item?.status),
    capabilities: {
      sellable: Boolean(item?.capabilities?.sellable),
      purchasable: Boolean(item?.capabilities?.purchasable),
      stockable: Boolean(item?.capabilities?.stockable),
      manufacturable: Boolean(item?.capabilities?.manufacturable)
    },
    primaryCategorySummary: item?.primaryCategorySummary
      ? mapCategorySummary(item.primaryCategorySummary)
      : undefined
  }
}

/** mapCategorySummary converts the generated category summary into the stable BFF summary shape. */
function mapCategorySummary(category?: ItemCategorySummary): ItemManagementCategorySummary {
  return {
    categoryId: category?.categoryId ?? '',
    categoryCode: category?.categoryCode ?? '',
    categoryName: category?.categoryName ?? '',
    status: fromGrpcCategoryStatus(category?.status)
  }
}

/** mapCategoryTreeNode converts one generated category tree row into the BFF list shape. */
function mapCategoryTreeNode(category?: ItemCategoryTreeNode): ItemManagementCategoryNode {
  return {
    ...mapCategorySummary(category),
    parentCategoryId: category?.parentCategoryId ?? '',
    hasChildren: Boolean(category?.hasChildren)
  }
}

/** mapComposition converts the generated item-master composition response into the phase 1 bundle section shape. */
function mapComposition(result: GetItemCompositionResponse) {
  return {
    itemId: result.itemId ?? '',
    components: (result.components ?? []).map((component) => ({
      componentItemId: component.componentItemId ?? '',
      componentItemCode: component.componentItemCode ?? '',
      componentItemName: component.componentItemName ?? ''
    }))
  }
}

/** mapSupplierMappings converts the generated supplier mapping list into the detail section paging shape. */
function mapSupplierMappings(result: ListSupplierItemMappingsByItemResponse) {
  return {
    mappings: (result.mappings ?? []).map((mapping) => ({
      supplierId: mapping.supplierId ?? '',
      supplierItemCode: mapping.supplierItemCode ?? '',
      supplierItemName: mapping.supplierItemName ?? '',
      itemId: mapping.itemId ?? ''
    })),
    total: result.total ?? 0,
    page: result.page ?? 1,
    pageSize: result.pageSize ?? 20
  }
}

/** toCapabilityFilters maps the single UI capability filter into the generated full filter message. */
function toCapabilityFilters(capability?: string): ItemCapabilityFilters | undefined {
  switch (capability) {
    case 'sellable':
      return { sellable: true }
    case 'purchasable':
      return { purchasable: true }
    case 'stockable':
      return { stockable: true }
    case 'manufacturable':
      return { manufacturable: true }
    default:
      return undefined
  }
}

/** toGrpcStructureType converts an optional BFF filter enum into the generated structure enum. */
function toGrpcStructureType(value?: string): ItemStructureType | undefined {
  if (!value) {
    return undefined
  }
  return requireGrpcStructureType(value)
}

/** requireGrpcStructureType converts one required structure enum and rejects unsupported values. */
function requireGrpcStructureType(value?: string): ItemStructureType {
  switch (value) {
    case 'BUNDLE':
      return ItemStructureType.ITEM_STRUCTURE_TYPE_BUNDLE
    case 'SINGLE':
      return ItemStructureType.ITEM_STRUCTURE_TYPE_SINGLE
    default:
      throw new NotFoundException('structureType is required')
  }
}

/** fromGrpcStructureType converts generated structure enums back into stable BFF strings. */
function fromGrpcStructureType(value?: ItemStructureType): ItemStructureValue {
  return value === ItemStructureType.ITEM_STRUCTURE_TYPE_BUNDLE ? 'BUNDLE' : 'SINGLE'
}

/** toGrpcNatureType converts an optional BFF filter enum into the generated nature enum. */
function toGrpcNatureType(value?: string): ItemNatureType | undefined {
  if (!value) {
    return undefined
  }
  return requireGrpcNatureType(value)
}

/** requireGrpcNatureType converts one required nature enum and rejects unsupported values. */
function requireGrpcNatureType(value?: string): ItemNatureType {
  switch (value) {
    case 'PHYSICAL':
      return ItemNatureType.ITEM_NATURE_TYPE_PHYSICAL
    case 'SERVICE':
      return ItemNatureType.ITEM_NATURE_TYPE_SERVICE
    case 'VIRTUAL':
      return ItemNatureType.ITEM_NATURE_TYPE_VIRTUAL
    default:
      throw new NotFoundException('natureType is required')
  }
}

/** fromGrpcNatureType converts generated nature enums back into stable BFF strings. */
function fromGrpcNatureType(value?: ItemNatureType): ItemNatureValue {
  switch (value) {
    case ItemNatureType.ITEM_NATURE_TYPE_SERVICE:
      return 'SERVICE'
    case ItemNatureType.ITEM_NATURE_TYPE_VIRTUAL:
      return 'VIRTUAL'
    default:
      return 'PHYSICAL'
  }
}

/** toGrpcStatus converts an optional BFF status filter into the generated lifecycle enum. */
function toGrpcStatus(value?: string): ItemStatus | undefined {
  if (!value) {
    return undefined
  }
  return requireGrpcStatus(value)
}

/** requireGrpcStatus converts one required lifecycle enum and rejects unsupported values. */
function requireGrpcStatus(value?: string): ItemStatus {
  switch (value) {
    case 'ACTIVE':
      return ItemStatus.ITEM_STATUS_ACTIVE
    case 'INACTIVE':
      return ItemStatus.ITEM_STATUS_INACTIVE
    default:
      throw new NotFoundException('status is required')
  }
}

/** fromGrpcStatus converts generated lifecycle enums back into stable BFF strings. */
function fromGrpcStatus(value?: ItemStatus): ItemStatusValue {
  return value === ItemStatus.ITEM_STATUS_INACTIVE ? 'INACTIVE' : 'ACTIVE'
}

/** requireGrpcCategoryStatus converts one required category lifecycle enum and rejects unsupported values. */
function requireGrpcCategoryStatus(value?: string): ItemCategoryStatus {
  switch (value) {
    case 'ACTIVE':
      return ItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE
    case 'INACTIVE':
      return ItemCategoryStatus.ITEM_CATEGORY_STATUS_INACTIVE
    default:
      throw new NotFoundException('status is required')
  }
}

/** fromGrpcCategoryStatus converts generated category lifecycle enums back into stable BFF strings. */
function fromGrpcCategoryStatus(value?: ItemCategoryStatus): ItemCategoryStatusValue {
  return value === ItemCategoryStatus.ITEM_CATEGORY_STATUS_INACTIVE ? 'INACTIVE' : 'ACTIVE'
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
