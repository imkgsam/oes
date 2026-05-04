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
exports.AddOrReplaceReceiptLinesHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const wms_records_1 = require("../../domain/models/wms-records");
const wms_assertions_1 = require("../support/wms-assertions");
const wms_write_support_1 = require("../support/wms-write-support");
const add_or_replace_receipt_lines_command_1 = require("./add-or-replace-receipt-lines.command");
/** AddOrReplaceReceiptLinesHandler rewrites the full line set of a draft receipt without posting inventory truth. */
let AddOrReplaceReceiptLinesHandler = class AddOrReplaceReceiptLinesHandler {
    constructor(receiptRepository) {
        this.receiptRepository = receiptRepository;
    }
    async execute(command) {
        (0, wms_assertions_1.assertRequiredString)(command.payload.tenantId, 'tenantId');
        (0, wms_assertions_1.assertRequiredString)(command.payload.receiptId, 'receiptId');
        const receipt = (0, wms_assertions_1.assertExists)(await this.receiptRepository.findById(command.payload.tenantId, command.payload.receiptId), 'receipt', command.payload.receiptId);
        (0, wms_assertions_1.assertPrecondition)(receipt.status === wms_records_1.ReceiptStatus.DRAFT, 'receipt must be draft before editing lines');
        const updatedAt = (0, wms_write_support_1.nowIso)();
        const existingById = new Map(receipt.lines.map((line) => [line.receiptLineId, line]));
        const nextLines = command.payload.lines.map((line, index) => this.buildLine(receipt, existingById, line, index + 1, updatedAt));
        return this.receiptRepository.save({
            ...receipt,
            lineCount: nextLines.length,
            updatedAt,
            lines: nextLines
        });
    }
    buildLine(receipt, existingById, line, lineNo, updatedAt) {
        (0, wms_assertions_1.assertRequiredString)(line.itemId, `lines[${lineNo - 1}].itemId`);
        (0, wms_assertions_1.assertRequiredString)(line.targetLocationId, `lines[${lineNo - 1}].targetLocationId`);
        (0, wms_assertions_1.assertRequiredString)(line.uom, `lines[${lineNo - 1}].uom`);
        const inventoryStatus = (0, wms_assertions_1.assertKnownInventoryStatus)(line.inventoryStatus);
        if (inventoryStatus === wms_records_1.InventoryStatus.RESTRICTED) {
            (0, wms_assertions_1.assertPrecondition)(Boolean(line.restrictedReason), 'restricted inventory requires restricted reason', {
                lineNo
            });
            (0, wms_assertions_1.assertKnownRestrictedReasonCode)(line.restrictedReason.reasonCode);
        }
        else {
            (0, wms_assertions_1.assertPrecondition)(!line.restrictedReason, 'available inventory cannot carry restricted reason', {
                lineNo
            });
        }
        for (const trackingRef of line.trackingRefs) {
            (0, wms_assertions_1.assertKnownTrackingRefType)(trackingRef.trackingRefType);
            (0, wms_assertions_1.assertRequiredString)(trackingRef.trackingRefValue, `lines[${lineNo - 1}].trackingRefs.value`);
        }
        if (line.physicalDiscrepancy) {
            (0, wms_assertions_1.assertKnownPhysicalDiscrepancyType)(line.physicalDiscrepancy.discrepancyType);
            if ((0, wms_assertions_1.normalizeOptionalString)(line.physicalDiscrepancy.discrepancyQuantity)) {
                (0, wms_assertions_1.assertPositiveQuantity)(line.physicalDiscrepancy.discrepancyQuantity, `lines[${lineNo - 1}].physicalDiscrepancy.discrepancyQuantity`);
            }
        }
        const existing = (0, wms_assertions_1.normalizeOptionalString)(line.receiptLineId)
            ? (0, wms_assertions_1.assertExists)(existingById.get((0, wms_assertions_1.normalizeOptionalString)(line.receiptLineId)) ?? null, 'receipt_line', line.receiptLineId)
            : null;
        return {
            receiptLineId: existing?.receiptLineId ?? (0, node_crypto_1.randomUUID)(),
            receiptId: receipt.receiptId,
            lineNo,
            itemId: line.itemId.trim(),
            itemCode: existing?.itemCode ?? null,
            itemName: existing?.itemName ?? null,
            receivingExpectationId: (0, wms_assertions_1.normalizeOptionalString)(line.receivingExpectationId) ?? null,
            targetLocationId: line.targetLocationId.trim(),
            confirmedQuantity: (0, wms_assertions_1.assertPositiveQuantity)(line.confirmedQuantity, `lines[${lineNo - 1}].confirmedQuantity`),
            uom: line.uom.trim(),
            inventoryStatus,
            restrictedReason: inventoryStatus === wms_records_1.InventoryStatus.RESTRICTED ? structuredClone(line.restrictedReason) : null,
            trackingRefs: line.trackingRefs.map((trackingRef) => ({
                trackingRefType: trackingRef.trackingRefType,
                trackingRefValue: trackingRef.trackingRefValue.trim()
            })),
            physicalDiscrepancy: line.physicalDiscrepancy
                ? {
                    discrepancyType: line.physicalDiscrepancy.discrepancyType,
                    discrepancyQuantity: (0, wms_assertions_1.normalizeOptionalString)(line.physicalDiscrepancy.discrepancyQuantity) ?? null,
                    note: (0, wms_assertions_1.normalizeOptionalString)(line.physicalDiscrepancy.note) ?? null
                }
                : null,
            evidenceAttachmentRefs: line.evidenceAttachmentRefs.map((value) => value.trim()).filter(Boolean),
            postedStockLedgerEntryIds: [],
            createdAt: existing?.createdAt ?? updatedAt,
            updatedAt
        };
    }
};
exports.AddOrReplaceReceiptLinesHandler = AddOrReplaceReceiptLinesHandler;
exports.AddOrReplaceReceiptLinesHandler = AddOrReplaceReceiptLinesHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(add_or_replace_receipt_lines_command_1.AddOrReplaceReceiptLinesCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.RECEIPT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], AddOrReplaceReceiptLinesHandler);
//# sourceMappingURL=add-or-replace-receipt-lines.handler.js.map