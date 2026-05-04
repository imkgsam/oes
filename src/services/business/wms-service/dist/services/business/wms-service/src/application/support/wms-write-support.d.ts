import { ProcurementReceiptSummaryRecord, ReceiptRecord, RestrictedStatusReasonCode } from '../../domain/models/wms-records';
/** nowIso returns one current UTC timestamp string for command-side record creation and updates. */
export declare function nowIso(): string;
/** buildProcurementReceiptSummary derives the procurement-facing physical summary that WMS records locally after posting. */
export declare function buildProcurementReceiptSummary(receipt: ReceiptRecord, recordedAt: string): ProcurementReceiptSummaryRecord;
/** hasRestrictedLines reports whether one receipt has any restricted stock lines. */
export declare function hasRestrictedLines(receipt: ReceiptRecord): boolean;
/** hasPhysicalDiscrepancy reports whether one receipt contains any physical discrepancy fact. */
export declare function hasPhysicalDiscrepancy(receipt: ReceiptRecord): boolean;
/** restrictedReasonQuantity extracts one reason-specific restricted quantity total from a receipt line group. */
export declare function restrictedReasonQuantity(receipt: ReceiptRecord, reasonCode: RestrictedStatusReasonCode): string;
