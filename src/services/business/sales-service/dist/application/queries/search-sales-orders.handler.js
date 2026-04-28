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
exports.SearchSalesOrdersHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const sales_assertions_1 = require("../support/sales-assertions");
const search_sales_orders_query_1 = require("./search-sales-orders.query");
/** SearchSalesOrdersHandler returns paged established order summaries without crossing into fulfillment execution truth. */
let SearchSalesOrdersHandler = class SearchSalesOrdersHandler {
    constructor(salesOrderRepository) {
        this.salesOrderRepository = salesOrderRepository;
    }
    async execute(query) {
        (0, sales_assertions_1.assertRequiredString)(query.input.tenantId, 'tenantId');
        const pageState = (0, sales_assertions_1.normalizePageInput)(query.input.page, query.input.pageSize);
        const result = await this.salesOrderRepository.search({
            ...query.input,
            ...pageState
        });
        return {
            ...result,
            salesOrders: result.items
        };
    }
};
exports.SearchSalesOrdersHandler = SearchSalesOrdersHandler;
exports.SearchSalesOrdersHandler = SearchSalesOrdersHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(search_sales_orders_query_1.SearchSalesOrdersQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SALES_ORDER_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SearchSalesOrdersHandler);
//# sourceMappingURL=search-sales-orders.handler.js.map