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
exports.SalesQueryGrpcController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@oes/common/cqrs");
const filters_1 = require("@oes/common/filters");
const sales_service_1 = require("@oes/common/generated/sales_service");
const get_quote_query_1 = require("../../application/queries/get-quote.query");
const search_quotes_query_1 = require("../../application/queries/search-quotes.query");
const get_quote_version_query_1 = require("../../application/queries/get-quote-version.query");
const list_quote_versions_query_1 = require("../../application/queries/list-quote-versions.query");
const get_sales_order_query_1 = require("../../application/queries/get-sales-order.query");
const search_sales_orders_query_1 = require("../../application/queries/search-sales-orders.query");
const sales_records_1 = require("../../domain/models/sales-records");
const sales_grpc_presenter_1 = require("./sales-grpc.presenter");
const sales_rpc_context_validator_1 = require("./sales-rpc-context.validator");
/** SalesQueryGrpcController exposes the phase 1 read-only sales query contract. */
let SalesQueryGrpcController = class SalesQueryGrpcController {
    constructor(queryBus) {
        this.queryBus = queryBus;
    }
    async getQuote(request) {
        sales_rpc_context_validator_1.SalesRpcContextValidator.assertQueryContext(request);
        const quote = await this.queryBus.execute(new get_quote_query_1.GetQuoteQuery(request.tenantId ?? '', request.quoteId ?? ''));
        return sales_grpc_presenter_1.SalesGrpcPresenter.toGetQuoteResponse(quote);
    }
    async searchQuotes(request) {
        sales_rpc_context_validator_1.SalesRpcContextValidator.assertQueryContext(request);
        const result = await this.queryBus.execute(new search_quotes_query_1.SearchQuotesQuery({
            tenantId: request.tenantId ?? '',
            keyword: request.keyword ?? undefined,
            customerTenantPartyId: request.customerTenantPartyId ?? undefined,
            status: toDomainQuoteStatus(request.status),
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        }));
        return sales_grpc_presenter_1.SalesGrpcPresenter.toSearchQuotesResponse(result);
    }
    async getQuoteVersion(request) {
        sales_rpc_context_validator_1.SalesRpcContextValidator.assertQueryContext(request);
        const quoteVersion = await this.queryBus.execute(new get_quote_version_query_1.GetQuoteVersionQuery(request.tenantId ?? '', request.quoteVersionId ?? ''));
        return sales_grpc_presenter_1.SalesGrpcPresenter.toGetQuoteVersionResponse(quoteVersion);
    }
    async listQuoteVersions(request) {
        sales_rpc_context_validator_1.SalesRpcContextValidator.assertQueryContext(request);
        const result = await this.queryBus.execute(new list_quote_versions_query_1.ListQuoteVersionsQuery({
            tenantId: request.tenantId ?? '',
            quoteId: request.quoteId ?? '',
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        }));
        return sales_grpc_presenter_1.SalesGrpcPresenter.toListQuoteVersionsResponse(result);
    }
    async getSalesOrder(request) {
        sales_rpc_context_validator_1.SalesRpcContextValidator.assertQueryContext(request);
        const order = await this.queryBus.execute(new get_sales_order_query_1.GetSalesOrderQuery(request.tenantId ?? '', request.salesOrderId ?? ''));
        return sales_grpc_presenter_1.SalesGrpcPresenter.toGetSalesOrderResponse(order);
    }
    async searchSalesOrders(request) {
        sales_rpc_context_validator_1.SalesRpcContextValidator.assertQueryContext(request);
        const input = {
            tenantId: request.tenantId ?? '',
            keyword: request.keyword ?? undefined,
            customerTenantPartyId: request.customerTenantPartyId ?? undefined,
            quoteVersionId: request.quoteVersionId ?? undefined,
            productionGate: request.productionGate,
            stockingGate: request.stockingGate,
            shippingGate: request.shippingGate,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        };
        const result = await this.queryBus.execute(new search_sales_orders_query_1.SearchSalesOrdersQuery(input));
        return sales_grpc_presenter_1.SalesGrpcPresenter.toSearchSalesOrdersResponse(result);
    }
};
exports.SalesQueryGrpcController = SalesQueryGrpcController;
exports.SalesQueryGrpcController = SalesQueryGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.Controller)(),
    (0, sales_service_1.SalesQueryServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingQueryBus])
], SalesQueryGrpcController);
/** toDomainQuoteStatus maps the generated enum filter into the minimal domain quote search filter. */
function toDomainQuoteStatus(value) {
    if (value === 1) {
        return sales_records_1.SalesQuoteStatus.DRAFT;
    }
    if (value === 2) {
        return sales_records_1.SalesQuoteStatus.PUBLISHED;
    }
    return undefined;
}
//# sourceMappingURL=sales-query.grpc.controller.js.map