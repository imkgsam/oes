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
        (0, procurement_assertions_1.assertPrecondition)(command.payload.sourceLines.length > 0, 'at least one purchase request line must be selected');
        const existingDraft = command.payload.targetPurchaseOrderId
            ? (0, procurement_assertions_1.assertExists)(await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.targetPurchaseOrderId), 'purchase_order', command.payload.targetPurchaseOrderId)
            : null;
        if (existingDraft) {
            (0, procurement_assertions_1.assertPrecondition)(existingDraft.status === procurement_records_1.PurchaseOrderStatus.DRAFT, 'target purchase order must be DRAFT');
        }
        const groupedSelections = new Map();
        for (const selection of command.payload.sourceLines) {
            (0, procurement_assertions_1.assertRequiredString)(selection.purchaseRequestId, 'sourceLines.purchaseRequestId');
            (0, procurement_assertions_1.assertRequiredString)(selection.purchaseRequestLineId, 'sourceLines.purchaseRequestLineId');
            const current = groupedSelections.get(selection.purchaseRequestId) ?? [];
            current.push(selection);
            groupedSelections.set(selection.purchaseRequestId, current);
        }
        const sourcePurchaseRequests = [];
        for (const purchaseRequestId of groupedSelections.keys()) {
            const purchaseRequest = (0, procurement_assertions_1.assertExists)(await this.purchaseRequestRepository.findById(command.payload.tenantId, purchaseRequestId), 'purchase_request', purchaseRequestId);
            assertApprovedPurchaseRequest(purchaseRequest);
            sourcePurchaseRequests.push(purchaseRequest);
        }
        const supplierId = existingDraft?.supplierId ?? command.payload.supplierId ?? '';
        const currencyCode = existingDraft?.currencyCode ?? command.payload.currencyCode ?? '';
        (0, procurement_assertions_1.assertRequiredString)(supplierId, 'supplierId');
        (0, procurement_assertions_1.assertRequiredString)(currencyCode, 'currencyCode');
        const supplierSnapshot = await (0, procurement_write_support_1.assertIssuableSupplierSnapshot)(this.supplierLookup, command.payload.tenantId, supplierId);
        const convertedLines = (await Promise.all(sourcePurchaseRequests.map(async (purchaseRequest) => {
            const selections = groupedSelections.get(purchaseRequest.purchaseRequestId) ?? [];
            const selectedLineIds = new Set(selections.map((selection) => selection.purchaseRequestLineId));
            const selectedRequestLines = purchaseRequest.lines.filter((line) => selectedLineIds.has(line.purchaseRequestLineId));
            (0, procurement_assertions_1.assertPrecondition)(selectedRequestLines.length === selections.length, 'selected purchase request line was not found');
            return (0, procurement_write_support_1.buildConvertedPurchaseOrderLines)({
                tenantId: command.payload.tenantId,
                supplierId,
                purchaseRequestLines: selectedRequestLines,
                selections,
                itemLookup: this.itemLookup,
                supplierLookup: this.supplierLookup
            });
        }))).flat();
        const createdAt = (0, procurement_write_support_1.nowIso)();
        const existingSourceIds = existingDraft?.sourcePurchaseRequestIds ?? [];
        const existingSourceNos = existingDraft?.sourcePurchaseRequestNos ?? [];
        const nextSourceIds = [...new Set([...existingSourceIds, ...sourcePurchaseRequests.map((request) => request.purchaseRequestId)])];
        const nextSourceNos = [
            ...new Set([...existingSourceNos, ...sourcePurchaseRequests.map((request) => request.requestNo)])
        ];
        const purchaseOrder = existingDraft
            ? {
                ...existingDraft,
                orgId: existingDraft.orgId ?? sourcePurchaseRequests[0]?.orgId ?? null,
                currencyCode: currencyCode.trim(),
                supplierId: supplierId.trim(),
                supplierSnapshot,
                paymentTermsSnapshot: (0, procurement_write_support_1.normalizePaymentTermsSnapshot)(command.payload.paymentTermsSnapshot) ??
                    existingDraft.paymentTermsSnapshot ??
                    null,
                supplierCommercialTermsSnapshot: (0, procurement_write_support_1.normalizeCommercialTermsSnapshot)(command.payload.supplierCommercialTermsSnapshot) ??
                    existingDraft.supplierCommercialTermsSnapshot ??
                    null,
                sourcePurchaseRequestIds: nextSourceIds,
                sourcePurchaseRequestNos: nextSourceNos,
                updatedAt: createdAt,
                lines: [...existingDraft.lines, ...renumberLines(existingDraft.lines.length, convertedLines)]
            }
            : {
                purchaseOrderId: (0, node_crypto_1.randomUUID)(),
                orderNo: await this.purchaseOrderRepository.nextOrderNo(command.payload.tenantId),
                tenantId: command.payload.tenantId,
                orgId: sourcePurchaseRequests[0]?.orgId ?? null,
                status: procurement_records_1.PurchaseOrderStatus.DRAFT,
                currencyCode: currencyCode.trim(),
                supplierId: supplierId.trim(),
                supplierSnapshot,
                paymentTermsSnapshot: (0, procurement_write_support_1.normalizePaymentTermsSnapshot)(command.payload.paymentTermsSnapshot),
                supplierCommercialTermsSnapshot: (0, procurement_write_support_1.normalizeCommercialTermsSnapshot)(command.payload.supplierCommercialTermsSnapshot),
                paymentSummary: null,
                sourcePurchaseRequestIds: nextSourceIds,
                sourcePurchaseRequestNos: nextSourceNos,
                supplierAcknowledgement: (0, procurement_write_support_1.buildSupplierAcknowledgement)(),
                issueComment: null,
                cancelReason: null,
                createdAt,
                updatedAt: createdAt,
                issuedAt: null,
                cancelledAt: null,
                lines: renumberLines(0, convertedLines),
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
    (0, procurement_assertions_1.assertPrecondition)(purchaseRequest.status === procurement_records_1.PurchaseRequestStatus.APPROVED ||
        purchaseRequest.status === procurement_records_1.PurchaseRequestStatus.PARTIALLY_CONVERTED, 'purchase request must be APPROVED or PARTIALLY_CONVERTED before conversion');
}
function renumberLines(startLineNo, lines) {
    return lines.map((line, index) => ({
        ...line,
        lineNo: startLineNo + index + 1
    }));
}
//# sourceMappingURL=convert-purchase-request-to-purchase-order.handler.js.map