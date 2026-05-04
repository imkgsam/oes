import { ValidatingQueryBus } from '@oes/common/cqrs';
import { GetInventoryBalanceRequest, GetInventoryBalanceResponse, GetLocationRequest, GetLocationResponse, GetReceiptLineRequest, GetReceiptLineResponse, GetReceiptRequest, GetReceiptResponse, GetWarehouseRequest, GetWarehouseResponse, InventoryQueryServiceController, ListLocationsRequest, ListLocationsResponse, ListWarehousesRequest, ListWarehousesResponse, ReceiptQueryServiceController, SearchInventoryBalancesRequest, SearchInventoryBalancesResponse, SearchReceiptLinesRequest, SearchReceiptLinesResponse, SearchReceiptsRequest, SearchReceiptsResponse, SearchStockLedgerEntriesRequest, SearchStockLedgerEntriesResponse, WarehouseQueryServiceController } from '@oes/common/generated/wms_service';
/** WmsQueryGrpcController exposes the phase 1 read-only WMS warehouse, receipt, and inventory query contract. */
export declare class WmsQueryGrpcController implements WarehouseQueryServiceController, ReceiptQueryServiceController, InventoryQueryServiceController {
    private readonly queryBus;
    constructor(queryBus: ValidatingQueryBus);
    getWarehouse(request: GetWarehouseRequest): Promise<GetWarehouseResponse>;
    listWarehouses(request: ListWarehousesRequest): Promise<ListWarehousesResponse>;
    getLocation(request: GetLocationRequest): Promise<GetLocationResponse>;
    listLocations(request: ListLocationsRequest): Promise<ListLocationsResponse>;
    getReceipt(request: GetReceiptRequest): Promise<GetReceiptResponse>;
    searchReceipts(request: SearchReceiptsRequest): Promise<SearchReceiptsResponse>;
    getReceiptLine(request: GetReceiptLineRequest): Promise<GetReceiptLineResponse>;
    searchReceiptLines(request: SearchReceiptLinesRequest): Promise<SearchReceiptLinesResponse>;
    searchStockLedgerEntries(request: SearchStockLedgerEntriesRequest): Promise<SearchStockLedgerEntriesResponse>;
    getInventoryBalance(request: GetInventoryBalanceRequest): Promise<GetInventoryBalanceResponse>;
    searchInventoryBalances(request: SearchInventoryBalancesRequest): Promise<SearchInventoryBalancesResponse>;
}
