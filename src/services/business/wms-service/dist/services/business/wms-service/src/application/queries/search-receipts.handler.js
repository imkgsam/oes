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
exports.SearchReceiptsHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const wms_assertions_1 = require("../support/wms-assertions");
const search_receipts_query_1 = require("./search-receipts.query");
/** SearchReceiptsHandler returns one filtered receipt page without exposing non-WMS lifecycle semantics. */
let SearchReceiptsHandler = class SearchReceiptsHandler {
    receiptRepository;
    constructor(receiptRepository) {
        this.receiptRepository = receiptRepository;
    }
    async execute(query) {
        (0, wms_assertions_1.assertRequiredString)(query.payload.tenantId, 'tenantId');
        (0, wms_assertions_1.assertDateRange)(query.payload.receiptDateFrom, query.payload.receiptDateTo, 'receiptDate');
        (0, wms_assertions_1.assertDateRange)(query.payload.postedAtFrom, query.payload.postedAtTo, 'postedAt');
        return this.receiptRepository.searchReceipts(query.payload);
    }
};
exports.SearchReceiptsHandler = SearchReceiptsHandler;
exports.SearchReceiptsHandler = SearchReceiptsHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(search_receipts_query_1.SearchReceiptsQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.RECEIPT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SearchReceiptsHandler);
//# sourceMappingURL=search-receipts.handler.js.map