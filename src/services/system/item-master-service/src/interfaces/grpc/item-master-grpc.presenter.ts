import {
  ChangeItemCategoryStatusResponse,
  ChangeItemStatusResponse,
  CreateItemCategoryResponse,
  CreateItemResponse,
  GetItemCompositionResponse,
  GetItemResponse,
  ItemCategoryStatus as ProtoItemCategoryStatus,
  ItemCategorySummary,
  ListItemCategoriesResponse,
  ItemCapabilities as ProtoItemCapabilities,
  ListSupplierItemMappingsByItemResponse,
  ItemNatureType as ProtoItemNatureType,
  ItemStatus as ProtoItemStatus,
  ItemStructureType as ProtoItemStructureType,
  ItemSummary,
  ResolveSupplierItemMappingResponse,
  SetItemCapabilitiesResponse,
  SetItemCompositionResponse,
  SetItemPrimaryCategoryResponse,
  SupplierItemMappingRecord,
  SupplierItemResolutionStatus,
  UpdateItemCategoryBasicsResponse,
  UpdateItemBasicsResponse,
  UpsertSupplierItemMappingResponse
} from '@oes/common/generated/item_master_service'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ItemCategory } from '../../domain/aggregates/item-category.aggregate'
import { ItemCapabilities, ItemNatureType, ItemStatus, ItemStructureType } from '../../domain/value-objects/item.value-objects'
import {
  ItemCategoryReference,
  ItemCategoryStatus,
  ItemCategoryTreeNode
} from '../../domain/value-objects/item-category.value-objects'
import {
  ResolveSupplierItemMappingResult,
  SupplierItemResolutionView
} from '../../application/queries/supplier-item-resolution.view'
import { GetItemCompositionResult } from '../../application/queries/get-item-composition.handler'
import { ListItemCategoriesResult } from '../../application/queries/list-item-categories.handler'
import { SetItemCompositionResult } from '../../application/commands/set-item-composition.handler'
import {
  ListSupplierItemMappingsByItemResult,
  SupplierItemMapping
} from '../../domain/repositories/supplier-item-mapping.repository'

/** ItemMasterGrpcPresenter maps domain and query models into the frozen phase 1 gRPC response shapes. */
export class ItemMasterGrpcPresenter {
  /** toItemSummary renders one domain item aggregate as the phase 1 ItemSummary response. */
  static toItemSummary(item: Item): ItemSummary {
    return {
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      structureType: toProtoStructureType(item.structureType),
      natureType: toProtoNatureType(item.natureType),
      status: toProtoStatus(item.status),
      capabilities: toProtoCapabilities(item.capabilities),
      primaryCategorySummary: item.primaryCategory
        ? this.toItemCategorySummary(item.primaryCategory)
        : undefined
    }
  }

  /** toItemCategorySummary renders the shared minimal category summary shape. */
  static toItemCategorySummary(category: ItemCategory | ItemCategoryReference): ItemCategorySummary {
    return {
      categoryId: 'toReference' in category ? category.id : category.categoryId,
      categoryCode: 'toReference' in category ? category.categoryCode : category.categoryCode,
      categoryName: 'toReference' in category ? category.categoryName : category.categoryName,
      status: toProtoCategoryStatus('toReference' in category ? category.status : category.status)
    }
  }

  /** toGetItemResponse renders one GetItem success payload. */
  static toGetItemResponse(item: Item): GetItemResponse {
    return {
      item: this.toItemSummary(item)
    }
  }

  /** toCreateItemResponse renders one CreateItem success payload. */
  static toCreateItemResponse(item: Item): CreateItemResponse {
    return {
      itemId: item.id,
      item: this.toItemSummary(item)
    }
  }

  /** toUpdateItemBasicsResponse renders one UpdateItemBasics success payload. */
  static toUpdateItemBasicsResponse(item: Item): UpdateItemBasicsResponse {
    return {
      item: this.toItemSummary(item)
    }
  }

  /** toSetItemCapabilitiesResponse renders one SetItemCapabilities success payload. */
  static toSetItemCapabilitiesResponse(item: Item): SetItemCapabilitiesResponse {
    return {
      item: this.toItemSummary(item)
    }
  }

  /** toChangeItemStatusResponse renders one ChangeItemStatus success payload. */
  static toChangeItemStatusResponse(item: Item): ChangeItemStatusResponse {
    return {
      item: this.toItemSummary(item)
    }
  }

  /** toCreateItemCategoryResponse renders one CreateItemCategory success payload. */
  static toCreateItemCategoryResponse(category: ItemCategory): CreateItemCategoryResponse {
    return {
      category: this.toItemCategorySummary(category)
    }
  }

  /** toUpdateItemCategoryBasicsResponse renders one UpdateItemCategoryBasics success payload. */
  static toUpdateItemCategoryBasicsResponse(category: ItemCategory): UpdateItemCategoryBasicsResponse {
    return {
      category: this.toItemCategorySummary(category)
    }
  }

  /** toChangeItemCategoryStatusResponse renders one ChangeItemCategoryStatus success payload. */
  static toChangeItemCategoryStatusResponse(category: ItemCategory): ChangeItemCategoryStatusResponse {
    return {
      category: this.toItemCategorySummary(category)
    }
  }

  /** toSetItemPrimaryCategoryResponse renders one primary-category assignment payload. */
  static toSetItemPrimaryCategoryResponse(item: Item): SetItemPrimaryCategoryResponse {
    return {
      item: this.toItemSummary(item)
    }
  }

  /** toListItemCategoriesResponse renders one category-tree layer without escalating empty levels to errors. */
  static toListItemCategoriesResponse(result: ListItemCategoriesResult): ListItemCategoriesResponse {
    return {
      categories: result.categories.map((category) => this.toItemCategoryTreeNode(category))
    }
  }

