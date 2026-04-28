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
exports.UpdatePurchaseOrderDraftHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_assertions_1 = require("../support/procurement-assertions");
const procurement_write_support_1 = require("../support/procurement-write-support");
const update_purchase_order_draft_command_1 = require("./update-purchase-order-draft.command");
/** UpdatePurchaseOrderDraftHandler replaces the editable lines and references on one PO draft. */
let UpdatePurchaseOrderDraftHandler = class UpdatePurchaseOrderDraftHandler {
    constructor(purchaseOrderRepository, purchaseRequestRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
    }
    async execute(command) {
        (0, procurement_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.purchaseOrderId, 'purchaseOrderId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.supplierId, 'supplierId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.currencyCode, 'currencyCode');
        const existing = (0, procurement_assertions_1.assertExists)(await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.purchaseOrderId), 'purchase_order', command.payload.purchaseOrderId);
        (0, procurement_assertions_1.assertPrecondition)(existing.status === procurement_records_1.PurchaseOrderStatus.DRAFT, 'only DRAFT purchase orders can be updated');
        const existingLineById = new Map(existing.lines.map((line) => [line.purchaseOrderLineId, line]));
        const sourcePurchaseRequestIds = command.payload.sourcePurchaseRequestIds ?? existing.sourcePurchaseRequestIds;
        const sourcePurchaseRequestNos = await resolveSourcePurchaseRequestNos(this.purchaseRequestRepository, command.payload.tenantId, sourcePurchaseRequestIds);
        const lines = await (0, procurement_write_support_1.materializeDraftPurchaseOrderLines)({
            tenantId: command.payload.tenantId,
            lines: command.payload.lines,
            purchaseRequestRepository: this.purchaseRequestRepository,
            sourcePurchaseRequestIds,
            existingLineById
        });
        return this.purchaseOrderRepository.save({
            ...existing,
            supplierId: command.payload.supplierId.trim(),
            currencyCode: command.payload.currencyCode.trim(),
            sourcePurchaseRequestIds,
            sourcePurchaseRequestNos,
            supplierSnapshot: {
                ...existing.supplierSnapshot,
                supplierId: command.payload.supplierId.trim()
            },
            updatedAt: (0, procurement_write_support_1.nowIso)(),
            lines
        });
    }
};
exports.UpdatePurchaseOrderDraftHandler = UpdatePurchaseOrderDraftHandler;
exports.UpdatePurchaseOrderDraftHandler = UpdatePurchaseOrderDraftHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(update_purchase_order_draft_command_1.UpdatePurchaseOrderDraftCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_REQUEST_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], UpdatePurchaseOrderDraftHandler);
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
//# sourceMappingURL=update-purchase-order-draft.handler.js.map