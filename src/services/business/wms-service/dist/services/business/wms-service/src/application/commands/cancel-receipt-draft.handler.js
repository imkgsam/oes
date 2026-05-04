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
exports.CancelReceiptDraftHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const wms_records_1 = require("../../domain/models/wms-records");
const wms_assertions_1 = require("../support/wms-assertions");
const wms_write_support_1 = require("../support/wms-write-support");
const cancel_receipt_draft_command_1 = require("./cancel-receipt-draft.command");
/** CancelReceiptDraftHandler closes a draft receipt without touching immutable ledger or inventory truth. */
let CancelReceiptDraftHandler = class CancelReceiptDraftHandler {
    receiptRepository;
    constructor(receiptRepository) {
        this.receiptRepository = receiptRepository;
    }
    async execute(command) {
        (0, wms_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, wms_assertions_1.assertRequiredString)(command.payload.receiptId, 'receiptId');
        (0, wms_assertions_1.assertRequiredString)(command.payload.cancelReason, 'cancelReason');
        const receipt = (0, wms_assertions_1.assertExists)(await this.receiptRepository.findById(command.payload.tenantId, command.payload.receiptId), 'receipt', command.payload.receiptId);
        (0, wms_assertions_1.assertPrecondition)(receipt.status === wms_records_1.ReceiptStatus.DRAFT, 'only draft receipts can be cancelled');
        const cancelledAt = (0, wms_write_support_1.nowIso)();
        return this.receiptRepository.save({
            ...receipt,
            status: wms_records_1.ReceiptStatus.CANCELLED,
            cancelReason: command.payload.cancelReason.trim(),
            cancelledAt,
            updatedAt: cancelledAt
        });
    }
};
exports.CancelReceiptDraftHandler = CancelReceiptDraftHandler;
exports.CancelReceiptDraftHandler = CancelReceiptDraftHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(cancel_receipt_draft_command_1.CancelReceiptDraftCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.RECEIPT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], CancelReceiptDraftHandler);
//# sourceMappingURL=cancel-receipt-draft.handler.js.map