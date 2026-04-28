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
exports.ConvertPurchaseRequestToPurchaseOrderHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_assertions_1 = require("../support/procurement-assertions");
const procurement_write_support_1 = require("../support/procurement-write-support");
const convert_purchase_request_to_purchase_order_command_1 = require("./convert-purchase-request-to-purchase-order.command");
/** ConvertPurchaseRequestToPurchaseOrderHandler turns one approved PR into a phase 1 PO draft under frozen supplier-item gates. */
let ConvertPurchaseRequestToPurchaseOrderHandler = class ConvertPurchaseRequestToPurchaseOrderHandler {
    constructor(purchaseRequestRepository, purchaseOrderRepository, itemLookup, supplierLookup) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.itemLookup = itemLookup;
        this.supplierLookup = supplierLookup;
    }
    async execute(command) {
        (0, procurement_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.purchaseRequestId, 'purchaseRequestId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.supplierId, 'supplierId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.currencyCode, 'currencyCode');
        (0, procurement_assertions_1.assertPrecondition)(command.payload.selectedLines.length > 0, 'at least one purchase request line must be selected');
        const purchaseRequest = (0, procurement_assertions_1.assertExists)(await this.purchaseRequestRepository.findById(command.payload.tenantId, command.payload.purchaseRequestId), 'purchase_request', command.payload.purchaseRequestId);
        assertApprovedPurchaseRequest(purchaseRequest);
        const selectedLineIds = new Set(command.payload.selectedLines.map((selection) => selection.purchaseRequestLineId));
        const selectedRequestLines = purchaseRequest.lines.filter((line) => selectedLineIds.has(line.purchaseRequestLineId));
        (0, procurement_assertions_1.assertPrecondition)(selectedRequestLines.length === command.payload.selectedLines.length, 'selected purchase request line was not found');
        const supplierSnapshot = await (0, procurement_write_support_1.assertIssuableSupplierSnapshot)(this.supplierLookup, command.payload.tenantId, command.payload.supplierId);
        const lines = await (0, procurement_write_support_1.buildConvertedPurchaseOrderLines)({
            tenantId: command.payload.tenantId,
            supplierId: command.payload.supplierId,
            purchaseRequestLines: selectedRequestLines,
            selections: command.payload.selectedLines,
            itemLookup: this.itemLookup,
            supplierLookup: this.supplierLookup
        });
        const createdAt = (0, procurement_write_support_1.nowIso)();
        const purchaseOrder = {
            purchaseOrderId: (0, node_crypto_1.randomUUID)(),
            orderNo: await this.purchaseOrderRepository.nextOrderNo(command.payload.tenantId),
            tenantId: command.payload.tenantId,
            orgId: purchaseRequest.orgId ?? null,
            status: procurement_records_1.PurchaseOrderStatus.DRAFT,
            currencyCode: command.payload.currencyCode.trim(),
            supplierId: command.payload.supplierId.trim(),
            supplierSnapshot,
            sourcePurchaseRequestIds: [purchaseRequest.purchaseRequestId],
            sourcePurchaseRequestNos: [purchaseRequest.requestNo],
            supplierAcknowledgement: (0, procurement_write_support_1.buildSupplierAcknowledgement)(),
            issueComment: null,
            cancelReason: null,
            createdAt,
            updatedAt: createdAt,
            issuedAt: null,
            cancelledAt: null,
            lines,
            changes: []
        };
        return this.purchaseOrderRepository.save(purchaseOrder);
    }
};
exports.ConvertPurchaseRequestToPurchaseOrderHandler = ConvertPurchaseRequestToPurchaseOrderHandler;
exports.ConvertPurchaseRequestToPurchaseOrderHandler = ConvertPurchaseRequestToPurchaseOrderHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(convert_purchase_request_to_purchase_order_command_1.ConvertPurchaseRequestToPurchaseOrderCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_REQUEST_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY)),
    __param(2, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REFERENCE_LOOKUP_PORT)),
    __param(3, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_REFERENCE_LOOKUP_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], ConvertPurchaseRequestToPurchaseOrderHandler);
function assertApprovedPurchaseRequest(purchaseRequest) {
    (0, procurement_assertions_1.assertPrecondition)(purchaseRequest.status === procurement_records_1.PurchaseRequestStatus.APPROVED, 'purchase request must be APPROVED before conversion');
}
//# sourceMappingURL=convert-purchase-request-to-purchase-order.handler.js.map