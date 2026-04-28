import { ValidatingQueryBus } from '@oes/common/cqrs';
import { BatchGetItemsRequest, BatchGetItemsResponse, GetItemCompositionRequest, GetItemCompositionResponse, GetItemRequest, GetItemResponse, ItemMasterQueryServiceController, ListSupplierItemMappingsByItemRequest, ListSupplierItemMappingsByItemResponse, ResolveSupplierItemMappingRequest, ResolveSupplierItemMappingResponse, SearchItemsRequest, SearchItemsResponse } from '@oes/common/generated/item_master_service';
/** ItemMasterQueryGrpcController exposes the phase 1 read-only item-master gRPC contract. */
export declare class ItemMasterQueryGrpcController implements ItemMasterQueryServiceController {
    private readonly queryBus;
    constructor(queryBus: ValidatingQueryBus);
    getItem(request: GetItemRequest): Promise<GetItemResponse>;
    batchGetItems(request: BatchGetItemsRequest): Promise<BatchGetItemsResponse>;
    searchItems(request: SearchItemsRequest): Promise<SearchItemsResponse>;
    getItemComposition(request: GetItemCompositionRequest): Promise<GetItemCompositionResponse>;
    listSupplierItemMappingsByItem(request: ListSupplierItemMappingsByItemRequest): Promise<ListSupplierItemMappingsByItemResponse>;
    resolveSupplierItemMapping(request: ResolveSupplierItemMappingRequest): Promise<ResolveSupplierItemMappingResponse>;
}
