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
exports.CreateReceiptDraftHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const wms_records_1 = require("../../domain/models/wms-records");
const wms_assertions_1 = require("../support/wms-assertions");
const wms_write_support_1 = require("../support/wms-write-support");
const create_receipt_draft_command_1 = require("./create-receipt-draft.command");
/** CreateReceiptDraftHandler creates one WMS receipt draft header without posting any inventory truth. */
let CreateReceiptDraftHandler = class CreateReceiptDraftHandler {
    constructor(receiptRepository) {
        this.receiptRepository = receiptRepository;
    }
    async execute(command) {
        (0, wms_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, wms_assertions_1.assertRequiredString)(command.payload.warehouseId, 'warehouseId');
        const createdAt = (0, wms_write_support_1.nowIso)();
        return this.receiptRepository.save({
            receiptId: (0, node_crypto_1.randomUUID)(),
            receiptNo: await this.receiptRepository.nextReceiptNo(command.payload.tenantId),
            tenantId: command.payload.tenantId,
            orgId: (0, wms_assertions_1.normalizeOptionalString)(command.payload.orgId) ?? null,
            warehouseId: command.payload.warehouseId,
            status: wms_records_1.ReceiptStatus.DRAFT,
            receiptSourceType: (0, wms_assertions_1.assertKnownReceiptSourceType)(command.payload.receiptSourceType),
            referencedReceivingExpectationIds: Array.from(new Set(command.payload.referencedReceivingExpectationIds.map((value) => value.trim()).filter(Boolean))),
            receiptDate: (0, wms_assertions_1.normalizeOptionalString)(command.payload.receiptDate) ?? createdAt.slice(0, 10),
            note: (0, wms_assertions_1.normalizeOptionalString)(command.payload.note) ?? null,
            attachmentRefs: command.payload.attachmentRefs.map((value) => value.trim()).filter(Boolean),
            lineCount: 0,
            postedAt: null,
            cancelledAt: null,
            cancelReason: null,
            postComment: null,
            procurementReceiptSummary: null,
            createdAt,
            updatedAt: createdAt,
            lines: []
        });
    }
};
exports.CreateReceiptDraftHandler = CreateReceiptDraftHandler;
exports.CreateReceiptDraftHandler = CreateReceiptDraftHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(create_receipt_draft_command_1.CreateReceiptDraftCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.RECEIPT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], CreateReceiptDraftHandler);
//# sourceMappingURL=create-receipt-draft.handler.js.map