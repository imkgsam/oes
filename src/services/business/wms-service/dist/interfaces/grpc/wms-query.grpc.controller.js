"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WmsQueryGrpcController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@oes/common/cqrs");
const filters_1 = require("@oes/common/filters");
const wms_service_1 = require("@oes/common/generated/wms_service");
const wms_records_1 = require("../../domain/models/wms-records");
const get_inventory_balance_query_1 = require("../../application/queries/get-inventory-balance.query");
const get_location_query_1 = require("../../application/queries/get-location.query");
const get_receipt_line_query_1 = require("../../application/queries/get-receipt-line.query");
const get_receipt_query_1 = require("../../application/queries/get-receipt.query");
const get_warehouse_query_1 = require("../../application/queries/get-warehouse.query");
const list_locations_query_1 = require("../../application/queries/list-locations.query");
const list_warehouses_query_1 = require("../../application/queries/list-warehouses.query");
const search_inventory_balances_query_1 = require("../../application/queries/search-inventory-balances.query");
const search_receipt_lines_query_1 = require("../../application/queries/search-receipt-lines.query");
const search_receipts_query_1 = require("../../application/queries/search-receipts.query");
const search_stock_ledger_entries_query_1 = require("../../application/queries/search-stock-ledger-entries.query");
const wms_grpc_presenter_1 = require("./wms-grpc.presenter");
const wms_rpc_context_validator_1 = require("./wms-rpc-context.validator");
/** WmsQueryGrpcController exposes the phase 1 read-only WMS warehouse, receipt, and inventory query contract. */
let WmsQueryGrpcController = class WmsQueryGrpcController {
    constructor(queryBus) {
        this.queryBus = queryBus;
    }
    async getWarehouse(request) {
        wms_rpc_context_validator_1.WmsRpcContextValidator.assertQueryContext(request);
        return wms_grpc_presenter_1.WmsGrpcPresenter.toGetWarehouseResponse(await this.queryBus.execute(new get_warehouse_query_1.GetWarehouseQuery(request.tenantId ?? '', request.warehouseId ?? '')));
    }
    async listWarehouses(request) {
        wms_rpc_context_validator_1.WmsRpcContextValidator.assertQueryContext(request);
        return wms_grpc_presenter_1.WmsGrpcPresenter.toListWarehousesResponse(await this.queryBus.execute(new list_warehouses_query_1.ListWarehousesQuery({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            keyword: request.keyword ?? undefined,
            status: toDomainWarehouseStatus(request.status),
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        })));
    }
    async getLocation(request) {
        wms_rpc_context_validator_1.WmsRpcContextValidator.assertQueryContext(request);
        return wms_grpc_presenter_1.WmsGrpcPresenter.toGetLocationResponse(await this.queryBus.execute(new get_location_query_1.GetLocationQuery(request.tenantId ?? '', request.locationId ?? '')));
    }
    async listLocations(request) {
        wms_rpc_context_validator_1.WmsRpcContextValidator.assertQueryContext(request);
        return wms_grpc_presenter_1.WmsGrpcPresenter.toListLocationsResponse(await this.queryBus.execute(new list_locations_query_1.ListLocationsQuery({
            tenantId: request.tenantId ?? '',
            warehouseId: request.warehouseId ?? undefined,
            parentLocationId: request.parentLocationId ?? undefined,
            locationType: toDomainLocationType(request.locationType),
            status: toDomainLocationStatus(request.status),
            supportsReceipt: request.supportsReceipt ?? undefined,
            supportsStorage: request.supportsStorage ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        })));
    }
    async getReceipt(request) {
        wms_rpc_context_validator_1.WmsRpcContextValidator.assertQueryContext(request);
        return wms_grpc_presenter_1.WmsGrpcPresenter.toGetReceiptResponse(await this.queryBus.execute(new get_receipt_query_1.GetReceiptQuery(request.tenantId ?? '', request.receiptId ?? '')));
    }
    async searchReceipts(request) {
        wms_rpc_context_validator_1.WmsRpcContextValidator.assertQueryContext(request);
        return wms_grpc_presenter_1.WmsGrpcPresenter.toSearchReceiptsResponse(await this.queryBus.execute(new search_receipts_query_1.SearchReceiptsQuery({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            warehouseId: request.warehouseId ?? undefined,
            status: toDomainReceiptStatus(request.status),
            receiptSourceType: toDomainReceiptSourceType(request.receiptSourceType),
            receivingExpectationId: request.receivingExpectationId ?? undefined,
            keyword: request.keyword ?? undefined,
            receiptDateFrom: request.receiptDateFrom ?? undefined,
            receiptDateTo: request.receiptDateTo ?? undefined,
            postedAtFrom: request.postedAtFrom ?? undefined,
            postedAtTo: request.postedAtTo ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        })));
    }
    async getReceiptLine(request) {
        wms_rpc_context_validator_1.WmsRpcContextValidator.assertQueryContext(request);
        return wms_grpc_presenter_1.WmsGrpcPresenter.toGetReceiptLineResponse(await this.queryBus.execute(new get_receipt_line_query_1.GetReceiptLineQuery(request.tenantId ?? '', request.receiptLineId ?? '')));
    }
    async searchReceiptLines(request) {
        wms_rpc_context_validator_1.WmsRpcContextValidator.assertQueryContext(request);
        return wms_grpc_presenter_1.WmsGrpcPresenter.toSearchReceiptLinesResponse(await this.queryBus.execute(new search_receipt_lines_query_1.SearchReceiptLinesQuery({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            receiptId: request.receiptId ?? undefined,
            warehouseId: request.warehouseId ?? undefined,
            targetLocationId: request.targetLocationId ?? undefined,
            itemId: request.itemId ?? undefined,
            receivingExpectationId: request.receivingExpectationId ?? undefined,
            inventoryStatus: toDomainInventoryStatus(request.inventoryStatus),
            restrictedReasonCode: toDomainRestrictedStatusReasonCode(request.restrictedReasonCode),
            discrepancyType: toDomainReceiptPhysicalDiscrepancyType(request.discrepancyType),
            postedAtFrom: request.postedAtFrom ?? undefined,
            postedAtTo: request.postedAtTo ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        })));
    }
    async searchStockLedgerEntries(request) {
        wms_rpc_context_validator_1.WmsRpcContextValidator.assertQueryContext(request);
        return wms_grpc_presenter_1.WmsGrpcPresenter.toSearchStockLedgerEntriesResponse(await this.queryBus.execute(new search_stock_ledger_entries_query_1.SearchStockLedgerEntriesQuery({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            warehouseId: request.warehouseId ?? undefined,
            locationId: request.locationId ?? undefined,
            itemId: request.itemId ?? undefined,
            receiptId: request.receiptId ?? undefined,
            receiptLineId: request.receiptLineId ?? undefined,
            receivingExpectationId: request.receivingExpectationId ?? undefined,
            inventoryStatus: toDomainInventoryStatus(request.inventoryStatus),
            restrictedReasonCode: toDomainRestrictedStatusReasonCode(request.restrictedReasonCode),
            postedAtFrom: request.postedAtFrom ?? undefined,
            postedAtTo: request.postedAtTo ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        })));
    }
    async getInventoryBalance(request) {
        wms_rpc_context_validator_1.WmsRpcContextValidator.assertQueryContext(request);
        return wms_grpc_presenter_1.WmsGrpcPresenter.toGetInventoryBalanceResponse(await this.queryBus.execute(new get_inventory_balance_query_1.GetInventoryBalanceQuery({
            tenantId: request.tenantId ?? '',
            warehouseId: request.warehouseId ?? '',
            itemId: request.itemId ?? '',
            locationId: request.locationId ?? undefined
        })));
    }
    async searchInventoryBalances(request) {
        wms_rpc_context_validator_1.WmsRpcContextValidator.assertQueryContext(request);
        return wms_grpc_presenter_1.WmsGrpcPresenter.toSearchInventoryBalancesResponse(await this.queryBus.execute(new search_inventory_balances_query_1.SearchInventoryBalancesQuery({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            warehouseId: request.warehouseId ?? undefined,
            locationId: request.locationId ?? undefined,
            itemId: request.itemId ?? undefined,
            inventoryStatus: toDomainInventoryBalanceStatusFilter(request.inventoryStatus),
            restrictedReasonCode: toDomainRestrictedStatusReasonCode(request.restrictedReasonCode),
            onlyPositiveOnHand: request.onlyPositiveOnHand ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        })));
    }
};
exports.WmsQueryGrpcController = WmsQueryGrpcController;
exports.WmsQueryGrpcController = WmsQueryGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.Controller)(),
    (0, wms_service_1.WarehouseQueryServiceControllerMethods)(),
    (0, wms_service_1.ReceiptQueryServiceControllerMethods)(),
    (0, wms_service_1.InventoryQueryServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingQueryBus])
], WmsQueryGrpcController);
function toDomainWarehouseStatus(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    return value === wms_service_1.WarehouseStatus.WAREHOUSE_STATUS_INACTIVE
        ? wms_records_1.WarehouseStatus.INACTIVE
        : wms_records_1.WarehouseStatus.ACTIVE;
}
function toDomainLocationType(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    switch (value) {
        case wms_service_1.LocationType.LOCATION_TYPE_STORAGE:
            return wms_records_1.LocationType.STORAGE;
        case wms_service_1.LocationType.LOCATION_TYPE_STAGING:
            return wms_records_1.LocationType.STAGING;
        case wms_service_1.LocationType.LOCATION_TYPE_RESTRICTED:
            return wms_records_1.LocationType.RESTRICTED;
        default:
            return wms_records_1.LocationType.RECEIVING;
    }
}
function toDomainLocationStatus(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    return value === wms_service_1.LocationStatus.LOCATION_STATUS_INACTIVE
        ? wms_records_1.LocationStatus.INACTIVE
        : wms_records_1.LocationStatus.ACTIVE;
}
function toDomainReceiptStatus(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    switch (value) {
        case wms_service_1.ReceiptStatus.RECEIPT_STATUS_POSTED:
            return wms_records_1.ReceiptStatus.POSTED;
        case wms_service_1.ReceiptStatus.RECEIPT_STATUS_CANCELLED:
            return wms_records_1.ReceiptStatus.CANCELLED;
        default:
            return wms_records_1.ReceiptStatus.DRAFT;
    }
}
function toDomainReceiptSourceType(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    return value === wms_service_1.ReceiptSourceType.RECEIPT_SOURCE_TYPE_RECEIVING_EXPECTATION_REFERENCE
        ? wms_records_1.ReceiptSourceType.RECEIVING_EXPECTATION_REFERENCE
        : wms_records_1.ReceiptSourceType.MANUAL;
}
function toDomainInventoryStatus(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    return value === wms_service_1.InventoryStatus.INVENTORY_STATUS_RESTRICTED
        ? wms_records_1.InventoryStatus.RESTRICTED
        : wms_records_1.InventoryStatus.AVAILABLE;
}
function toDomainRestrictedStatusReasonCode(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    switch (value) {
        case wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_DAMAGED:
            return wms_records_1.RestrictedStatusReasonCode.DAMAGED;
        case wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_QUALITY_HOLD:
            return wms_records_1.RestrictedStatusReasonCode.QUALITY_HOLD;
        case wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_IDENTIFICATION:
            return wms_records_1.RestrictedStatusReasonCode.PENDING_IDENTIFICATION;
        case wms_service_1.RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_DECISION:
            return wms_records_1.RestrictedStatusReasonCode.PENDING_DECISION;
        default:
            return wms_records_1.RestrictedStatusReasonCode.OTHER;
    }
}
function toDomainReceiptPhysicalDiscrepancyType(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    switch (value) {
        case wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_SHORT_RECEIVED:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.SHORT_RECEIVED;
        case wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OVER_RECEIVED:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.OVER_RECEIVED;
        case wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_DAMAGED:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.DAMAGED;
        case wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_WRONG_ITEM:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.WRONG_ITEM;
        case wms_service_1.ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_QUALITY_HOLD:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.QUALITY_HOLD;
        default:
            return wms_records_1.ReceiptPhysicalDiscrepancyType.OTHER;
    }
}
function toDomainInventoryBalanceStatusFilter(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    switch (value) {
        case wms_service_1.InventoryBalanceStatusFilter.INVENTORY_BALANCE_STATUS_FILTER_AVAILABLE:
            return wms_records_1.InventoryBalanceStatusFilter.AVAILABLE;
        case wms_service_1.InventoryBalanceStatusFilter.INVENTORY_BALANCE_STATUS_FILTER_RESTRICTED:
            return wms_records_1.InventoryBalanceStatusFilter.RESTRICTED;
        default:
            return wms_records_1.InventoryBalanceStatusFilter.ANY;
    }
}
//# sourceMappingURL=wms-query.grpc.controller.js.map