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
exports.SearchPurchaseOrdersHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const search_purchase_orders_query_1 = require("./search-purchase-orders.query");
/** SearchPurchaseOrdersHandler returns the current PO directory page without mutating procurement commitment state. */
let SearchPurchaseOrdersHandler = class SearchPurchaseOrdersHandler {
    constructor(purchaseOrderRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
    }
    async execute(query) {
        const page = await this.purchaseOrderRepository.search(query.input);
        return {
            purchaseOrders: page.items,
            total: page.total,
            page: page.page,
            pageSize: page.pageSize
        };
    }
};
exports.SearchPurchaseOrdersHandler = SearchPurchaseOrdersHandler;
exports.SearchPurchaseOrdersHandler = SearchPurchaseOrdersHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(search_purchase_orders_query_1.SearchPurchaseOrdersQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SearchPurchaseOrdersHandler);
//# sourceMappingURL=search-purchase-orders.handler.js.map