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
exports.GetSalesOrderHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const sales_errors_1 = require("../../common/errors/sales.errors");
const sales_assertions_1 = require("../support/sales-assertions");
const get_sales_order_query_1 = require("./get-sales-order.query");
/** GetSalesOrderHandler returns one established sales order or NOT_FOUND when the target is absent. */
let GetSalesOrderHandler = class GetSalesOrderHandler {
    constructor(salesOrderRepository) {
        this.salesOrderRepository = salesOrderRepository;
    }
    async execute(query) {
        (0, sales_assertions_1.assertRequiredString)(query.tenantId, 'tenantId');
        (0, sales_assertions_1.assertRequiredString)(query.salesOrderId, 'salesOrderId');
        const order = await this.salesOrderRepository.findById(query.tenantId, query.salesOrderId);
        if (!order) {
            throw exceptions_1.ExceptionFactory.domain(sales_errors_1.SALES_NOT_FOUND, {
                salesOrderId: query.salesOrderId
            });
        }
        return order;
    }
};
exports.GetSalesOrderHandler = GetSalesOrderHandler;
exports.GetSalesOrderHandler = GetSalesOrderHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(get_sales_order_query_1.GetSalesOrderQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.SALES_ORDER_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], GetSalesOrderHandler);
//# sourceMappingURL=get-sales-order.handler.js.map