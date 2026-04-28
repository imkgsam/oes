"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementQueryModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const get_purchase_request_handler_1 = require("../application/queries/get-purchase-request.handler");
const search_purchase_requests_handler_1 = require("../application/queries/search-purchase-requests.handler");
const get_purchase_order_handler_1 = require("../application/queries/get-purchase-order.handler");
const search_purchase_orders_handler_1 = require("../application/queries/search-purchase-orders.handler");
const list_purchase_order_changes_handler_1 = require("../application/queries/list-purchase-order-changes.handler");
const get_receiving_expectation_handler_1 = require("../application/queries/get-receiving-expectation.handler");
const search_receiving_expectations_handler_1 = require("../application/queries/search-receiving-expectations.handler");
const procurement_query_grpc_controller_1 = require("../interfaces/grpc/procurement-query.grpc.controller");
/** ProcurementQueryModule wires the phase 1 procurement query handlers and gRPC controller surface. */
let ProcurementQueryModule = class ProcurementQueryModule {
};
exports.ProcurementQueryModule = ProcurementQueryModule;
exports.ProcurementQueryModule = ProcurementQueryModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule],
        providers: [
            cqrs_2.ValidatingQueryBus,
            get_purchase_request_handler_1.GetPurchaseRequestHandler,
            search_purchase_requests_handler_1.SearchPurchaseRequestsHandler,
            get_purchase_order_handler_1.GetPurchaseOrderHandler,
            search_purchase_orders_handler_1.SearchPurchaseOrdersHandler,
            list_purchase_order_changes_handler_1.ListPurchaseOrderChangesHandler,
            get_receiving_expectation_handler_1.GetReceivingExpectationHandler,
            search_receiving_expectations_handler_1.SearchReceivingExpectationsHandler
        ],
        controllers: [procurement_query_grpc_controller_1.ProcurementQueryGrpcController]
    })
], ProcurementQueryModule);
//# sourceMappingURL=procurement-query.module.js.map