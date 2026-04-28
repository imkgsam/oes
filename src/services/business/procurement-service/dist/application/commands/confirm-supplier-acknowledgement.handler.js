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
exports.ConfirmSupplierAcknowledgementHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_assertions_1 = require("../support/procurement-assertions");
const procurement_write_support_1 = require("../support/procurement-write-support");
const confirm_supplier_acknowledgement_command_1 = require("./confirm-supplier-acknowledgement.command");
/** ConfirmSupplierAcknowledgementHandler records the phase 1 supplier acknowledgement summary on one issued PO. */
let ConfirmSupplierAcknowledgementHandler = class ConfirmSupplierAcknowledgementHandler {
    constructor(purchaseOrderRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
    }
    async execute(command) {
        (0, procurement_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.purchaseOrderId, 'purchaseOrderId');
        const existing = (0, procurement_assertions_1.assertExists)(await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.purchaseOrderId), 'purchase_order', command.payload.purchaseOrderId);
        (0, procurement_assertions_1.assertPrecondition)(existing.status === procurement_records_1.PurchaseOrderStatus.ISSUED || existing.status === procurement_records_1.PurchaseOrderStatus.ACKNOWLEDGED, 'supplier acknowledgement requires an issued purchase order');
        return this.purchaseOrderRepository.save({
            ...existing,
            status: procurement_records_1.PurchaseOrderStatus.ACKNOWLEDGED,
            supplierAcknowledgement: {
                acknowledgementStatus: procurement_records_1.PurchaseOrderSupplierAcknowledgementStatus.ACKNOWLEDGED,
                acknowledgedAt: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.acknowledgedAt) ?? (0, procurement_write_support_1.nowIso)(),
                externalReference: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.externalReference) ?? null,
                comment: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.comment) ?? null
            },
            updatedAt: (0, procurement_write_support_1.nowIso)()
        });
    }
};
exports.ConfirmSupplierAcknowledgementHandler = ConfirmSupplierAcknowledgementHandler;
exports.ConfirmSupplierAcknowledgementHandler = ConfirmSupplierAcknowledgementHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(confirm_supplier_acknowledgement_command_1.ConfirmSupplierAcknowledgementCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ConfirmSupplierAcknowledgementHandler);
//# sourceMappingURL=confirm-supplier-acknowledgement.handler.js.map