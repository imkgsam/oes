import { AddOrReplaceReceiptLinesResponse, CancelReceiptDraftResponse, CreateReceiptDraftResponse, GetInventoryBalanceResponse, GetLocationResponse, GetReceiptLineResponse, GetReceiptResponse, GetWarehouseResponse, InventoryBalance, InventoryBalanceSummary, ListLocationsResponse, ListWarehousesResponse, Location, LocationSummary, PostReceiptResponse, Receipt, ReceiptLine, ReceiptLineSummary, ReceiptSummary, SearchInventoryBalancesResponse, SearchReceiptLinesResponse, SearchReceiptsResponse, SearchStockLedgerEntriesResponse, StockLedgerEntrySummary, Warehouse, WarehouseSummary } from '@oes/common/generated/wms_service';
import { InventoryBalanceRecord, LocationRecord, PageResult, ReceiptLineRecord, ReceiptLineSummaryRecord, ReceiptRecord, StockLedgerEntryRecord, WarehouseRecord } from '../../domain/models/wms-records';
/** WmsGrpcPresenter translates WMS phase 1 records into the generated gRPC response surface. */
export declare class WmsGrpcPresenter {
    /** toCreateReceiptDraftResponse presents one created receipt draft on the gRPC command surface. */
    static toCreateReceiptDraftResponse(record: ReceiptRecord): CreateReceiptDraftResponse;
    /** toAddOrReplaceReceiptLinesResponse presents one updated draft receipt on the gRPC command surface. */
    static toAddOrReplaceReceiptLinesResponse(record: ReceiptRecord): AddOrReplaceReceiptLinesResponse;
    /** toPostReceiptResponse presents one posted receipt plus its newly created ledger ids on the gRPC command surface. */
    static toPostReceiptResponse(record: ReceiptRecord): PostReceiptResponse;
    /** toCancelReceiptDraftResponse presents one cancelled draft receipt on the gRPC command surface. */
    static toCancelReceiptDraftResponse(record: ReceiptRecord): CancelReceiptDraftResponse;
    /** toGetWarehouseResponse presents one warehouse truth row on the gRPC query surface. */
    static toGetWarehouseResponse(record: WarehouseRecord): GetWarehouseResponse;
    /** toListWarehousesResponse presents one warehouse page on the gRPC query surface. */
    static toListWarehousesResponse(input: PageResult<WarehouseRecord>): ListWarehousesResponse;
    /** toGetLocationResponse presents one location truth row on the gRPC query surface. */
    static toGetLocationResponse(record: LocationRecord): GetLocationResponse;
    /** toListLocationsResponse presents one location page on the gRPC query surface. */
    static toListLocationsResponse(input: PageResult<LocationRecord>): ListLocationsResponse;
    /** toGetReceiptResponse presents one receipt aggregate on the gRPC query surface. */
    static toGetReceiptResponse(record: ReceiptRecord): GetReceiptResponse;
    /** toSearchReceiptsResponse presents one receipt summary page on the gRPC query surface. */
    static toSearchReceiptsResponse(input: PageResult<ReceiptRecord>): SearchReceiptsResponse;
    /** toGetReceiptLineResponse presents one receipt-line truth row on the gRPC query surface. */
    static toGetReceiptLineResponse(record: ReceiptLineSummaryRecord): GetReceiptLineResponse;
    /** toSearchReceiptLinesResponse presents one receipt-line summary page on the gRPC query surface. */
    static toSearchReceiptLinesResponse(input: PageResult<ReceiptLineSummaryRecord>): SearchReceiptLinesResponse;
    /** toSearchStockLedgerEntriesResponse presents one immutable ledger page on the gRPC query surface. */
    static toSearchStockLedgerEntriesResponse(input: PageResult<StockLedgerEntryRecord>): SearchStockLedgerEntriesResponse;
    /** toGetInventoryBalanceResponse presents one balance projection snapshot on the gRPC query surface. */
    static toGetInventoryBalanceResponse(record: InventoryBalanceRecord): GetInventoryBalanceResponse;
    /** toSearchInventoryBalancesResponse presents one balance page on the gRPC query surface. */
    static toSearchInventoryBalancesResponse(input: PageResult<InventoryBalanceRecord>): SearchInventoryBalancesResponse;
    /** toWarehouse converts one WMS warehouse record into the generated gRPC read shape. */
    static toWarehouse(record: WarehouseRecord): Warehouse;
    /** toWarehouseSummary converts one warehouse record into the generated summary shape. */
    static toWarehouseSummary(record: WarehouseRecord): WarehouseSummary;
    /** toLocation converts one WMS location record into the generated gRPC read shape. */
    static toLocation(record: LocationRecord): Location;
    /** toLocationSummary converts one location record into the generated summary shape. */
    static toLocationSummary(record: LocationRecord): LocationSummary;
    /** toReceipt converts one WMS receipt aggregate into the generated gRPC read shape. */
    static toReceipt(record: ReceiptRecord): Receipt;
    /** toReceiptLine converts one receipt-line record into the generated gRPC read shape. */
    static toReceiptLine(record: ReceiptLineRecord): ReceiptLine;
    /** toReceiptSummary converts one receipt aggregate into the generated summary shape. */
    static toReceiptSummary(record: ReceiptRecord): ReceiptSummary;
    /** toReceiptLineSummary converts one receipt-line summary record into the generated summary shape. */
    static toReceiptLineSummary(record: ReceiptLineSummaryRecord): ReceiptLineSummary;
    /** toStockLedgerEntrySummary converts one immutable ledger record into the generated summary shape. */
    static toStockLedgerEntrySummary(record: StockLedgerEntryRecord): StockLedgerEntrySummary;
    /** toInventoryBalance converts one balance projection record into the generated gRPC read shape. */
    static toInventoryBalance(record: InventoryBalanceRecord): InventoryBalance;
    /** toInventoryBalanceSummary converts one balance projection record into the generated summary shape. */
    static toInventoryBalanceSummary(record: InventoryBalanceRecord): InventoryBalanceSummary;
    private static toRestrictedStatusReason;
    private static toReceiptTrackingRef;
    private static toReceiptPhysicalDiscrepancy;
    private static toInventoryBalanceRestrictedQuantity;
}
