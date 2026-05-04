import { Observable } from "rxjs";
export declare enum ItemStructureType {
    ITEM_STRUCTURE_TYPE_UNSPECIFIED = 0,
    ITEM_STRUCTURE_TYPE_SINGLE = 1,
    ITEM_STRUCTURE_TYPE_BUNDLE = 2
}
export declare enum ItemNatureType {
    ITEM_NATURE_TYPE_UNSPECIFIED = 0,
    ITEM_NATURE_TYPE_PHYSICAL = 1,
    ITEM_NATURE_TYPE_VIRTUAL = 2,
    ITEM_NATURE_TYPE_SERVICE = 3
}
export declare enum ItemStatus {
    ITEM_STATUS_UNSPECIFIED = 0,
    ITEM_STATUS_ACTIVE = 1,
    ITEM_STATUS_INACTIVE = 2
}
export declare enum ItemCategoryStatus {
    ITEM_CATEGORY_STATUS_UNSPECIFIED = 0,
    ITEM_CATEGORY_STATUS_ACTIVE = 1,
    ITEM_CATEGORY_STATUS_INACTIVE = 2
}
export declare enum SupplierItemResolutionStatus {
    SUPPLIER_ITEM_RESOLUTION_STATUS_UNSPECIFIED = 0,
    SUPPLIER_ITEM_RESOLUTION_STATUS_MATCHED = 1,
    SUPPLIER_ITEM_RESOLUTION_STATUS_NO_MATCH = 2
}
export interface ItemCapabilities {
    sellable?: boolean | undefined;
    purchasable?: boolean | undefined;
    stockable?: boolean | undefined;
    manufacturable?: boolean | undefined;
}
export interface ItemCapabilityFilters {
    sellable?: boolean | undefined;
    purchasable?: boolean | undefined;
    stockable?: boolean | undefined;
    manufacturable?: boolean | undefined;
}
export interface ItemSummary {
    itemId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
    structureType?: ItemStructureType | undefined;
    natureType?: ItemNatureType | undefined;
    status?: ItemStatus | undefined;
    capabilities?: ItemCapabilities | undefined;
    primaryCategorySummary?: ItemCategorySummary | undefined;
}
export interface ItemCategorySummary {
    categoryId?: string | undefined;
    categoryCode?: string | undefined;
    categoryName?: string | undefined;
    status?: ItemCategoryStatus | undefined;
}
export interface ItemCategoryTreeNode {
    categoryId?: string | undefined;
    categoryCode?: string | undefined;
    categoryName?: string | undefined;
    parentCategoryId?: string | undefined;
    status?: ItemCategoryStatus | undefined;
    hasChildren?: boolean | undefined;
}
export interface ItemCompositionComponentInput {
    componentItemId?: string | undefined;
}
export interface ItemCompositionComponent {
    componentItemId?: string | undefined;
    componentItemCode?: string | undefined;
    componentItemName?: string | undefined;
}
export interface SupplierItemMappingRecord {
    supplierId?: string | undefined;
    supplierItemCode?: string | undefined;
    supplierItemName?: string | undefined;
    itemId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
}
export interface SupplierItemMappingListEntry {
    supplierId?: string | undefined;
    supplierItemCode?: string | undefined;
    supplierItemName?: string | undefined;
    itemId?: string | undefined;
}
export interface GetItemRequest {
    tenantId?: string | undefined;
    itemId?: string | undefined;
}
export interface GetItemResponse {
    item?: ItemSummary | undefined;
}
export interface BatchGetItemsRequest {
    tenantId?: string | undefined;
    itemIds?: string[] | undefined;
}
export interface BatchGetItemsResponse {
    items?: ItemSummary[] | undefined;
    missingItemIds?: string[] | undefined;
}
export interface SearchItemsRequest {
    tenantId?: string | undefined;
    keyword?: string | undefined;
    structureType?: ItemStructureType | undefined;
    natureType?: ItemNatureType | undefined;
    capabilityFilters?: ItemCapabilityFilters | undefined;
    status?: ItemStatus | undefined;
    categoryId?: string | undefined;
    includeDescendants?: boolean | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchItemsResponse {
    items?: ItemSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListItemCategoriesRequest {
    tenantId?: string | undefined;
    parentCategoryId?: string | undefined;
}
export interface ListItemCategoriesResponse {
    categories?: ItemCategoryTreeNode[] | undefined;
}
export interface GetItemCompositionRequest {
    tenantId?: string | undefined;
    itemId?: string | undefined;
}
export interface GetItemCompositionResponse {
    itemId?: string | undefined;
    components?: ItemCompositionComponent[] | undefined;
}
export interface ListSupplierItemMappingsByItemRequest {
    tenantId?: string | undefined;
    itemId?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListSupplierItemMappingsByItemResponse {
    mappings?: SupplierItemMappingListEntry[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ResolveSupplierItemMappingRequest {
    tenantId?: string | undefined;
    supplierId?: string | undefined;
    supplierItemCode?: string | undefined;
    supplierItemName?: string | undefined;
}
export interface ResolveSupplierItemMappingResponse {
    resolutionStatus?: SupplierItemResolutionStatus | undefined;
    mapping?: SupplierItemMappingRecord | undefined;
}
export interface CreateItemRequest {
    tenantId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
    structureType?: ItemStructureType | undefined;
    natureType?: ItemNatureType | undefined;
}
export interface CreateItemResponse {
    itemId?: string | undefined;
    item?: ItemSummary | undefined;
}
export interface UpdateItemBasicsRequest {
    tenantId?: string | undefined;
    itemId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
}
export interface UpdateItemBasicsResponse {
    item?: ItemSummary | undefined;
}
export interface SetItemCapabilitiesRequest {
    tenantId?: string | undefined;
    itemId?: string | undefined;
    capabilities?: ItemCapabilities | undefined;
}
export interface SetItemCapabilitiesResponse {
    item?: ItemSummary | undefined;
}
export interface SetItemCompositionRequest {
    tenantId?: string | undefined;
    itemId?: string | undefined;
    components?: ItemCompositionComponentInput[] | undefined;
}
export interface SetItemCompositionResponse {
    itemId?: string | undefined;
    components?: ItemCompositionComponent[] | undefined;
}
export interface UpsertSupplierItemMappingRequest {
    tenantId?: string | undefined;
    supplierId?: string | undefined;
    supplierItemCode?: string | undefined;
    supplierItemName?: string | undefined;
    itemId?: string | undefined;
}
export interface UpsertSupplierItemMappingResponse {
    mapping?: SupplierItemMappingRecord | undefined;
}
export interface ChangeItemStatusRequest {
    tenantId?: string | undefined;
    itemId?: string | undefined;
    targetStatus?: ItemStatus | undefined;
}
export interface ChangeItemStatusResponse {
    item?: ItemSummary | undefined;
}
export interface CreateItemCategoryRequest {
    tenantId?: string | undefined;
    categoryCode?: string | undefined;
    categoryName?: string | undefined;
    parentCategoryId?: string | undefined;
}
export interface CreateItemCategoryResponse {
    category?: ItemCategorySummary | undefined;
}
export interface UpdateItemCategoryBasicsRequest {
    tenantId?: string | undefined;
    categoryId?: string | undefined;
    categoryCode?: string | undefined;
    categoryName?: string | undefined;
}
export interface UpdateItemCategoryBasicsResponse {
    category?: ItemCategorySummary | undefined;
}
export interface ChangeItemCategoryStatusRequest {
    tenantId?: string | undefined;
    categoryId?: string | undefined;
    targetStatus?: ItemCategoryStatus | undefined;
}
export interface ChangeItemCategoryStatusResponse {
    category?: ItemCategorySummary | undefined;
}
export interface SetItemPrimaryCategoryRequest {
    tenantId?: string | undefined;
    itemId?: string | undefined;
    categoryId?: string | undefined;
}
export interface SetItemPrimaryCategoryResponse {
    item?: ItemSummary | undefined;
}
export interface ItemMasterQueryServiceClient {
    getItem(request: GetItemRequest, ...rest: any): Observable<GetItemResponse>;
    batchGetItems(request: BatchGetItemsRequest, ...rest: any): Observable<BatchGetItemsResponse>;
    searchItems(request: SearchItemsRequest, ...rest: any): Observable<SearchItemsResponse>;
    listItemCategories(request: ListItemCategoriesRequest, ...rest: any): Observable<ListItemCategoriesResponse>;
    getItemComposition(request: GetItemCompositionRequest, ...rest: any): Observable<GetItemCompositionResponse>;
    listSupplierItemMappingsByItem(request: ListSupplierItemMappingsByItemRequest, ...rest: any): Observable<ListSupplierItemMappingsByItemResponse>;
    resolveSupplierItemMapping(request: ResolveSupplierItemMappingRequest, ...rest: any): Observable<ResolveSupplierItemMappingResponse>;
}
export interface ItemMasterQueryServiceController {
    getItem(request: GetItemRequest, ...rest: any): Promise<GetItemResponse> | Observable<GetItemResponse> | GetItemResponse;
    batchGetItems(request: BatchGetItemsRequest, ...rest: any): Promise<BatchGetItemsResponse> | Observable<BatchGetItemsResponse> | BatchGetItemsResponse;
    searchItems(request: SearchItemsRequest, ...rest: any): Promise<SearchItemsResponse> | Observable<SearchItemsResponse> | SearchItemsResponse;
    listItemCategories(request: ListItemCategoriesRequest, ...rest: any): Promise<ListItemCategoriesResponse> | Observable<ListItemCategoriesResponse> | ListItemCategoriesResponse;
    getItemComposition(request: GetItemCompositionRequest, ...rest: any): Promise<GetItemCompositionResponse> | Observable<GetItemCompositionResponse> | GetItemCompositionResponse;
    listSupplierItemMappingsByItem(request: ListSupplierItemMappingsByItemRequest, ...rest: any): Promise<ListSupplierItemMappingsByItemResponse> | Observable<ListSupplierItemMappingsByItemResponse> | ListSupplierItemMappingsByItemResponse;
    resolveSupplierItemMapping(request: ResolveSupplierItemMappingRequest, ...rest: any): Promise<ResolveSupplierItemMappingResponse> | Observable<ResolveSupplierItemMappingResponse> | ResolveSupplierItemMappingResponse;
}
export declare function ItemMasterQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const ITEM_MASTER_QUERY_SERVICE_NAME = "ItemMasterQueryService";
export interface ItemMasterManagementServiceClient {
    createItem(request: CreateItemRequest, ...rest: any): Observable<CreateItemResponse>;
    updateItemBasics(request: UpdateItemBasicsRequest, ...rest: any): Observable<UpdateItemBasicsResponse>;
    setItemCapabilities(request: SetItemCapabilitiesRequest, ...rest: any): Observable<SetItemCapabilitiesResponse>;
    setItemComposition(request: SetItemCompositionRequest, ...rest: any): Observable<SetItemCompositionResponse>;
    upsertSupplierItemMapping(request: UpsertSupplierItemMappingRequest, ...rest: any): Observable<UpsertSupplierItemMappingResponse>;
    changeItemStatus(request: ChangeItemStatusRequest, ...rest: any): Observable<ChangeItemStatusResponse>;
    createItemCategory(request: CreateItemCategoryRequest, ...rest: any): Observable<CreateItemCategoryResponse>;
    updateItemCategoryBasics(request: UpdateItemCategoryBasicsRequest, ...rest: any): Observable<UpdateItemCategoryBasicsResponse>;
    changeItemCategoryStatus(request: ChangeItemCategoryStatusRequest, ...rest: any): Observable<ChangeItemCategoryStatusResponse>;
    setItemPrimaryCategory(request: SetItemPrimaryCategoryRequest, ...rest: any): Observable<SetItemPrimaryCategoryResponse>;
}
export interface ItemMasterManagementServiceController {
    createItem(request: CreateItemRequest, ...rest: any): Promise<CreateItemResponse> | Observable<CreateItemResponse> | CreateItemResponse;
    updateItemBasics(request: UpdateItemBasicsRequest, ...rest: any): Promise<UpdateItemBasicsResponse> | Observable<UpdateItemBasicsResponse> | UpdateItemBasicsResponse;
    setItemCapabilities(request: SetItemCapabilitiesRequest, ...rest: any): Promise<SetItemCapabilitiesResponse> | Observable<SetItemCapabilitiesResponse> | SetItemCapabilitiesResponse;
    setItemComposition(request: SetItemCompositionRequest, ...rest: any): Promise<SetItemCompositionResponse> | Observable<SetItemCompositionResponse> | SetItemCompositionResponse;
    upsertSupplierItemMapping(request: UpsertSupplierItemMappingRequest, ...rest: any): Promise<UpsertSupplierItemMappingResponse> | Observable<UpsertSupplierItemMappingResponse> | UpsertSupplierItemMappingResponse;
    changeItemStatus(request: ChangeItemStatusRequest, ...rest: any): Promise<ChangeItemStatusResponse> | Observable<ChangeItemStatusResponse> | ChangeItemStatusResponse;
    createItemCategory(request: CreateItemCategoryRequest, ...rest: any): Promise<CreateItemCategoryResponse> | Observable<CreateItemCategoryResponse> | CreateItemCategoryResponse;
    updateItemCategoryBasics(request: UpdateItemCategoryBasicsRequest, ...rest: any): Promise<UpdateItemCategoryBasicsResponse> | Observable<UpdateItemCategoryBasicsResponse> | UpdateItemCategoryBasicsResponse;
    changeItemCategoryStatus(request: ChangeItemCategoryStatusRequest, ...rest: any): Promise<ChangeItemCategoryStatusResponse> | Observable<ChangeItemCategoryStatusResponse> | ChangeItemCategoryStatusResponse;
    setItemPrimaryCategory(request: SetItemPrimaryCategoryRequest, ...rest: any): Promise<SetItemPrimaryCategoryResponse> | Observable<SetItemPrimaryCategoryResponse> | SetItemPrimaryCategoryResponse;
}
export declare function ItemMasterManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const ITEM_MASTER_MANAGEMENT_SERVICE_NAME = "ItemMasterManagementService";