  /** toGetItemCompositionResponse renders one bundle composition read payload. */
  static toGetItemCompositionResponse(result: GetItemCompositionResult): GetItemCompositionResponse {
    return {
      itemId: result.itemId,
      components: result.components.map((component) => ({
        componentItemId: component.id,
        componentItemCode: component.itemCode,
        componentItemName: component.itemName
      }))
    }
  }

  /** toSetItemCompositionResponse renders one bundle composition replacement payload. */
  static toSetItemCompositionResponse(result: SetItemCompositionResult): SetItemCompositionResponse {
    return {
      itemId: result.itemId,
      components: result.components.map((component) => ({
        componentItemId: component.id,
        componentItemCode: component.itemCode,
        componentItemName: component.itemName
      }))
    }
  }

  /** toListSupplierItemMappingsByItemResponse renders one mapping page with the frozen phase 1 list fields only. */
  static toListSupplierItemMappingsByItemResponse(
    result: ListSupplierItemMappingsByItemResult
  ): ListSupplierItemMappingsByItemResponse {
    return {
      mappings: result.mappings.map((mapping) => ({
        supplierId: mapping.supplierId,
        supplierItemCode: mapping.supplierItemCode ?? '',
        supplierItemName: mapping.supplierItemName ?? '',
        itemId: mapping.itemId
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /** toUpsertSupplierItemMappingResponse renders one management mapping payload with optional item summary fields. */
  static toUpsertSupplierItemMappingResponse(
    mapping: SupplierItemMapping,
    item?: Item
  ): UpsertSupplierItemMappingResponse {
    return {
      mapping: this.toSupplierItemMappingRecord(mapping, item)
    }
  }

  /** toResolveSupplierItemMappingResponse renders one MATCHED or NO_MATCH query payload without abusing NOT_FOUND. */
  static toResolveSupplierItemMappingResponse(
    result: ResolveSupplierItemMappingResult
  ): ResolveSupplierItemMappingResponse {
    return {
      resolutionStatus:
        result.resolutionStatus === SupplierItemResolutionView.MATCHED
          ? SupplierItemResolutionStatus.SUPPLIER_ITEM_RESOLUTION_STATUS_MATCHED
          : SupplierItemResolutionStatus.SUPPLIER_ITEM_RESOLUTION_STATUS_NO_MATCH,
      mapping: result.mapping
        ? {
            supplierId: result.mapping.supplierId,
            supplierItemCode: result.mapping.supplierItemCode ?? '',
            supplierItemName: result.mapping.supplierItemName ?? '',
            itemId: result.mapping.itemId,
            itemCode: result.mapping.itemCode,
            itemName: result.mapping.itemName
          }
        : undefined
    }
  }

  /** toSupplierItemMappingRecord renders one supplier mapping with optional item summary data. */
  static toSupplierItemMappingRecord(mapping: SupplierItemMapping, item?: Item): SupplierItemMappingRecord {
    return {
      supplierId: mapping.supplierId,
      supplierItemCode: mapping.supplierItemCode ?? '',
      supplierItemName: mapping.supplierItemName ?? '',
      itemId: mapping.itemId,
      itemCode: item?.itemCode ?? '',
      itemName: item?.itemName ?? ''
    }
  }

  /** toItemCategoryTreeNode renders one lightweight tree node with direct-child metadata. */
  static toItemCategoryTreeNode(category: ItemCategoryTreeNode) {
    return {
      categoryId: category.categoryId,
      categoryCode: category.categoryCode,
      categoryName: category.categoryName,
      parentCategoryId: category.parentCategoryId ?? '',
      status: toProtoCategoryStatus(category.status),
      hasChildren: category.hasChildren
    }
  }
}

/** toProtoStructureType maps the domain structure enum into the generated gRPC enum. */
function toProtoStructureType(value: ItemStructureType): ProtoItemStructureType {
  return value === ItemStructureType.BUNDLE
    ? ProtoItemStructureType.ITEM_STRUCTURE_TYPE_BUNDLE
    : ProtoItemStructureType.ITEM_STRUCTURE_TYPE_SINGLE
}

/** toProtoNatureType maps the domain nature enum into the generated gRPC enum. */
function toProtoNatureType(value: ItemNatureType): ProtoItemNatureType {
  switch (value) {
    case ItemNatureType.VIRTUAL:
      return ProtoItemNatureType.ITEM_NATURE_TYPE_VIRTUAL
    case ItemNatureType.SERVICE:
      return ProtoItemNatureType.ITEM_NATURE_TYPE_SERVICE
    default:
      return ProtoItemNatureType.ITEM_NATURE_TYPE_PHYSICAL
  }
}

/** toProtoStatus maps the minimal domain lifecycle enum into the generated gRPC enum. */
function toProtoStatus(value: ItemStatus): ProtoItemStatus {
  return value === ItemStatus.INACTIVE
    ? ProtoItemStatus.ITEM_STATUS_INACTIVE
    : ProtoItemStatus.ITEM_STATUS_ACTIVE
}

/** toProtoCategoryStatus maps the minimal category lifecycle enum into the generated gRPC enum. */
function toProtoCategoryStatus(value: ItemCategoryStatus): ProtoItemCategoryStatus {
  return value === ItemCategoryStatus.INACTIVE
    ? ProtoItemCategoryStatus.ITEM_CATEGORY_STATUS_INACTIVE
    : ProtoItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE
}

/** toProtoCapabilities flattens the capability value object into the generated message shape. */
function toProtoCapabilities(value: ItemCapabilities): ProtoItemCapabilities {
  return value.toPrimitives()
}
