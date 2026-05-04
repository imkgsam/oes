import { Observable } from "rxjs";
export declare enum WarehouseScope {
    WAREHOUSE_SCOPE_UNSPECIFIED = 0,
    WAREHOUSE_SCOPE_INTERNAL = 1
}
export declare enum WarehouseStatus {
    WAREHOUSE_STATUS_UNSPECIFIED = 0,
    WAREHOUSE_STATUS_ACTIVE = 1,
    WAREHOUSE_STATUS_INACTIVE = 2
}
export declare enum LocationScope {
    LOCATION_SCOPE_UNSPECIFIED = 0,
    LOCATION_SCOPE_INTERNAL = 1
}
export declare enum LocationType {
    LOCATION_TYPE_UNSPECIFIED = 0,
    LOCATION_TYPE_RECEIVING = 1,
    LOCATION_TYPE_STORAGE = 2,
    LOCATION_TYPE_STAGING = 3,
    LOCATION_TYPE_RESTRICTED = 4
}
export declare enum LocationStatus {
    LOCATION_STATUS_UNSPECIFIED = 0,
    LOCATION_STATUS_ACTIVE = 1,
    LOCATION_STATUS_INACTIVE = 2
}
export declare enum ReceiptStatus {
    RECEIPT_STATUS_UNSPECIFIED = 0,
    RECEIPT_STATUS_DRAFT = 1,
    RECEIPT_STATUS_POSTED = 2,
    RECEIPT_STATUS_CANCELLED = 3
}
export declare enum ReceiptSourceType {
    RECEIPT_SOURCE_TYPE_UNSPECIFIED = 0,
    RECEIPT_SOURCE_TYPE_MANUAL = 1,
    RECEIPT_SOURCE_TYPE_RECEIVING_EXPECTATION_REFERENCE = 2
}
export declare enum InventoryStatus {
    INVENTORY_STATUS_UNSPECIFIED = 0,
    INVENTORY_STATUS_AVAILABLE = 1,
    INVENTORY_STATUS_RESTRICTED = 2
}
export declare enum RestrictedStatusReasonCode {
    RESTRICTED_STATUS_REASON_CODE_UNSPECIFIED = 0,
    RESTRICTED_STATUS_REASON_CODE_DAMAGED = 1,
    RESTRICTED_STATUS_REASON_CODE_QUALITY_HOLD = 2,
    RESTRICTED_STATUS_REASON_CODE_PENDING_IDENTIFICATION = 3,
    RESTRICTED_STATUS_REASON_CODE_PENDING_DECISION = 4,
    RESTRICTED_STATUS_REASON_CODE_OTHER = 5
}
export declare enum ReceiptTrackingRefType {
    RECEIPT_TRACKING_REF_TYPE_UNSPECIFIED = 0,
    RECEIPT_TRACKING_REF_TYPE_BOX_CODE = 1,
    RECEIPT_TRACKING_REF_TYPE_UNIT_CODE = 2,
    RECEIPT_TRACKING_REF_TYPE_EXTERNAL_CODE = 3,
    RECEIPT_TRACKING_REF_TYPE_FREE_TEXT = 4
}
export declare enum ReceiptPhysicalDiscrepancyType {
    RECEIPT_PHYSICAL_DISCREPANCY_TYPE_UNSPECIFIED = 0,
    RECEIPT_PHYSICAL_DISCREPANCY_TYPE_SHORT_RECEIVED = 1,
    RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OVER_RECEIVED = 2,
    RECEIPT_PHYSICAL_DISCREPANCY_TYPE_DAMAGED = 3,
    RECEIPT_PHYSICAL_DISCREPANCY_TYPE_WRONG_ITEM = 4,
    RECEIPT_PHYSICAL_DISCREPANCY_TYPE_QUALITY_HOLD = 5,
    RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OTHER = 6
}
export declare enum StockLedgerEntryType {
    STOCK_LEDGER_ENTRY_TYPE_UNSPECIFIED = 0,
    STOCK_LEDGER_ENTRY_TYPE_RECEIPT_POSTED = 1
}
export declare enum StockLedgerDirection {
    STOCK_LEDGER_DIRECTION_UNSPECIFIED = 0,
    STOCK_LEDGER_DIRECTION_IN = 1
}
export declare enum StockLedgerSourceDocumentType {
    STOCK_LEDGER_SOURCE_DOCUMENT_TYPE_UNSPECIFIED = 0,
    STOCK_LEDGER_SOURCE_DOCUMENT_TYPE_RECEIPT = 1
}
export declare enum InventoryBalanceStatusFilter {
    INVENTORY_BALANCE_STATUS_FILTER_UNSPECIFIED = 0,
    INVENTORY_BALANCE_STATUS_FILTER_ANY = 1,
    INVENTORY_BALANCE_STATUS_FILTER_AVAILABLE = 2,
    INVENTORY_BALANCE_STATUS_FILTER_RESTRICTED = 3
}
export interface OperatorContext {
    operatorId?: string | undefined;
    operatorType?: string | undefined;
    orgId?: string | undefined;
}
export interface TraceContext {
    traceId?: string | undefined;
    requestId?: string | undefined;
}
export interface AuditContext {
    auditId?: string | undefined;
    reason?: string | undefined;
    source?: string | undefined;
}
export interface RestrictedStatusReason {
    reasonCode?: RestrictedStatusReasonCode | undefined;
    reasonNote?: string | undefined;
}
export interface ReceiptTrackingRef {
    trackingRefType?: ReceiptTrackingRefType | undefined;
    trackingRefValue?: string | undefined;
}
export interface ReceiptPhysicalDiscrepancy {
    discrepancyType?: ReceiptPhysicalDiscrepancyType | undefined;
    discrepancyQuantity?: string | undefined;
    note?: string | undefined;
}
export interface Warehouse {
    warehouseId?: string | undefined;
    warehouseCode?: string | undefined;
    warehouseName?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    warehouseScope?: WarehouseScope | undefined;
    status?: WarehouseStatus | undefined;
    defaultReceivingLocationId?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface WarehouseSummary {
    warehouseId?: string | undefined;
    warehouseCode?: string | undefined;
    warehouseName?: string | undefined;
    warehouseScope?: WarehouseScope | undefined;
    status?: WarehouseStatus | undefined;
    defaultReceivingLocationId?: string | undefined;
}
export interface Location {
    locationId?: string | undefined;
    warehouseId?: string | undefined;
    parentLocationId?: string | undefined;
    locationCode?: string | undefined;
    locationName?: string | undefined;
    locationScope?: LocationScope | undefined;
    locationType?: LocationType | undefined;
    status?: LocationStatus | undefined;
    supportsReceipt?: boolean | undefined;
    supportsStorage?: boolean | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface LocationSummary {
    locationId?: string | undefined;
    warehouseId?: string | undefined;
    parentLocationId?: string | undefined;
    locationCode?: string | undefined;
    locationName?: string | undefined;
    locationScope?: LocationScope | undefined;
    locationType?: LocationType | undefined;
    status?: LocationStatus | undefined;
    supportsReceipt?: boolean | undefined;
    supportsStorage?: boolean | undefined;
}
export interface ReceiptLine {
    receiptLineId?: string | undefined;
    receiptId?: string | undefined;
    lineNo?: number | undefined;
    itemId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
    receivingExpectationId?: string | undefined;
    targetLocationId?: string | undefined;
    confirmedQuantity?: string | undefined;
    uom?: string | undefined;
    inventoryStatus?: InventoryStatus | undefined;
    restrictedReason?: RestrictedStatusReason | undefined;
    trackingRefs?: ReceiptTrackingRef[] | undefined;
    physicalDiscrepancy?: ReceiptPhysicalDiscrepancy | undefined;
    evidenceAttachmentRefs?: string[] | undefined;
    postedStockLedgerEntryIds?: string[] | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface Receipt {
    receiptId?: string | undefined;
    receiptNo?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    warehouseId?: string | undefined;
    status?: ReceiptStatus | undefined;
    receiptSourceType?: ReceiptSourceType | undefined;
    referencedReceivingExpectationIds?: string[] | undefined;
    receiptDate?: string | undefined;
    note?: string | undefined;
    attachmentRefs?: string[] | undefined;
    lineCount?: number | undefined;
    postedAt?: string | undefined;
    cancelledAt?: string | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    lines?: ReceiptLine[] | undefined;
}
export interface ReceiptSummary {
    receiptId?: string | undefined;
    receiptNo?: string | undefined;
    warehouseId?: string | undefined;
    status?: ReceiptStatus | undefined;
    receiptSourceType?: ReceiptSourceType | undefined;
    receiptDate?: string | undefined;
    lineCount?: number | undefined;
    postedAt?: string | undefined;
    hasRestrictedLines?: boolean | undefined;
    hasPhysicalDiscrepancy?: boolean | undefined;
}
export interface ReceiptLineSummary {
    receiptLineId?: string | undefined;
    receiptId?: string | undefined;
    receiptNo?: string | undefined;
    lineNo?: number | undefined;
    warehouseId?: string | undefined;
    itemId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
    receivingExpectationId?: string | undefined;
    targetLocationId?: string | undefined;
    confirmedQuantity?: string | undefined;
    uom?: string | undefined;
    inventoryStatus?: InventoryStatus | undefined;
    restrictedReasonCode?: RestrictedStatusReasonCode | undefined;
    discrepancyType?: ReceiptPhysicalDiscrepancyType | undefined;
    postedAt?: string | undefined;
}
export interface StockLedgerEntry {
    stockLedgerEntryId?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    entryType?: StockLedgerEntryType | undefined;
    direction?: StockLedgerDirection | undefined;
    warehouseId?: string | undefined;
    locationId?: string | undefined;
    itemId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
    quantityDelta?: string | undefined;
    uom?: string | undefined;
    inventoryStatus?: InventoryStatus | undefined;
    restrictedReason?: RestrictedStatusReason | undefined;
    sourceDocumentType?: StockLedgerSourceDocumentType | undefined;
    sourceDocumentId?: string | undefined;
    sourceDocumentLineId?: string | undefined;
    receivingExpectationId?: string | undefined;
    trackingRefs?: ReceiptTrackingRef[] | undefined;
    postedAt?: string | undefined;
}
export interface StockLedgerEntrySummary {
    stockLedgerEntryId?: string | undefined;
    entryType?: StockLedgerEntryType | undefined;
    warehouseId?: string | undefined;
    locationId?: string | undefined;
    itemId?: string | undefined;
    quantityDelta?: string | undefined;
    uom?: string | undefined;
    inventoryStatus?: InventoryStatus | undefined;
    restrictedReasonCode?: RestrictedStatusReasonCode | undefined;
    sourceDocumentId?: string | undefined;
    postedAt?: string | undefined;
}
export interface InventoryBalanceRestrictedQuantity {
    reasonCode?: RestrictedStatusReasonCode | undefined;
    quantity?: string | undefined;
}
export interface InventoryBalance {
    tenantId?: string | undefined;
    orgId?: string | undefined;
    warehouseId?: string | undefined;
    locationId?: string | undefined;
    itemId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
    uom?: string | undefined;
    onHandQuantity?: string | undefined;
    availableQuantity?: string | undefined;
    restrictedQuantity?: string | undefined;
    restrictedQuantities?: InventoryBalanceRestrictedQuantity[] | undefined;
    lastLedgerEntryId?: string | undefined;
    lastPostedAt?: string | undefined;
    updatedAt?: string | undefined;
}
export interface InventoryBalanceSummary {
    warehouseId?: string | undefined;
    locationId?: string | undefined;
    itemId?: string | undefined;
    itemCode?: string | undefined;
    itemName?: string | undefined;
    uom?: string | undefined;
    onHandQuantity?: string | undefined;
    availableQuantity?: string | undefined;
    restrictedQuantity?: string | undefined;
    lastPostedAt?: string | undefined;
}
export interface ReceiptLineInput {
    receiptLineId?: string | undefined;
    itemId?: string | undefined;
    receivingExpectationId?: string | undefined;
    targetLocationId?: string | undefined;
    confirmedQuantity?: string | undefined;
    uom?: string | undefined;
    inventoryStatus?: InventoryStatus | undefined;
    restrictedReason?: RestrictedStatusReason | undefined;
    trackingRefs?: ReceiptTrackingRef[] | undefined;
    physicalDiscrepancy?: ReceiptPhysicalDiscrepancy | undefined;
    evidenceAttachmentRefs?: string[] | undefined;
}
export interface GetWarehouseRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    warehouseId?: string | undefined;
}
export interface GetWarehouseResponse {
    warehouse?: Warehouse | undefined;
}
export interface ListWarehousesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    keyword?: string | undefined;
    status?: WarehouseStatus | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListWarehousesResponse {
    warehouses?: WarehouseSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetLocationRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    locationId?: string | undefined;
}
export interface GetLocationResponse {
    location?: Location | undefined;
}
export interface ListLocationsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    warehouseId?: string | undefined;
    parentLocationId?: string | undefined;
    locationType?: LocationType | undefined;
    status?: LocationStatus | undefined;
    supportsReceipt?: boolean | undefined;
    supportsStorage?: boolean | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface ListLocationsResponse {
    locations?: LocationSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetReceiptRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    receiptId?: string | undefined;
}
export interface GetReceiptResponse {
    receipt?: Receipt | undefined;
}
export interface SearchReceiptsRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    warehouseId?: string | undefined;
    status?: ReceiptStatus | undefined;
    receiptSourceType?: ReceiptSourceType | undefined;
    receivingExpectationId?: string | undefined;
    keyword?: string | undefined;
    receiptDateFrom?: string | undefined;
    receiptDateTo?: string | undefined;
    postedAtFrom?: string | undefined;
    postedAtTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchReceiptsResponse {
    receipts?: ReceiptSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetReceiptLineRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    receiptLineId?: string | undefined;
}
export interface GetReceiptLineResponse {
    receiptLine?: ReceiptLine | undefined;
}
export interface SearchReceiptLinesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    receiptId?: string | undefined;
    warehouseId?: string | undefined;
    targetLocationId?: string | undefined;
    itemId?: string | undefined;
    receivingExpectationId?: string | undefined;
    inventoryStatus?: InventoryStatus | undefined;
    restrictedReasonCode?: RestrictedStatusReasonCode | undefined;
    discrepancyType?: ReceiptPhysicalDiscrepancyType | undefined;
    postedAtFrom?: string | undefined;
    postedAtTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchReceiptLinesResponse {
    receiptLines?: ReceiptLineSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface CreateReceiptDraftRequest {
    tenantId?: string | undefined;
    orgId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    warehouseId?: string | undefined;
    receiptSourceType?: ReceiptSourceType | undefined;
    receiptDate?: string | undefined;
    referencedReceivingExpectationIds?: string[] | undefined;
    note?: string | undefined;
    attachmentRefs?: string[] | undefined;
}
export interface CreateReceiptDraftResponse {
    receipt?: Receipt | undefined;
}
export interface AddOrReplaceReceiptLinesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    receiptId?: string | undefined;
    lines?: ReceiptLineInput[] | undefined;
}
export interface AddOrReplaceReceiptLinesResponse {
    receipt?: Receipt | undefined;
}
export interface PostReceiptRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    receiptId?: string | undefined;
    postComment?: string | undefined;
}
export interface PostReceiptResponse {
    receipt?: Receipt | undefined;
    postedStockLedgerEntryIds?: string[] | undefined;
}
export interface CancelReceiptDraftRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    auditContext?: AuditContext | undefined;
    receiptId?: string | undefined;
    cancelReason?: string | undefined;
}
export interface CancelReceiptDraftResponse {
    receipt?: Receipt | undefined;
}
export interface SearchStockLedgerEntriesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    warehouseId?: string | undefined;
    locationId?: string | undefined;
    itemId?: string | undefined;
    receiptId?: string | undefined;
    receiptLineId?: string | undefined;
    receivingExpectationId?: string | undefined;
    inventoryStatus?: InventoryStatus | undefined;
    restrictedReasonCode?: RestrictedStatusReasonCode | undefined;
    postedAtFrom?: string | undefined;
    postedAtTo?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchStockLedgerEntriesResponse {
    entries?: StockLedgerEntrySummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface GetInventoryBalanceRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    warehouseId?: string | undefined;
    itemId?: string | undefined;
    locationId?: string | undefined;
}
export interface GetInventoryBalanceResponse {
    inventoryBalance?: InventoryBalance | undefined;
}
export interface SearchInventoryBalancesRequest {
    tenantId?: string | undefined;
    operatorContext?: OperatorContext | undefined;
    traceContext?: TraceContext | undefined;
    orgId?: string | undefined;
    warehouseId?: string | undefined;
    locationId?: string | undefined;
    itemId?: string | undefined;
    inventoryStatus?: InventoryBalanceStatusFilter | undefined;
    restrictedReasonCode?: RestrictedStatusReasonCode | undefined;
    onlyPositiveOnHand?: boolean | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface SearchInventoryBalancesResponse {
    inventoryBalances?: InventoryBalanceSummary[] | undefined;
    total?: number | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}
export interface WarehouseQueryServiceClient {
    getWarehouse(request: GetWarehouseRequest, ...rest: any): Observable<GetWarehouseResponse>;
    listWarehouses(request: ListWarehousesRequest, ...rest: any): Observable<ListWarehousesResponse>;
    getLocation(request: GetLocationRequest, ...rest: any): Observable<GetLocationResponse>;
    listLocations(request: ListLocationsRequest, ...rest: any): Observable<ListLocationsResponse>;
}
export interface WarehouseQueryServiceController {
    getWarehouse(request: GetWarehouseRequest, ...rest: any): Promise<GetWarehouseResponse> | Observable<GetWarehouseResponse> | GetWarehouseResponse;
    listWarehouses(request: ListWarehousesRequest, ...rest: any): Promise<ListWarehousesResponse> | Observable<ListWarehousesResponse> | ListWarehousesResponse;
    getLocation(request: GetLocationRequest, ...rest: any): Promise<GetLocationResponse> | Observable<GetLocationResponse> | GetLocationResponse;
    listLocations(request: ListLocationsRequest, ...rest: any): Promise<ListLocationsResponse> | Observable<ListLocationsResponse> | ListLocationsResponse;
}
export declare function WarehouseQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const WAREHOUSE_QUERY_SERVICE_NAME = "WarehouseQueryService";
export interface ReceiptQueryServiceClient {
    getReceipt(request: GetReceiptRequest, ...rest: any): Observable<GetReceiptResponse>;
    searchReceipts(request: SearchReceiptsRequest, ...rest: any): Observable<SearchReceiptsResponse>;
    getReceiptLine(request: GetReceiptLineRequest, ...rest: any): Observable<GetReceiptLineResponse>;
    searchReceiptLines(request: SearchReceiptLinesRequest, ...rest: any): Observable<SearchReceiptLinesResponse>;
}
export interface ReceiptQueryServiceController {
    getReceipt(request: GetReceiptRequest, ...rest: any): Promise<GetReceiptResponse> | Observable<GetReceiptResponse> | GetReceiptResponse;
    searchReceipts(request: SearchReceiptsRequest, ...rest: any): Promise<SearchReceiptsResponse> | Observable<SearchReceiptsResponse> | SearchReceiptsResponse;
    getReceiptLine(request: GetReceiptLineRequest, ...rest: any): Promise<GetReceiptLineResponse> | Observable<GetReceiptLineResponse> | GetReceiptLineResponse;
    searchReceiptLines(request: SearchReceiptLinesRequest, ...rest: any): Promise<SearchReceiptLinesResponse> | Observable<SearchReceiptLinesResponse> | SearchReceiptLinesResponse;
}
export declare function ReceiptQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const RECEIPT_QUERY_SERVICE_NAME = "ReceiptQueryService";
export interface ReceiptManagementServiceClient {
    createReceiptDraft(request: CreateReceiptDraftRequest, ...rest: any): Observable<CreateReceiptDraftResponse>;
    addOrReplaceReceiptLines(request: AddOrReplaceReceiptLinesRequest, ...rest: any): Observable<AddOrReplaceReceiptLinesResponse>;
    postReceipt(request: PostReceiptRequest, ...rest: any): Observable<PostReceiptResponse>;
    cancelReceiptDraft(request: CancelReceiptDraftRequest, ...rest: any): Observable<CancelReceiptDraftResponse>;
}
export interface ReceiptManagementServiceController {
    createReceiptDraft(request: CreateReceiptDraftRequest, ...rest: any): Promise<CreateReceiptDraftResponse> | Observable<CreateReceiptDraftResponse> | CreateReceiptDraftResponse;
    addOrReplaceReceiptLines(request: AddOrReplaceReceiptLinesRequest, ...rest: any): Promise<AddOrReplaceReceiptLinesResponse> | Observable<AddOrReplaceReceiptLinesResponse> | AddOrReplaceReceiptLinesResponse;
    postReceipt(request: PostReceiptRequest, ...rest: any): Promise<PostReceiptResponse> | Observable<PostReceiptResponse> | PostReceiptResponse;
    cancelReceiptDraft(request: CancelReceiptDraftRequest, ...rest: any): Promise<CancelReceiptDraftResponse> | Observable<CancelReceiptDraftResponse> | CancelReceiptDraftResponse;
}
export declare function ReceiptManagementServiceControllerMethods(): (constructor: Function) => void;
export declare const RECEIPT_MANAGEMENT_SERVICE_NAME = "ReceiptManagementService";
export interface InventoryQueryServiceClient {
    searchStockLedgerEntries(request: SearchStockLedgerEntriesRequest, ...rest: any): Observable<SearchStockLedgerEntriesResponse>;
    getInventoryBalance(request: GetInventoryBalanceRequest, ...rest: any): Observable<GetInventoryBalanceResponse>;
    searchInventoryBalances(request: SearchInventoryBalancesRequest, ...rest: any): Observable<SearchInventoryBalancesResponse>;
}
export interface InventoryQueryServiceController {
    searchStockLedgerEntries(request: SearchStockLedgerEntriesRequest, ...rest: any): Promise<SearchStockLedgerEntriesResponse> | Observable<SearchStockLedgerEntriesResponse> | SearchStockLedgerEntriesResponse;
    getInventoryBalance(request: GetInventoryBalanceRequest, ...rest: any): Promise<GetInventoryBalanceResponse> | Observable<GetInventoryBalanceResponse> | GetInventoryBalanceResponse;
    searchInventoryBalances(request: SearchInventoryBalancesRequest, ...rest: any): Promise<SearchInventoryBalancesResponse> | Observable<SearchInventoryBalancesResponse> | SearchInventoryBalancesResponse;
}
export declare function InventoryQueryServiceControllerMethods(): (constructor: Function) => void;
export declare const INVENTORY_QUERY_SERVICE_NAME = "InventoryQueryService";
