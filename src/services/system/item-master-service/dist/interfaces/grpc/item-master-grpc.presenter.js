"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemMasterGrpcPresenter = void 0;
const item_master_service_1 = require("@oes/common/generated/item_master_service");
const item_value_objects_1 = require("../../domain/value-objects/item.value-objects");
const item_category_value_objects_1 = require("../../domain/value-objects/item-category.value-objects");
const supplier_item_resolution_view_1 = require("../../application/queries/supplier-item-resolution.view");
/** ItemMasterGrpcPresenter maps domain and query models into the frozen phase 1 gRPC response shapes. */
class ItemMasterGrpcPresenter {
    /** toItemSummary renders one domain item aggregate as the phase 1 ItemSummary response. */
    static toItemSummary(item) {
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
        };
    }
    /** toItemCategorySummary renders the shared minimal category summary shape. */
    static toItemCategorySummary(category) {
        return {
            categoryId: 'toReference' in category ? category.id : category.categoryId,
            categoryCode: 'toReference' in category ? category.categoryCode : category.categoryCode,
            categoryName: 'toReference' in category ? category.categoryName : category.categoryName,
            status: toProtoCategoryStatus('toReference' in category ? category.status : category.status)
        };
    }
    /** toGetItemResponse renders one GetItem success payload. */
    static toGetItemResponse(item) {
        return {
            item: this.toItemSummary(item)
        };
    }
    /** toCreateItemResponse renders one CreateItem success payload. */
    static toCreateItemResponse(item) {
        return {
            itemId: item.id,
            item: this.toItemSummary(item)
        };
    }
    /** toUpdateItemBasicsResponse renders one UpdateItemBasics success payload. */
    static toUpdateItemBasicsResponse(item) {
        return {
            item: this.toItemSummary(item)
        };
    }
    /** toSetItemCapabilitiesResponse renders one SetItemCapabilities success payload. */
    static toSetItemCapabilitiesResponse(item) {
        return {
            item: this.toItemSummary(item)
        };
    }
    /** toChangeItemStatusResponse renders one ChangeItemStatus success payload. */
    static toChangeItemStatusResponse(item) {
        return {
            item: this.toItemSummary(item)
        };
    }
    /** toCreateItemCategoryResponse renders one CreateItemCategory success payload. */
    static toCreateItemCategoryResponse(category) {
        return {
            category: this.toItemCategorySummary(category)
        };
    }
    /** toUpdateItemCategoryBasicsResponse renders one UpdateItemCategoryBasics success payload. */
    static toUpdateItemCategoryBasicsResponse(category) {
        return {
            category: this.toItemCategorySummary(category)
        };
    }
    /** toChangeItemCategoryStatusResponse renders one ChangeItemCategoryStatus success payload. */
    static toChangeItemCategoryStatusResponse(category) {
        return {
            category: this.toItemCategorySummary(category)
        };
    }
    /** toSetItemPrimaryCategoryResponse renders one primary-category assignment payload. */
    static toSetItemPrimaryCategoryResponse(item) {
        return {
            item: this.toItemSummary(item)
        };
    }
    /** toListItemCategoriesResponse renders one category-tree layer without escalating empty levels to errors. */
    static toListItemCategoriesResponse(result) {
        return {
            categories: result.categories.map((category) => this.toItemCategoryTreeNode(category))
        };
    }
    /** toGetItemCompositionResponse renders one bundle composition read payload. */
    static toGetItemCompositionResponse(result) {
        return {
            itemId: result.itemId,
            components: result.components.map((component) => ({
                componentItemId: component.id,
                componentItemCode: component.itemCode,
                componentItemName: component.itemName
            }))
        };
    }
    /** toSetItemCompositionResponse renders one bundle composition replacement payload. */
    static toSetItemCompositionResponse(result) {
        return {
            itemId: result.itemId,
            components: result.components.map((component) => ({
                componentItemId: component.id,
                componentItemCode: component.itemCode,
                componentItemName: component.itemName
            }))
        };
    }
    /** toListSupplierItemMappingsByItemResponse renders one mapping page with the frozen phase 1 list fields only. */
    static toListSupplierItemMappingsByItemResponse(result) {
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
        };
    }
    /** toUpsertSupplierItemMappingResponse renders one management mapping payload with optional item summary fields. */
    static toUpsertSupplierItemMappingResponse(mapping, item) {
        return {
            mapping: this.toSupplierItemMappingRecord(mapping, item)
        };
    }
    /** toResolveSupplierItemMappingResponse renders one MATCHED or NO_MATCH query payload without abusing NOT_FOUND. */
    static toResolveSupplierItemMappingResponse(result) {
        return {
            resolutionStatus: result.resolutionStatus === supplier_item_resolution_view_1.SupplierItemResolutionView.MATCHED
                ? item_master_service_1.SupplierItemResolutionStatus.SUPPLIER_ITEM_RESOLUTION_STATUS_MATCHED
                : item_master_service_1.SupplierItemResolutionStatus.SUPPLIER_ITEM_RESOLUTION_STATUS_NO_MATCH,
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
        };
    }
    /** toSupplierItemMappingRecord renders one supplier mapping with optional item summary data. */
    static toSupplierItemMappingRecord(mapping, item) {
        return {
            supplierId: mapping.supplierId,
            supplierItemCode: mapping.supplierItemCode ?? '',
            supplierItemName: mapping.supplierItemName ?? '',
            itemId: mapping.itemId,
            itemCode: item?.itemCode ?? '',
            itemName: item?.itemName ?? ''
        };
    }
    /** toItemCategoryTreeNode renders one lightweight tree node with direct-child metadata. */
    static toItemCategoryTreeNode(category) {
        return {
            categoryId: category.categoryId,
            categoryCode: category.categoryCode,
            categoryName: category.categoryName,
            parentCategoryId: category.parentCategoryId ?? '',
            status: toProtoCategoryStatus(category.status),
            hasChildren: category.hasChildren
        };
    }
}
exports.ItemMasterGrpcPresenter = ItemMasterGrpcPresenter;
/** toProtoStructureType maps the domain structure enum into the generated gRPC enum. */
function toProtoStructureType(value) {
    return value === item_value_objects_1.ItemStructureType.BUNDLE
        ? item_master_service_1.ItemStructureType.ITEM_STRUCTURE_TYPE_BUNDLE
        : item_master_service_1.ItemStructureType.ITEM_STRUCTURE_TYPE_SINGLE;
}
/** toProtoNatureType maps the domain nature enum into the generated gRPC enum. */
function toProtoNatureType(value) {
    switch (value) {
        case item_value_objects_1.ItemNatureType.VIRTUAL:
            return item_master_service_1.ItemNatureType.ITEM_NATURE_TYPE_VIRTUAL;
        case item_value_objects_1.ItemNatureType.SERVICE:
            return item_master_service_1.ItemNatureType.ITEM_NATURE_TYPE_SERVICE;
        default:
            return item_master_service_1.ItemNatureType.ITEM_NATURE_TYPE_PHYSICAL;
    }
}
/** toProtoStatus maps the minimal domain lifecycle enum into the generated gRPC enum. */
function toProtoStatus(value) {
    return value === item_value_objects_1.ItemStatus.INACTIVE
        ? item_master_service_1.ItemStatus.ITEM_STATUS_INACTIVE
        : item_master_service_1.ItemStatus.ITEM_STATUS_ACTIVE;
}
/** toProtoCategoryStatus maps the minimal category lifecycle enum into the generated gRPC enum. */
function toProtoCategoryStatus(value) {
    return value === item_category_value_objects_1.ItemCategoryStatus.INACTIVE
        ? item_master_service_1.ItemCategoryStatus.ITEM_CATEGORY_STATUS_INACTIVE
        : item_master_service_1.ItemCategoryStatus.ITEM_CATEGORY_STATUS_ACTIVE;
}
/** toProtoCapabilities flattens the capability value object into the generated message shape. */
function toProtoCapabilities(value) {
    return value.toPrimitives();
}
//# sourceMappingURL=item-master-grpc.presenter.js.map