"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nowIso = nowIso;
exports.buildProcurementReceiptSummary = buildProcurementReceiptSummary;
exports.hasRestrictedLines = hasRestrictedLines;
exports.hasPhysicalDiscrepancy = hasPhysicalDiscrepancy;
exports.restrictedReasonQuantity = restrictedReasonQuantity;
const wms_records_1 = require("../../domain/models/wms-records");
const wms_assertions_1 = require("./wms-assertions");
/** nowIso returns one current UTC timestamp string for command-side record creation and updates. */
function nowIso() {
    return new Date().toISOString();
}
/** buildProcurementReceiptSummary derives the procurement-facing physical summary that WMS records locally after posting. */
function buildProcurementReceiptSummary(receipt, recordedAt) {
    return {
        referencedReceivingExpectationIds: Array.from(new Set([
            ...receipt.referencedReceivingExpectationIds,
            ...receipt.lines
                .map((line) => line.receivingExpectationId ?? null)
                .filter((value) => typeof value === 'string' && value.length > 0)
        ])),
        totalConfirmedQuantity: (0, wms_assertions_1.sumQuantities)(receipt.lines.map((line) => line.confirmedQuantity)),
        restrictedQuantity: (0, wms_assertions_1.sumQuantities)(receipt.lines
            .filter((line) => line.inventoryStatus === 'RESTRICTED')
            .map((line) => line.confirmedQuantity)),
        discrepancyLines: receipt.lines
            .filter((line) => line.physicalDiscrepancy)
            .map((line) => ({
            receiptLineId: line.receiptLineId,
            discrepancyType: line.physicalDiscrepancy?.discrepancyType ?? wms_records_1.ReceiptPhysicalDiscrepancyType.OTHER,
            discrepancyQuantity: line.physicalDiscrepancy?.discrepancyQuantity ?? null
        })),
        recordedAt
    };
}
/** hasRestrictedLines reports whether one receipt has any restricted stock lines. */
function hasRestrictedLines(receipt) {
    return receipt.lines.some((line) => line.inventoryStatus === 'RESTRICTED');
}
/** hasPhysicalDiscrepancy reports whether one receipt contains any physical discrepancy fact. */
function hasPhysicalDiscrepancy(receipt) {
    return receipt.lines.some((line) => Boolean(line.physicalDiscrepancy));
}
/** restrictedReasonQuantity extracts one reason-specific restricted quantity total from a receipt line group. */
function restrictedReasonQuantity(receipt, reasonCode) {
    return (0, wms_assertions_1.sumQuantities)(receipt.lines
        .filter((line) => line.restrictedReason?.reasonCode === reasonCode)
        .map((line) => line.confirmedQuantity));
}
//# sourceMappingURL=wms-write-support.js.map