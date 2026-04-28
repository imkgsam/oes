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
exports.CreatePurchaseOrderDraftHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_assertions_1 = require("../support/procurement-assertions");
const procurement_write_support_1 = require("../support/procurement-write-support");
const create_purchase_order_draft_command_1 = require("./create-purchase-order-draft.command");
/** CreatePurchaseOrderDraftHandler creates one editable PO draft without making it a formal supplier commitment. */
let CreatePurchaseOrderDraftHandler = class CreatePurchaseOrderDraftHandler {
    constructor(purchaseOrderRepository, purchaseRequestRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
    }
    async execute(command) {
        (0, procurement_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.supplierId, 'supplierId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.currencyCode, 'currencyCode');
        const createdAt = (0, procurement_write_support_1.nowIso)();
        const sourcePurchaseRequestNos = await resolveSourcePurchaseRequestNos(this.purchaseRequestRepository, command.payload.tenantId, command.payload.sourcePurchaseRequestIds ?? []);
        const lines = await (0, procurement_write_support_1.materializeDraftPurchaseOrderLines)({
            tenantId: command.payload.tenantId,
            lines: command.payload.lines ?? [],
            purchaseRequestRepository: this.purchaseRequestRepository,
            sourcePurchaseRequestIds: command.payload.sourcePurchaseRequestIds ?? []
        });
        return this.purchaseOrderRepository.save({
            purchaseOrderId: (0, node_crypto_1.randomUUID)(),
            orderNo: await this.purchaseOrderRepository.nextOrderNo(command.payload.tenantId),
            tenantId: command.payload.tenantId,
            orgId: command.payload.orgId ?? null,
            status: procurement_records_1.PurchaseOrderStatus.DRAFT,
            currencyCode: command.payload.currencyCode.trim(),
            supplierId: command.payload.supplierId.trim(),
            supplierSnapshot: (0, procurement_write_support_1.buildDraftSupplierSnapshot)(command.payload.supplierId.trim()),
            sourcePurchaseRequestIds: command.payload.sourcePurchaseRequestIds ?? [],
            sourcePurchaseRequestNos,
            supplierAcknowledgement: (0, procurement_write_support_1.buildSupplierAcknowledgement)(),
            issueComment: null,
            cancelReason: null,
            createdAt,
            updatedAt: createdAt,
            issuedAt: null,
            cancelledAt: null,
            lines,
            changes: []
        });
    }
};
exports.CreatePurchaseOrderDraftHandler = CreatePurchaseOrderDraftHandler;
exports.CreatePurchaseOrderDraftHandler = CreatePurchaseOrderDraftHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(create_purchase_order_draft_command_1.CreatePurchaseOrderDraftCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_REQUEST_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], CreatePurchaseOrderDraftHandler);
async function resolveSourcePurchaseRequestNos(purchaseRequestRepository, tenantId, sourcePurchaseRequestIds) {
    const requestNos = [];
    for (const purchaseRequestId of sourcePurchaseRequestIds) {
        const purchaseRequest = await purchaseRequestRepository.findById(tenantId, purchaseRequestId);
        if (purchaseRequest) {
            requestNos.push(purchaseRequest.requestNo);
        }
    }
    return requestNos;
}
//# sourceMappingURL=create-purchase-order-draft.handler.js.map