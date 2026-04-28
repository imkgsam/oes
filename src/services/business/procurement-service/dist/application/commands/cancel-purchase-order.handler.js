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
exports.CancelPurchaseOrderHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_assertions_1 = require("../support/procurement-assertions");
const procurement_write_support_1 = require("../support/procurement-write-support");
const cancel_purchase_order_command_1 = require("./cancel-purchase-order.command");
/** CancelPurchaseOrderHandler closes one PO only when downstream receiving expectation ownership has not started. */
let CancelPurchaseOrderHandler = class CancelPurchaseOrderHandler {
    constructor(purchaseOrderRepository, receivingRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.receivingRepository = receivingRepository;
    }
    async execute(command) {
        (0, procurement_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.purchaseOrderId, 'purchaseOrderId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.cancelReason, 'cancelReason');
        const existing = (0, procurement_assertions_1.assertExists)(await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.purchaseOrderId), 'purchase_order', command.payload.purchaseOrderId);
        (0, procurement_assertions_1.assertPrecondition)(existing.status !== procurement_records_1.PurchaseOrderStatus.CANCELLED, 'purchase order is already cancelled');
        (0, procurement_assertions_1.assertPrecondition)(!(await this.receivingRepository.existsByPurchaseOrderId(command.payload.tenantId, command.payload.purchaseOrderId)), 'purchase order cannot be cancelled after receiving expectation exists');
        const cancelledAt = (0, procurement_write_support_1.nowIso)();
        return this.purchaseOrderRepository.save({
            ...existing,
            status: procurement_records_1.PurchaseOrderStatus.CANCELLED,
            cancelReason: command.payload.cancelReason.trim(),
            cancelledAt,
            updatedAt: cancelledAt
        });
    }
};
exports.CancelPurchaseOrderHandler = CancelPurchaseOrderHandler;
exports.CancelPurchaseOrderHandler = CancelPurchaseOrderHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(cancel_purchase_order_command_1.CancelPurchaseOrderCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.RECEIVING_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], CancelPurchaseOrderHandler);
//# sourceMappingURL=cancel-purchase-order.handler.js.map