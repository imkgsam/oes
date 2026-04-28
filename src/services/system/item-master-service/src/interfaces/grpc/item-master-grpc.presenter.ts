import {
  ChangeItemStatusResponse,
  CreateItemResponse,
  GetItemCompositionResponse,
  GetItemResponse,
  ItemCapabilities as ProtoItemCapabilities,
  ListSupplierItemMappingsByItemResponse,
  ItemNatureType as ProtoItemNatureType,
  ItemStatus as ProtoItemStatus,
  ItemStructureType as ProtoItemStructureType,
  ItemSummary,
  ResolveSupplierItemMappingResponse,
  SetItemCapabilitiesResponse,
  SetItemCompositionResponse,
  SupplierItemMappingRecord,
  SupplierItemResolutionStatus,
  UpdateItemBasicsResponse,
  UpsertSupplierItemMappingResponse
} from '@oes/common/generated/item_master_service'
import { Item } from '../../domain/aggregates/item.aggregate'
import { ItemCapabilities, ItemNatureType, ItemStatus, ItemStructureType } from '../../domain/value-objects/item.value-objects'
import {
  ResolveSupplierItemMappingResult,
  SupplierItemResolutionView
} from '../../application/queries/supplier-item-resolution.view'
import { GetItemCompositionResult } from '../../application/queries/get-item-composition.handler'
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
      capabilities: toProtoCapabilities(item.capabilities)
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

/** toProtoCapabilities flattens the capability value object into the generated message shape. */
function toProtoCapabilities(value: ItemCapabilities): ProtoItemCapabilities {
  return value.toPrimitives()
}
