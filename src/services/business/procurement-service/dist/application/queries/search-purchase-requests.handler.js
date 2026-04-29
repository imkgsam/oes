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
exports.SearchPurchaseRequestsHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_query_enrichment_1 = require("../support/procurement-query-enrichment");
const search_purchase_requests_query_1 = require("./search-purchase-requests.query");
/** SearchPurchaseRequestsHandler returns the current PR directory page without mutating procurement demand state. */
let SearchPurchaseRequestsHandler = class SearchPurchaseRequestsHandler {
    constructor(purchaseRequestRepository, purchaseOrderRepository, receivingRepository) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.receivingRepository = receivingRepository;
    }
    async execute(query) {
        const page = await this.purchaseRequestRepository.search({
            ...query.input,
            status: query.input.status === undefined ||
                query.input.status === 'PARTIALLY_CONVERTED' ||
                query.input.status === 'CONVERTED'
                ? undefined
                : query.input.status,
            purchaseOrderId: undefined
        });
        const enrichedItems = await Promise.all(page.items.map((record) => (0, procurement_query_enrichment_1.enrichPurchaseRequestForQuery)(record, this.purchaseOrderRepository, this.receivingRepository)));
        const enrichedPage = (0, procurement_query_enrichment_1.paginateEnrichedPurchaseRequests)({
            items: enrichedItems,
            page: query.input.page,
            pageSize: query.input.pageSize,
            status: query.input.status,
            purchaseOrderId: query.input.purchaseOrderId
        });
        return {
            purchaseRequests: enrichedPage.items,
            total: enrichedPage.total,
            page: enrichedPage.page,
            pageSize: enrichedPage.pageSize
        };
    }
};
exports.SearchPurchaseRequestsHandler = SearchPurchaseRequestsHandler;
exports.SearchPurchaseRequestsHandler = SearchPurchaseRequestsHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(search_purchase_requests_query_1.SearchPurchaseRequestsQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_REQUEST_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY)),
    __param(2, (0, common_1.Inject)(tokens_1.TOKENS.RECEIVING_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object])
], SearchPurchaseRequestsHandler);
//# sourceMappingURL=search-purchase-requests.handler.js.map