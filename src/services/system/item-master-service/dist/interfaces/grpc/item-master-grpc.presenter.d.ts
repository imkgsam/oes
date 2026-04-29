import { ChangeItemCategoryStatusResponse, ChangeItemStatusResponse, CreateItemCategoryResponse, CreateItemResponse, GetItemCompositionResponse, GetItemResponse, ItemCategoryStatus as ProtoItemCategoryStatus, ItemCategorySummary, ListItemCategoriesResponse, ListSupplierItemMappingsByItemResponse, ItemSummary, ResolveSupplierItemMappingResponse, SetItemCapabilitiesResponse, SetItemCompositionResponse, SetItemPrimaryCategoryResponse, SupplierItemMappingRecord, UpdateItemCategoryBasicsResponse, UpdateItemBasicsResponse, UpsertSupplierItemMappingResponse } from '@oes/common/generated/item_master_service';
import { Item } from '../../domain/aggregates/item.aggregate';
import { ItemCategory } from '../../domain/aggregates/item-category.aggregate';
import { ItemCategoryReference, ItemCategoryTreeNode } from '../../domain/value-objects/item-category.value-objects';
import { ResolveSupplierItemMappingResult } from '../../application/queries/supplier-item-resolution.view';
import { GetItemCompositionResult } from '../../application/queries/get-item-composition.handler';
import { ListItemCategoriesResult } from '../../application/queries/list-item-categories.handler';
import { SetItemCompositionResult } from '../../application/commands/set-item-composition.handler';
import { ListSupplierItemMappingsByItemResult, SupplierItemMapping } from '../../domain/repositories/supplier-item-mapping.repository';
/** ItemMasterGrpcPresenter maps domain and query models into the frozen phase 1 gRPC response shapes. */
export declare class ItemMasterGrpcPresenter {
    /** toItemSummary renders one domain item aggregate as the phase 1 ItemSummary response. */
    static toItemSummary(item: Item): ItemSummary;
    /** toItemCategorySummary renders the shared minimal category summary shape. */
    static toItemCategorySummary(category: ItemCategory | ItemCategoryReference): ItemCategorySummary;
    /** toGetItemResponse renders one GetItem success payload. */
    static toGetItemResponse(item: Item): GetItemResponse;
    /** toCreateItemResponse renders one CreateItem success payload. */
    static toCreateItemResponse(item: Item): CreateItemResponse;
    /** toUpdateItemBasicsResponse renders one UpdateItemBasics success payload. */
    static toUpdateItemBasicsResponse(item: Item): UpdateItemBasicsResponse;
    /** toSetItemCapabilitiesResponse renders one SetItemCapabilities success payload. */
    static toSetItemCapabilitiesResponse(item: Item): SetItemCapabilitiesResponse;
    /** toChangeItemStatusResponse renders one ChangeItemStatus success payload. */
    static toChangeItemStatusResponse(item: Item): ChangeItemStatusResponse;
    /** toCreateItemCategoryResponse renders one CreateItemCategory success payload. */
    static toCreateItemCategoryResponse(category: ItemCategory): CreateItemCategoryResponse;
    /** toUpdateItemCategoryBasicsResponse renders one UpdateItemCategoryBasics success payload. */
    static toUpdateItemCategoryBasicsResponse(category: ItemCategory): UpdateItemCategoryBasicsResponse;
    /** toChangeItemCategoryStatusResponse renders one ChangeItemCategoryStatus success payload. */
    static toChangeItemCategoryStatusResponse(category: ItemCategory): ChangeItemCategoryStatusResponse;
    /** toSetItemPrimaryCategoryResponse renders one primary-category assignment payload. */
    static toSetItemPrimaryCategoryResponse(item: Item): SetItemPrimaryCategoryResponse;
    /** toListItemCategoriesResponse renders one category-tree layer without escalating empty levels to errors. */
    static toListItemCategoriesResponse(result: ListItemCategoriesResult): ListItemCategoriesResponse;
    /** toGetItemCompositionResponse renders one bundle composition read payload. */
    static toGetItemCompositionResponse(result: GetItemCompositionResult): GetItemCompositionResponse;
    /** toSetItemCompositionResponse renders one bundle composition replacement payload. */
    static toSetItemCompositionResponse(result: SetItemCompositionResult): SetItemCompositionResponse;
    /** toListSupplierItemMappingsByItemResponse renders one mapping page with the frozen phase 1 list fields only. */
    static toListSupplierItemMappingsByItemResponse(result: ListSupplierItemMappingsByItemResult): ListSupplierItemMappingsByItemResponse;
    /** toUpsertSupplierItemMappingResponse renders one management mapping payload with optional item summary fields. */
    static toUpsertSupplierItemMappingResponse(mapping: SupplierItemMapping, item?: Item): UpsertSupplierItemMappingResponse;
    /** toResolveSupplierItemMappingResponse renders one MATCHED or NO_MATCH query payload without abusing NOT_FOUND. */
    static toResolveSupplierItemMappingResponse(result: ResolveSupplierItemMappingResult): ResolveSupplierItemMappingResponse;
    /** toSupplierItemMappingRecord renders one supplier mapping with optional item summary data. */
    static toSupplierItemMappingRecord(mapping: SupplierItemMapping, item?: Item): SupplierItemMappingRecord;
    /** toItemCategoryTreeNode renders one lightweight tree node with direct-child metadata. */
    static toItemCategoryTreeNode(category: ItemCategoryTreeNode): {
        categoryId: string;
        categoryCode: string;
        categoryName: string;
        parentCategoryId: string;
        status: ProtoItemCategoryStatus;
        hasChildren: boolean;
    };
}
