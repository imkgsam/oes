"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesQueryModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const get_quote_handler_1 = require("../application/queries/get-quote.handler");
const get_quote_version_handler_1 = require("../application/queries/get-quote-version.handler");
const get_sales_order_handler_1 = require("../application/queries/get-sales-order.handler");
const list_quote_versions_handler_1 = require("../application/queries/list-quote-versions.handler");
const search_quotes_handler_1 = require("../application/queries/search-quotes.handler");
const search_sales_orders_handler_1 = require("../application/queries/search-sales-orders.handler");
const sales_query_grpc_controller_1 = require("../interfaces/grpc/sales-query.grpc.controller");
/** SalesQueryModule wires the phase 1 sales query handlers and gRPC controller surface. */
let SalesQueryModule = class SalesQueryModule {
};
exports.SalesQueryModule = SalesQueryModule;
exports.SalesQueryModule = SalesQueryModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule],
        providers: [
            cqrs_2.ValidatingQueryBus,
            get_quote_handler_1.GetQuoteHandler,
            search_quotes_handler_1.SearchQuotesHandler,
            get_quote_version_handler_1.GetQuoteVersionHandler,
            list_quote_versions_handler_1.ListQuoteVersionsHandler,
            get_sales_order_handler_1.GetSalesOrderHandler,
            search_sales_orders_handler_1.SearchSalesOrdersHandler
        ],
        controllers: [sales_query_grpc_controller_1.SalesQueryGrpcController]
    })
], SalesQueryModule);
//# sourceMappingURL=sales-query.module.js.map