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
exports.ApplyPurchaseOrderChangeHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_assertions_1 = require("../support/procurement-assertions");
const procurement_write_support_1 = require("../support/procurement-write-support");
const apply_purchase_order_change_command_1 = require("./apply-purchase-order-change.command");
/** ApplyPurchaseOrderChangeHandler persists one applied phase 1 PO change together with the updated controlled target state. */
let ApplyPurchaseOrderChangeHandler = class ApplyPurchaseOrderChangeHandler {
    constructor(purchaseOrderRepository, purchaseRequestRepository, itemLookup, supplierLookup) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.itemLookup = itemLookup;
        this.supplierLookup = supplierLookup;
    }
    async execute(command) {
        (0, procurement_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.purchaseOrderId, 'purchaseOrderId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.changeType, 'changeType');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.changeReason, 'changeReason');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.appliedBy.operatorId, 'appliedBy.operatorId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.appliedBy.displayName, 'appliedBy.displayName');
        const existing = (0, procurement_assertions_1.assertExists)(await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.purchaseOrderId), 'purchase_order', command.payload.purchaseOrderId);
        (0, procurement_assertions_1.assertPrecondition)(existing.status === procurement_records_1.PurchaseOrderStatus.ISSUED || existing.status === procurement_records_1.PurchaseOrderStatus.ACKNOWLEDGED, 'purchase order change requires an issued purchase order');
        const existingLineById = new Map(existing.lines.map((line) => [line.purchaseOrderLineId, line]));
        const lines = command.payload.targetState.lines && command.payload.targetState.lines.length > 0
            ? await (0, procurement_write_support_1.materializeDraftPurchaseOrderLines)({
                tenantId: command.payload.tenantId,
                lines: command.payload.targetState.lines,
                itemLookup: this.itemLookup,
                purchaseRequestRepository: this.purchaseRequestRepository,
                sourcePurchaseRequestIds: existing.sourcePurchaseRequestIds,
                existingLineById
            })
            : existing.lines;
        const supplierSnapshot = await (0, procurement_write_support_1.assertIssuableSupplierSnapshot)(this.supplierLookup, command.payload.tenantId, existing.supplierId);
        const changedLines = await (0, procurement_write_support_1.assertStandardLineOfferings)(this.supplierLookup, command.payload.tenantId, existing.supplierId, lines);
        const change = (0, procurement_write_support_1.buildAppliedChange)({
            purchaseOrderId: existing.purchaseOrderId,
            changeType: command.payload.changeType,
            changeReason: command.payload.changeReason,
            appliedBy: {
                operatorId: command.payload.appliedBy.operatorId.trim(),
                displayName: command.payload.appliedBy.displayName.trim()
            },
            lineCount: changedLines.length
        });
        const updatedAt = (0, procurement_write_support_1.nowIso)();
        const purchaseOrder = await this.purchaseOrderRepository.save({
            ...existing,
            supplierSnapshot,
            lines: changedLines,
            supplierAcknowledgement: command.payload.targetState.supplierAcknowledgement
                ? {
                    acknowledgementStatus: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.targetState.supplierAcknowledgement.acknowledgementStatus) === 'ACKNOWLEDGED'
                        ? procurement_records_1.PurchaseOrderSupplierAcknowledgementStatus.ACKNOWLEDGED
                        : existing.supplierAcknowledgement.acknowledgementStatus,
                    acknowledgedAt: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.targetState.supplierAcknowledgement.acknowledgedAt) ??
                        existing.supplierAcknowledgement.acknowledgedAt ??
                        null,
                    externalReference: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.targetState.supplierAcknowledgement.externalReference) ??
                        existing.supplierAcknowledgement.externalReference ??
                        null,
                    comment: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.targetState.supplierAcknowledgement.comment) ??
                        existing.supplierAcknowledgement.comment ??
                        null
                }
                : existing.supplierAcknowledgement,
            updatedAt,
            changes: [...existing.changes, change]
        });
        return {
            purchaseOrder,
            change
        };
    }
};
exports.ApplyPurchaseOrderChangeHandler = ApplyPurchaseOrderChangeHandler;
exports.ApplyPurchaseOrderChangeHandler = ApplyPurchaseOrderChangeHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(apply_purchase_order_change_command_1.ApplyPurchaseOrderChangeCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_REQUEST_REPOSITORY)),
    __param(2, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REFERENCE_LOOKUP_PORT)),
    __param(3, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_REFERENCE_LOOKUP_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], ApplyPurchaseOrderChangeHandler);
//# sourceMappingURL=apply-purchase-order-change.handler.js.map