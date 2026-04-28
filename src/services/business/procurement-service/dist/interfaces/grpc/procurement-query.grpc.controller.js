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
exports.ProcurementQueryGrpcController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@oes/common/cqrs");
const filters_1 = require("@oes/common/filters");
const procurement_service_1 = require("@oes/common/generated/procurement_service");
const get_purchase_request_query_1 = require("../../application/queries/get-purchase-request.query");
const search_purchase_requests_query_1 = require("../../application/queries/search-purchase-requests.query");
const get_purchase_order_query_1 = require("../../application/queries/get-purchase-order.query");
const search_purchase_orders_query_1 = require("../../application/queries/search-purchase-orders.query");
const list_purchase_order_changes_query_1 = require("../../application/queries/list-purchase-order-changes.query");
const get_receiving_expectation_query_1 = require("../../application/queries/get-receiving-expectation.query");
const search_receiving_expectations_query_1 = require("../../application/queries/search-receiving-expectations.query");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_grpc_presenter_1 = require("./procurement-grpc.presenter");
const procurement_rpc_context_validator_1 = require("./procurement-rpc-context.validator");
/** ProcurementQueryGrpcController exposes the phase 1 read-only procurement query contract. */
let ProcurementQueryGrpcController = class ProcurementQueryGrpcController {
    constructor(queryBus) {
        this.queryBus = queryBus;
    }
    async getPurchaseRequest(request) {
        procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertQueryContext(request);
        return procurement_grpc_presenter_1.ProcurementGrpcPresenter.toGetPurchaseRequestResponse(await this.queryBus.execute(new get_purchase_request_query_1.GetPurchaseRequestQuery(request.tenantId ?? '', request.purchaseRequestId ?? '')));
    }
    async searchPurchaseRequests(request) {
        procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertQueryContext(request);
        return procurement_grpc_presenter_1.ProcurementGrpcPresenter.toSearchPurchaseRequestsResponse(await this.queryBus.execute(new search_purchase_requests_query_1.SearchPurchaseRequestsQuery({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            keyword: request.keyword ?? undefined,
            requestType: toDomainPurchaseRequestType(request.requestType),
            status: toDomainPurchaseRequestStatus(request.status),
            requesterOperatorId: request.requesterOperatorId ?? undefined,
            itemId: request.itemId ?? undefined,
            neededByDateFrom: request.neededByDateFrom ?? undefined,
            neededByDateTo: request.neededByDateTo ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        })));
    }
    async getPurchaseOrder(request) {
        procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertQueryContext(request);
        return procurement_grpc_presenter_1.ProcurementGrpcPresenter.toGetPurchaseOrderResponse(await this.queryBus.execute(new get_purchase_order_query_1.GetPurchaseOrderQuery(request.tenantId ?? '', request.purchaseOrderId ?? '')));
    }
    async searchPurchaseOrders(request) {
        procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertQueryContext(request);
        return procurement_grpc_presenter_1.ProcurementGrpcPresenter.toSearchPurchaseOrdersResponse(await this.queryBus.execute(new search_purchase_orders_query_1.SearchPurchaseOrdersQuery({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            keyword: request.keyword ?? undefined,
            status: toDomainPurchaseOrderStatus(request.status),
            supplierId: request.supplierId ?? undefined,
            itemId: request.itemId ?? undefined,
            requestNo: request.requestNo ?? undefined,
            issuedFrom: request.issuedFrom ?? undefined,
            issuedTo: request.issuedTo ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        })));
    }
    async listPurchaseOrderChanges(request) {
        procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertQueryContext(request);
        return procurement_grpc_presenter_1.ProcurementGrpcPresenter.toListPurchaseOrderChangesResponse(await this.queryBus.execute(new list_purchase_order_changes_query_1.ListPurchaseOrderChangesQuery({
            tenantId: request.tenantId ?? '',
            purchaseOrderId: request.purchaseOrderId ?? '',
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        })));
    }
    async getReceivingExpectation(request) {
        procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertQueryContext(request);
        return procurement_grpc_presenter_1.ProcurementGrpcPresenter.toGetReceivingExpectationResponse(await this.queryBus.execute(new get_receiving_expectation_query_1.GetReceivingExpectationQuery(request.tenantId ?? '', request.receivingExpectationId ?? '')));
    }
    async searchReceivingExpectations(request) {
        procurement_rpc_context_validator_1.ProcurementRpcContextValidator.assertQueryContext(request);
        return procurement_grpc_presenter_1.ProcurementGrpcPresenter.toSearchReceivingExpectationsResponse(await this.queryBus.execute(new search_receiving_expectations_query_1.SearchReceivingExpectationsQuery({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            purchaseOrderId: request.purchaseOrderId ?? undefined,
            supplierId: request.supplierId ?? undefined,
            status: toDomainReceivingExpectationStatus(request.status),
            hasOpenDiscrepancy: request.hasOpenDiscrepancy ?? undefined,
            expectedReceiptDateFrom: request.expectedReceiptDateFrom ?? undefined,
            expectedReceiptDateTo: request.expectedReceiptDateTo ?? undefined,
            page: request.page ?? undefined,
            pageSize: request.pageSize ?? undefined
        })));
    }
};
exports.ProcurementQueryGrpcController = ProcurementQueryGrpcController;
exports.ProcurementQueryGrpcController = ProcurementQueryGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.Controller)(),
    (0, procurement_service_1.PurchaseRequestQueryServiceControllerMethods)(),
    (0, procurement_service_1.PurchaseOrderQueryServiceControllerMethods)(),
    (0, procurement_service_1.ReceivingExpectationQueryServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingQueryBus])
], ProcurementQueryGrpcController);
function toDomainPurchaseRequestType(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    switch (value) {
        case procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_SALES_DEDICATED:
            return procurement_records_1.PurchaseRequestType.SALES_DEDICATED;
        case procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_PRODUCTION_PACKAGING:
            return procurement_records_1.PurchaseRequestType.PRODUCTION_PACKAGING;
        case procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_MAINTENANCE:
            return procurement_records_1.PurchaseRequestType.MAINTENANCE;
        case procurement_service_1.PurchaseRequestType.PURCHASE_REQUEST_TYPE_SAMPLE:
            return procurement_records_1.PurchaseRequestType.SAMPLE;
        default:
            return procurement_records_1.PurchaseRequestType.DEPARTMENTAL;
    }
}
function toDomainPurchaseRequestStatus(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    switch (value) {
        case procurement_service_1.PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_SUBMITTED:
            return procurement_records_1.PurchaseRequestStatus.SUBMITTED;
        case procurement_service_1.PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_APPROVED:
            return procurement_records_1.PurchaseRequestStatus.APPROVED;
        case procurement_service_1.PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_REJECTED:
            return procurement_records_1.PurchaseRequestStatus.REJECTED;
        case procurement_service_1.PurchaseRequestStatus.PURCHASE_REQUEST_STATUS_CANCELLED:
            return procurement_records_1.PurchaseRequestStatus.CANCELLED;
        default:
            return procurement_records_1.PurchaseRequestStatus.DRAFT;
    }
}
function toDomainPurchaseOrderStatus(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    switch (value) {
        case procurement_service_1.PurchaseOrderStatus.PURCHASE_ORDER_STATUS_ISSUED:
            return procurement_records_1.PurchaseOrderStatus.ISSUED;
        case procurement_service_1.PurchaseOrderStatus.PURCHASE_ORDER_STATUS_ACKNOWLEDGED:
            return procurement_records_1.PurchaseOrderStatus.ACKNOWLEDGED;
        case procurement_service_1.PurchaseOrderStatus.PURCHASE_ORDER_STATUS_CANCELLED:
            return procurement_records_1.PurchaseOrderStatus.CANCELLED;
        default:
            return procurement_records_1.PurchaseOrderStatus.DRAFT;
    }
}
function toDomainReceivingExpectationStatus(value) {
    if (value === undefined || value === 0) {
        return undefined;
    }
    switch (value) {
        case procurement_service_1.ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_PARTIALLY_RECEIVED:
            return procurement_records_1.ReceivingExpectationStatus.PARTIALLY_RECEIVED;
        case procurement_service_1.ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_COMPLETED:
            return procurement_records_1.ReceivingExpectationStatus.COMPLETED;
        case procurement_service_1.ReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_CANCELLED:
            return procurement_records_1.ReceivingExpectationStatus.CANCELLED;
        default:
            return procurement_records_1.ReceivingExpectationStatus.OPEN;
    }
}
//# sourceMappingURL=procurement-query.grpc.controller.js.map