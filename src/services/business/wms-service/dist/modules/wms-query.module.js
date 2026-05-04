"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WmsQueryModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const get_inventory_balance_handler_1 = require("../application/queries/get-inventory-balance.handler");
const get_location_handler_1 = require("../application/queries/get-location.handler");
const get_receipt_line_handler_1 = require("../application/queries/get-receipt-line.handler");
const get_receipt_handler_1 = require("../application/queries/get-receipt.handler");
const get_warehouse_handler_1 = require("../application/queries/get-warehouse.handler");
const list_locations_handler_1 = require("../application/queries/list-locations.handler");
const list_warehouses_handler_1 = require("../application/queries/list-warehouses.handler");
const search_inventory_balances_handler_1 = require("../application/queries/search-inventory-balances.handler");
const search_receipt_lines_handler_1 = require("../application/queries/search-receipt-lines.handler");
const search_receipts_handler_1 = require("../application/queries/search-receipts.handler");
const search_stock_ledger_entries_handler_1 = require("../application/queries/search-stock-ledger-entries.handler");
const wms_query_grpc_controller_1 = require("../interfaces/grpc/wms-query.grpc.controller");
/** WmsQueryModule wires the phase 1 WMS query handlers and gRPC controller surface. */
let WmsQueryModule = class WmsQueryModule {
};
exports.WmsQueryModule = WmsQueryModule;
exports.WmsQueryModule = WmsQueryModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule],
        providers: [
            cqrs_2.ValidatingQueryBus,
            get_warehouse_handler_1.GetWarehouseHandler,
            list_warehouses_handler_1.ListWarehousesHandler,
            get_location_handler_1.GetLocationHandler,
            list_locations_handler_1.ListLocationsHandler,
            get_receipt_handler_1.GetReceiptHandler,
            search_receipts_handler_1.SearchReceiptsHandler,
            get_receipt_line_handler_1.GetReceiptLineHandler,
            search_receipt_lines_handler_1.SearchReceiptLinesHandler,
            search_stock_ledger_entries_handler_1.SearchStockLedgerEntriesHandler,
            get_inventory_balance_handler_1.GetInventoryBalanceHandler,
            search_inventory_balances_handler_1.SearchInventoryBalancesHandler
        ],
        controllers: [wms_query_grpc_controller_1.WmsQueryGrpcController]
    })
], WmsQueryModule);
//# sourceMappingURL=wms-query.module.js.map