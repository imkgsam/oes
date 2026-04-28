import { ChangeItemStatusResponse, CreateItemResponse, GetItemCompositionResponse, GetItemResponse, ListSupplierItemMappingsByItemResponse, ItemSummary, ResolveSupplierItemMappingResponse, SetItemCapabilitiesResponse, SetItemCompositionResponse, SupplierItemMappingRecord, UpdateItemBasicsResponse, UpsertSupplierItemMappingResponse } from '@oes/common/generated/item_master_service';
import { Item } from '../../domain/aggregates/item.aggregate';
import { ResolveSupplierItemMappingResult } from '../../application/queries/supplier-item-resolution.view';
import { GetItemCompositionResult } from '../../application/queries/get-item-composition.handler';
import { SetItemCompositionResult } from '../../application/commands/set-item-composition.handler';
import { ListSupplierItemMappingsByItemResult, SupplierItemMapping } from '../../domain/repositories/supplier-item-mapping.repository';
/** ItemMasterGrpcPresenter maps domain and query models into the frozen phase 1 gRPC response shapes. */
export declare class ItemMasterGrpcPresenter {
    /** toItemSummary renders one domain item aggregate as the phase 1 ItemSummary response. */
    static toItemSummary(item: Item): ItemSummary;
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
}
