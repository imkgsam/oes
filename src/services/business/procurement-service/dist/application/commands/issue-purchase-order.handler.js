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
exports.IssuePurchaseOrderHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const procurement_records_1 = require("../../domain/models/procurement-records");
const procurement_assertions_1 = require("../support/procurement-assertions");
const procurement_write_support_1 = require("../support/procurement-write-support");
const issue_purchase_order_command_1 = require("./issue-purchase-order.command");
/** IssuePurchaseOrderHandler turns one PO draft into a formal phase 1 procurement commitment under current reference truth. */
let IssuePurchaseOrderHandler = class IssuePurchaseOrderHandler {
    constructor(purchaseOrderRepository, purchaseRequestRepository, itemLookup, supplierLookup) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.itemLookup = itemLookup;
        this.supplierLookup = supplierLookup;
    }
    async execute(command) {
        (0, procurement_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, procurement_assertions_1.assertRequiredString)(command.payload.purchaseOrderId, 'purchaseOrderId');
        const existing = (0, procurement_assertions_1.assertExists)(await this.purchaseOrderRepository.findById(command.payload.tenantId, command.payload.purchaseOrderId), 'purchase_order', command.payload.purchaseOrderId);
        (0, procurement_assertions_1.assertPrecondition)(existing.status === procurement_records_1.PurchaseOrderStatus.DRAFT, 'only DRAFT purchase orders can be issued');
        for (const line of existing.lines) {
            if (line.lineType === procurement_records_1.PurchaseRequestLineType.STANDARD_ITEM) {
                const item = (0, procurement_assertions_1.assertExists)(await this.itemLookup.getItemById(command.payload.tenantId, line.itemId ?? ''), 'item', line.itemId ?? '');
                (0, procurement_assertions_1.assertPrecondition)(item.purchasable, 'standard item must remain purchasable before issue', {
                    itemId: line.itemId ?? ''
                });
                line.itemCode = item.itemCode;
                line.itemName = item.itemName;
            }
        }
        const supplierSnapshot = await (0, procurement_write_support_1.assertIssuableSupplierSnapshot)(this.supplierLookup, command.payload.tenantId, existing.supplierId);
        const lines = await (0, procurement_write_support_1.assertStandardLineOfferings)(this.supplierLookup, command.payload.tenantId, existing.supplierId, existing.lines);
        const issuedAt = (0, procurement_write_support_1.nowIso)();
        return this.purchaseOrderRepository.save({
            ...existing,
            status: procurement_records_1.PurchaseOrderStatus.ISSUED,
            supplierSnapshot,
            lines,
            issueComment: (0, procurement_assertions_1.normalizeOptionalString)(command.payload.issueComment) ?? existing.issueComment ?? null,
            issuedAt,
            updatedAt: issuedAt
        });
    }
};
exports.IssuePurchaseOrderHandler = IssuePurchaseOrderHandler;
exports.IssuePurchaseOrderHandler = IssuePurchaseOrderHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(issue_purchase_order_command_1.IssuePurchaseOrderCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_ORDER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.PURCHASE_REQUEST_REPOSITORY)),
    __param(2, (0, common_1.Inject)(tokens_1.TOKENS.ITEM_REFERENCE_LOOKUP_PORT)),
    __param(3, (0, common_1.Inject)(tokens_1.TOKENS.SUPPLIER_REFERENCE_LOOKUP_PORT)),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], IssuePurchaseOrderHandler);
//# sourceMappingURL=issue-purchase-order.handler.js.map