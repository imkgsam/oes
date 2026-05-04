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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchStockLedgerEntriesHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const wms_assertions_1 = require("../support/wms-assertions");
const search_stock_ledger_entries_query_1 = require("./search-stock-ledger-entries.query");
/** SearchStockLedgerEntriesHandler returns one filtered immutable ledger page for the query surface. */
let SearchStockLedgerEntriesHandler = class SearchStockLedgerEntriesHandler {
    inventoryRepository;
    constructor(inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }
    async execute(query) {
        (0, wms_assertions_1.assertRequiredString)(query.payload.tenantId, 'tenantId');
        (0, wms_assertions_1.assertDateRange)(query.payload.postedAtFrom, query.payload.postedAtTo, 'postedAt');
        return this.inventoryRepository.searchStockLedgerEntries(query.payload);
    }
};
exports.SearchStockLedgerEntriesHandler = SearchStockLedgerEntriesHandler;
exports.SearchStockLedgerEntriesHandler = SearchStockLedgerEntriesHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(search_stock_ledger_entries_query_1.SearchStockLedgerEntriesQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.INVENTORY_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SearchStockLedgerEntriesHandler);
//# sourceMappingURL=search-stock-ledger-entries.handler.js.map